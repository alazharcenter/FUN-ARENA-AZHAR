-- =====================================================================
-- FUN ARENA AZHAR CENTER — Tahap 2: Quick Play
-- Semua aturan permainan dijalankan di server:
--   quick_play_catalog → daftar kategori + jumlah soal
--   start_quick_play   → membuat sesi & memilih soal acak
--   next_question      → mengirim SATU soal (tanpa kunci) + mulai timer server
--   submit_answer      → menilai jawaban, menghitung poin, baru membuka kunci & penjelasan
--   finish_quick_play  → menyimpan skor, XP, level, streak, progres per kategori
--   get_session_result → hasil + ulasan jawaban (hanya setelah sesi selesai)
--   my_recent_games    → riwayat singkat untuk dashboard
-- =====================================================================

-- Level: level n dimulai pada 100 × (n−1)² XP → 0, 100, 400, 900, 1600, ...
create function level_for_xp(p_xp integer) returns integer
language sql immutable set search_path = public as
$$ select floor(sqrt(greatest(p_xp, 0) / 100.0))::integer + 1 $$;

-- Samakan spasi & huruf agar jawaban susun kalimat dibandingkan dengan adil
create function normalize_answer(p_text text) returns text
language sql immutable set search_path = public as
$$ select lower(regexp_replace(trim(coalesce(p_text, '')), '\s+', ' ', 'g')) $$;

-- ---------------------------------------------------------------------
create function quick_play_catalog(p_arena arena_type)
returns table (
  category_slug text, category_name text, category_name_ar text,
  group_name text, group_name_ar text,
  beginner integer, intermediate integer, advanced integer
)
language sql stable security definer set search_path = public as
$$
  select c.slug, c.name, c.name_ar, g.name, g.name_ar,
         count(q.id) filter (where q.difficulty = 'beginner')::integer,
         count(q.id) filter (where q.difficulty = 'intermediate')::integer,
         count(q.id) filter (where q.difficulty = 'advanced')::integer
  from categories c
  join categories g on g.id = c.parent_id
  left join questions q
         on q.category_id = c.id and q.is_published
        and (q.institution_id is null or q.institution_id = my_institution())
  where c.arena = p_arena
  group by c.id, g.id
  order by g.sort_order, c.sort_order
$$;

-- ---------------------------------------------------------------------
create function start_quick_play(
  p_arena arena_type,
  p_category_slug text default null,
  p_difficulty difficulty default null,
  p_count integer default 10
) returns uuid
language plpgsql security definer set search_path = public as
$$
declare
  v_session  uuid;
  v_cat_name text;
  v_n        integer;
begin
  if auth.uid() is null then raise exception 'Silakan login terlebih dahulu'; end if;
  p_count := least(greatest(coalesce(p_count, 10), 1), 20);

  if p_category_slug is not null then
    select name into v_cat_name from categories where slug = p_category_slug and arena = p_arena;
    if v_cat_name is null then raise exception 'Kategori tidak ditemukan'; end if;
  end if;

  -- Hanya satu sesi Quick Play aktif per santri
  update game_sessions set status = 'abandoned', ended_at = now()
  where user_id = auth.uid() and room_id is null and status = 'active';

  insert into game_sessions (user_id, arena, settings)
  values (auth.uid(), p_arena, jsonb_build_object(
    'category_slug', p_category_slug,
    'category_name', coalesce(v_cat_name, 'Semua materi'),
    'difficulty', p_difficulty,
    'count', p_count))
  returning id into v_session;

  insert into game_questions (session_id, question_id, order_index)
  select v_session, pick.id, row_number() over (order by random())
  from (
    select q.id
    from questions q join categories c on c.id = q.category_id
    where q.is_published and c.arena = p_arena
      and (q.institution_id is null or q.institution_id = my_institution())
      and (p_category_slug is null or c.slug = p_category_slug)
      and (p_difficulty is null or q.difficulty = p_difficulty)
    order by random()
    limit p_count
  ) pick;

  get diagnostics v_n = row_count;
  if v_n = 0 then raise exception 'Belum ada soal untuk pilihan ini'; end if;
  return v_session;
end;
$$;

-- ---------------------------------------------------------------------
create function next_question(p_session_id uuid)
returns table (
  game_question_id uuid, order_index integer, total integer,
  game_type game_type, difficulty difficulty, variety arabic_variety,
  prompt text, prompt_ar text, image_url text, audio_url text,
  time_limit_sec integer, remaining_ms integer, options jsonb
)
language plpgsql security definer set search_path = public as
$$
#variable_conflict use_column
declare
  s       game_sessions%rowtype;
  gq      game_questions%rowtype;
  v_total integer;
begin
  select * into s from game_sessions gs where gs.id = p_session_id and gs.user_id = auth.uid();
  if s.id is null then raise exception 'Sesi tidak ditemukan'; end if;
  if s.status <> 'active' then return; end if;

  select count(*) into v_total from game_questions g where g.session_id = s.id;

  -- Soal yang sedang berjalan dan belum dijawab (mis. halaman di-refresh)
  select g.* into gq from game_questions g
  where g.session_id = s.id and g.served_at is not null
    and not exists (select 1 from player_answers a where a.game_question_id = g.id and a.user_id = auth.uid())
  order by g.order_index limit 1;

  -- Waktunya sudah habis → dicatat salah, lanjut ke soal berikutnya
  if gq.id is not null and now() > gq.deadline_at + interval '1 second' then
    insert into player_answers (game_question_id, user_id, is_correct, time_ms, points)
    values (gq.id, auth.uid(), false, (extract(epoch from gq.deadline_at - gq.served_at) * 1000)::integer, 0);
    gq := null;
  end if;

  if gq.id is null then
    select g.* into gq from game_questions g
    where g.session_id = s.id and g.served_at is null
    order by g.order_index limit 1;
    if gq.id is null then return; end if;            -- semua soal sudah dimainkan

    update game_questions g
    set served_at = now(), deadline_at = now() + make_interval(secs => q.time_limit_sec)
    from questions q
    where q.id = g.question_id and g.id = gq.id
    returning g.* into gq;
  end if;

  return query
  select gq.id, gq.order_index, v_total, q.game_type, q.difficulty, q.variety,
         q.prompt, q.prompt_ar, q.image_url, q.audio_url, q.time_limit_sec,
         greatest(0, (extract(epoch from gq.deadline_at - now()) * 1000)::integer),
         coalesce((
           select jsonb_agg(jsonb_build_object('id', o.id, 'label', o.label, 'is_arabic', o.is_arabic)
                            order by case when q.game_type = 'true_false' then o.position else random() end)
           from answer_options o where o.question_id = q.id
         ), '[]'::jsonb)
  from questions q where q.id = gq.question_id;
end;
$$;

-- ---------------------------------------------------------------------
create function submit_answer(p_game_question_id uuid, p_option_id uuid default null, p_text text default null)
returns table (is_correct boolean, points integer, correct_option_id uuid, correct_text text, explanation text)
language plpgsql security definer set search_path = public as
$$
#variable_conflict use_column
declare
  gq        game_questions%rowtype;
  k         answer_keys%rowtype;
  v_correct boolean;
  v_ms      integer;
  v_limit   integer;
  v_points  integer := 0;
begin
  select * into gq from game_questions g where g.id = p_game_question_id;
  if gq.id is null or gq.served_at is null then raise exception 'Soal tidak ditemukan'; end if;

  -- Hanya pemilik sesi solo atau anggota room sesi ini
  if not exists (
    select 1 from game_sessions s
    where s.id = gq.session_id and s.status = 'active'
      and (s.user_id = auth.uid() or (s.room_id is not null and is_room_member(s.room_id)))
  ) then raise exception 'Bukan peserta sesi ini'; end if;

  if exists (select 1 from player_answers a where a.game_question_id = gq.id and a.user_id = auth.uid()) then
    raise exception 'Soal ini sudah dijawab';
  end if;

  select * into k from answer_keys ak where ak.question_id = gq.question_id;
  v_ms := greatest(0, (extract(epoch from (now() - gq.served_at)) * 1000)::integer);

  if now() > gq.deadline_at + interval '1 second' then   -- toleransi jaringan 1 detik
    v_correct := false;                                  -- waktu habis
  elsif p_option_id is not null then
    v_correct := p_option_id = k.correct_option_id;
  else
    v_correct := cardinality(k.accepted_texts) > 0
                 and normalize_answer(p_text) in (select normalize_answer(t) from unnest(k.accepted_texts) t);
  end if;

  -- Benar = 100 + bonus kecepatan maks. 50. Akurasi tetap lebih penting dari kecepatan.
  if v_correct then
    select q.time_limit_sec into v_limit from questions q where q.id = gq.question_id;
    v_points := 100 + greatest(0, round(50 * (1 - v_ms::numeric / (v_limit * 1000))))::integer;
  end if;

  insert into player_answers (game_question_id, user_id, option_id, text_answer, is_correct, time_ms, points)
  values (gq.id, auth.uid(), p_option_id, p_text, v_correct, v_ms, v_points);

  return query
  select v_correct, v_points, k.correct_option_id, k.accepted_texts[1], q.explanation
  from questions q where q.id = gq.question_id;
end;
$$;

-- ---------------------------------------------------------------------
create function finish_quick_play(p_session_id uuid) returns void
language plpgsql security definer set search_path = public as
$$
declare
  s          game_sessions%rowtype;
  v_score    integer;
  v_correct  integer;
  v_answered integer;
  v_xp       integer;
  v_today    date := (now() at time zone 'Asia/Jakarta')::date;
begin
  select * into s from game_sessions gs
  where gs.id = p_session_id and gs.user_id = auth.uid() and gs.room_id is null
  for update;
  if s.id is null then raise exception 'Sesi tidak ditemukan'; end if;
  if s.status <> 'active' then return; end if;   -- sudah selesai: tidak dihitung dua kali

  -- Soal yang sudah tampil tetapi belum dijawab dianggap salah
  insert into player_answers (game_question_id, user_id, is_correct, time_ms, points)
  select g.id, auth.uid(), false, 0, 0
  from game_questions g
  where g.session_id = s.id and g.served_at is not null
    and not exists (select 1 from player_answers a where a.game_question_id = g.id and a.user_id = auth.uid());

  select coalesce(sum(a.points), 0), count(*) filter (where a.is_correct), count(*)
  into v_score, v_correct, v_answered
  from player_answers a join game_questions g on g.id = a.game_question_id
  where g.session_id = s.id and a.user_id = auth.uid();

  if v_answered = 0 then
    update game_sessions set status = 'abandoned', ended_at = now() where id = s.id;
    return;
  end if;

  v_xp := round(v_score / 10.0)::integer;

  update game_sessions set status = 'finished', ended_at = now() where id = s.id;

  insert into scores (session_id, user_id, institution_id, score, correct_count, answered_count, xp_earned)
  values (s.id, auth.uid(), my_institution(), v_score, v_correct, v_answered, v_xp);

  -- Streak dihitung per hari (WIB), bukan per permainan: menghargai konsistensi.
  update player_stats set
    xp             = xp + v_xp,
    level          = level_for_xp(xp + v_xp),
    total_games    = total_games + 1,
    total_answered = total_answered + v_answered,
    total_correct  = total_correct + v_correct,
    current_streak = case when last_played_on = v_today then current_streak
                          when last_played_on = v_today - 1 then current_streak + 1
                          else 1 end,
    longest_streak = greatest(longest_streak,
                       case when last_played_on = v_today then current_streak
                            when last_played_on = v_today - 1 then current_streak + 1
                            else 1 end),
    last_played_on = v_today
  where user_id = auth.uid();

  insert into player_progress (user_id, category_id, answered, correct)
  select auth.uid(), q.category_id, count(*), count(*) filter (where a.is_correct)
  from player_answers a
  join game_questions g on g.id = a.game_question_id
  join questions q on q.id = g.question_id
  where g.session_id = s.id and a.user_id = auth.uid()
  group by q.category_id
  on conflict (user_id, category_id) do update
    set answered   = player_progress.answered + excluded.answered,
        correct    = player_progress.correct + excluded.correct,
        updated_at = now();
end;
$$;

-- ---------------------------------------------------------------------
create function get_session_result(p_session_id uuid) returns jsonb
language plpgsql stable security definer set search_path = public as
$$
declare
  s game_sessions%rowtype;
  v jsonb;
begin
  select * into s from game_sessions gs where gs.id = p_session_id and gs.user_id = auth.uid();
  if s.id is null then raise exception 'Sesi tidak ditemukan'; end if;
  if s.status = 'active' then raise exception 'Permainan belum selesai'; end if;

  select jsonb_build_object(
    'status', s.status,
    'arena', s.arena,
    'settings', s.settings,
    'ended_at', s.ended_at,
    'score', coalesce(sc.score, 0),
    'correct_count', coalesce(sc.correct_count, 0),
    'answered_count', coalesce(sc.answered_count, 0),
    'xp_earned', coalesce(sc.xp_earned, 0),
    'total_xp', st.xp,
    'level', st.level,
    'review', coalesce((
      select jsonb_agg(jsonb_build_object(
        'order_index', g.order_index,
        'game_type', q.game_type,
        'prompt', q.prompt,
        'prompt_ar', q.prompt_ar,
        'your_answer', coalesce(yo.label, a.text_answer),
        'correct_answer', coalesce(co.label, k.accepted_texts[1]),
        'is_correct', a.is_correct,
        'points', a.points,
        'time_ms', a.time_ms,
        'explanation', q.explanation
      ) order by g.order_index)
      from game_questions g
      join questions q on q.id = g.question_id
      join player_answers a on a.game_question_id = g.id and a.user_id = auth.uid()
      left join answer_options yo on yo.id = a.option_id
      left join answer_keys k on k.question_id = q.id
      left join answer_options co on co.id = k.correct_option_id
      where g.session_id = s.id
    ), '[]'::jsonb)
  ) into v
  from player_stats st
  left join scores sc on sc.session_id = s.id and sc.user_id = auth.uid()
  where st.user_id = auth.uid();

  return v;
end;
$$;

-- ---------------------------------------------------------------------
create function my_recent_games(p_limit integer default 5)
returns table (
  session_id uuid, arena arena_type, category_name text,
  score integer, correct_count integer, answered_count integer, xp_earned integer, ended_at timestamptz
)
language sql stable security definer set search_path = public as
$$
  select s.id, s.arena, s.settings ->> 'category_name',
         sc.score, sc.correct_count, sc.answered_count, sc.xp_earned, s.ended_at
  from game_sessions s
  join scores sc on sc.session_id = s.id and sc.user_id = auth.uid()
  where s.user_id = auth.uid() and s.status = 'finished'
  order by s.ended_at desc
  limit least(greatest(coalesce(p_limit, 5), 1), 50)
$$;

-- ---------------------------------------------------------------------
-- Hak eksekusi: fungsi permainan hanya untuk pengguna yang sudah login.
revoke execute on function
  quick_play_catalog(arena_type),
  start_quick_play(arena_type, text, difficulty, integer),
  next_question(uuid),
  submit_answer(uuid, uuid, text),
  finish_quick_play(uuid),
  get_session_result(uuid),
  my_recent_games(integer)
from public, anon;

grant execute on function
  quick_play_catalog(arena_type),
  start_quick_play(arena_type, text, difficulty, integer),
  next_question(uuid),
  submit_answer(uuid, uuid, text),
  finish_quick_play(uuid),
  get_session_result(uuid),
  my_recent_games(integer)
to authenticated;

-- Fungsi trigger tidak perlu dipanggil langsung lewat API
revoke execute on function handle_new_user() from public, anon, authenticated;
