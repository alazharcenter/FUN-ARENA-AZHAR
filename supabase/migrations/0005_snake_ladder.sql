-- =====================================================================
-- FUN ARENA AZHAR CENTER — Tahap 4: Arabic Snake & Ladder (سُلَّمُ الْعَرَبِيَّةِ)
-- Mode lokal: 1–6 pemain bergantian di satu perangkat.
--   * Dadu & langkah bidak dihitung di perangkat (semua pemain di depan layar yang sama).
--   * Soal tetap dipilih & dinilai server: kunci jawaban tidak pernah dikirim sebelum menjawab.
--   * XP hanya diberikan pada mode 1 pemain (jawaban mode bergiliran bukan milik satu akun).
-- =====================================================================

-- Inti penyelesaian sesi, dipakai Quick Play dan Ular Tangga.
-- p_award = false → skor tercatat, tetapi XP/statistik/progres pemilik akun tidak berubah.
create function private.finish_session(p_session_id uuid, p_award boolean) returns void
language plpgsql set search_path = public, private as
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

  v_xp := case when p_award then round(v_score / 10.0)::integer else 0 end;

  update game_sessions set status = 'finished', ended_at = now() where id = s.id;

  insert into scores (session_id, user_id, institution_id, score, correct_count, answered_count, xp_earned)
  values (s.id, auth.uid(), my_institution(), v_score, v_correct, v_answered, v_xp);

  if not p_award then return; end if;

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
revoke execute on function private.finish_session(uuid, boolean) from public, anon, authenticated;

-- Quick Play: perilaku tetap sama, kini memakai fungsi inti
create or replace function finish_quick_play(p_session_id uuid) returns void
language plpgsql security definer set search_path = public, private as
$$
begin
  perform private.finish_session(p_session_id, true);
end;
$$;

-- ---------------------------------------------------------------------
create function start_snake_game(
  p_mode text,                         -- casual | mixed | qowaid
  p_difficulty difficulty default null,
  p_players integer default 1,
  p_time_limit integer default null    -- detik; null = sesuai soal
) returns uuid
language plpgsql security definer set search_path = public, private as
$$
declare v_session uuid;
begin
  if auth.uid() is null then raise exception 'Silakan login terlebih dahulu'; end if;
  if p_mode not in ('casual', 'mixed', 'qowaid') then raise exception 'Mode tidak dikenal'; end if;
  if p_players not between 1 and 6 then raise exception 'Jumlah pemain lokal 1–6'; end if;
  if p_time_limit is not null and p_time_limit not between 10 and 90 then raise exception 'Durasi menjawab 10–90 detik'; end if;

  update game_sessions set status = 'abandoned', ended_at = now()
  where user_id = auth.uid() and room_id is null and status = 'active';

  insert into game_sessions (user_id, arena, settings)
  values (auth.uid(), 'snake_ladder', jsonb_build_object(
    'mode', p_mode,
    'difficulty', p_difficulty,
    'players', p_players,
    'time_limit', p_time_limit,
    'category_name', 'Ular Tangga · ' || initcap(p_mode)))
  returning id into v_session;
  return v_session;
end;
$$;

-- ---------------------------------------------------------------------
-- Ambil soal untuk petak tantangan. Soal yang sedang tampil & belum dijawab
-- dikembalikan lagi (mis. halaman di-refresh) agar pemain tidak bisa "memilih" soal.
create function snake_question(p_session_id uuid, p_tile text, p_harder boolean default false)
returns table (
  game_question_id uuid, order_index integer, total integer,
  game_type game_type, difficulty difficulty, variety arabic_variety,
  prompt text, prompt_ar text, image_url text, audio_url text,
  time_limit_sec integer, remaining_ms integer, options jsonb
)
language plpgsql security definer set search_path = public, private as
$$
#variable_conflict use_column
declare
  s      game_sessions%rowtype;
  gq     game_questions%rowtype;
  v_diff difficulty;
  v_qid  uuid;
  v_time integer;
begin
  select * into s from game_sessions gs
  where gs.id = p_session_id and gs.user_id = auth.uid() and gs.arena = 'snake_ladder';
  if s.id is null then raise exception 'Sesi tidak ditemukan'; end if;
  if s.status <> 'active' then raise exception 'Permainan sudah selesai'; end if;
  if p_tile not in ('mufrodat', 'terjemah', 'muhadatsah', 'qowaid', 'nahwu', 'shorof') then
    raise exception 'Jenis petak tidak dikenal';
  end if;

  -- Soal yang masih berjalan
  select g.* into gq from game_questions g
  where g.session_id = s.id and g.served_at is not null
    and not exists (select 1 from player_answers a where a.game_question_id = g.id and a.user_id = auth.uid())
  order by g.order_index desc limit 1;

  if gq.id is not null and now() > gq.deadline_at + interval '1 second' then
    insert into player_answers (game_question_id, user_id, is_correct, time_ms, points)
    values (gq.id, auth.uid(), false, (extract(epoch from gq.deadline_at - gq.served_at) * 1000)::integer, 0);
    gq := null;
  end if;

  if gq.id is null then
    v_diff := case when p_harder then 'advanced'::difficulty else (s.settings ->> 'difficulty')::difficulty end;

    -- Prioritas: belum dipakai di sesi ini → tingkat sesuai → acak
    select q.id into v_qid
    from questions q
    join categories c on c.id = q.category_id
    join categories g on g.id = c.parent_id
    where q.is_published
      and (q.institution_id is null or q.institution_id = my_institution())
      and case p_tile
            when 'mufrodat'   then g.slug = 'mufrodat-kosakata' and q.game_type <> 'arabic_translation'
            when 'terjemah'   then c.arena = 'mufrodat' and q.game_type in ('arabic_translation', 'vocabulary_challenge', 'amiyah_challenge')
            when 'muhadatsah' then g.slug = 'mufrodat-percakapan'
            when 'qowaid'     then c.arena = 'qowaid'
            when 'nahwu'      then g.slug in ('qowaid-nahwu', 'qowaid-irab')
            when 'shorof'     then g.slug = 'qowaid-shorof'
          end
    order by exists (select 1 from game_questions u where u.session_id = s.id and u.question_id = q.id),
             (v_diff is null or q.difficulty = v_diff) desc,
             random()
    limit 1;
    if v_qid is null then raise exception 'Belum ada soal untuk petak ini'; end if;

    select coalesce((s.settings ->> 'time_limit')::integer, q.time_limit_sec) into v_time
    from questions q where q.id = v_qid;

    insert into game_questions (session_id, question_id, order_index, served_at, deadline_at)
    values (s.id, v_qid,
            coalesce((select max(g2.order_index) from game_questions g2 where g2.session_id = s.id), 0) + 1,
            now(), now() + make_interval(secs => v_time))
    returning * into gq;
  end if;

  return query
  select gq.id, gq.order_index, gq.order_index, q.game_type, q.difficulty, q.variety,
         q.prompt, q.prompt_ar, q.image_url, q.audio_url,
         (extract(epoch from gq.deadline_at - gq.served_at))::integer,
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
create function finish_snake_game(p_session_id uuid) returns void
language plpgsql security definer set search_path = public, private as
$$
declare v_players integer;
begin
  select (settings ->> 'players')::integer into v_players
  from game_sessions where id = p_session_id and user_id = auth.uid() and arena = 'snake_ladder';
  if v_players is null then raise exception 'Sesi tidak ditemukan'; end if;
  perform private.finish_session(p_session_id, v_players = 1);
end;
$$;

-- Bonus kecepatan di submit_answer memakai batas waktu yang benar-benar dipakai sesi
-- (Ular Tangga bisa mengatur durasi menjawab sendiri).
create or replace function submit_answer(p_game_question_id uuid, p_option_id uuid default null, p_text text default null)
returns table (is_correct boolean, points integer, correct_option_id uuid, correct_text text, explanation text)
language plpgsql security definer set search_path = public, private as
$$
#variable_conflict use_column
declare
  gq        game_questions%rowtype;
  k         answer_keys%rowtype;
  v_correct boolean;
  v_ms      integer;
  v_limit   numeric;
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
    v_limit := greatest(extract(epoch from gq.deadline_at - gq.served_at) * 1000, 1);
    v_points := 100 + greatest(0, round(50 * (1 - v_ms / v_limit)))::integer;
  end if;

  insert into player_answers (game_question_id, user_id, option_id, text_answer, is_correct, time_ms, points)
  values (gq.id, auth.uid(), p_option_id, p_text, v_correct, v_ms, v_points);

  return query
  select v_correct, v_points, k.correct_option_id, k.accepted_texts[1], q.explanation
  from questions q where q.id = gq.question_id;
end;
$$;

revoke execute on function
  start_snake_game(text, difficulty, integer, integer),
  snake_question(uuid, text, boolean),
  finish_snake_game(uuid)
from public, anon;

grant execute on function
  start_snake_game(text, difficulty, integer, integer),
  snake_question(uuid, text, boolean),
  finish_snake_game(uuid)
to authenticated;
