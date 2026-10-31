-- =====================================================================
-- FUN ARENA AZHAR CENTER — Tahap 6: Guru & Admin
--   * Kelas + kode kelas, anggota kelas, statistik santri, materi yang paling sering salah
--   * Bank soal: tambah/ubah/arsip, impor CSV, paket soal
--   * Tantangan kelas (bonus XP, selesai otomatis)
--   * Admin: peran pengguna, statistik platform, lembaga & kategori
-- Semua pemeriksaan peran dilakukan di server.
-- =====================================================================

-- ---------- Pemeriksaan peran ----------
create function private.require_staff() returns void
language plpgsql stable set search_path = public, private as
$$ begin if not coalesce(is_staff(), false) then raise exception 'Khusus guru atau admin'; end if; end $$;

create function private.is_admin() returns boolean
language sql stable set search_path = public, private as
$$ select coalesce(my_role() in ('institution_admin', 'super_admin'), false) $$;

create function private.can_manage_class(p_class uuid) returns boolean
language sql stable security definer set search_path = public, private as
$$
  select exists (
    select 1 from classes c
    where c.id = p_class and c.institution_id = my_institution()
      and (c.teacher_id = auth.uid() or private.is_admin())
  )
$$;

create function private.is_class_member(p_class uuid) returns boolean
language sql stable security definer set search_path = public, private as
$$ select exists (select 1 from class_members where class_id = p_class and student_id = auth.uid()) $$;

create function private.new_class_code() returns text
language plpgsql set search_path = public, private as
$$
declare
  v_code text;
  v_abc  text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
begin
  loop
    v_code := '';
    for i in 1..6 loop
      v_code := v_code || substr(v_abc, 1 + floor(random() * length(v_abc))::integer, 1);
    end loop;
    exit when not exists (select 1 from classes where join_code = v_code);
  end loop;
  return v_code;
end;
$$;

-- =====================================================================
-- KELAS
-- =====================================================================
create function create_class(p_name text, p_level difficulty default 'beginner') returns uuid
language plpgsql security definer set search_path = public, private as
$$
declare v_id uuid;
begin
  perform private.require_staff();
  if length(trim(coalesce(p_name, ''))) not between 2 and 60 then raise exception 'Nama kelas 2–60 karakter'; end if;
  insert into classes (institution_id, teacher_id, name, level, join_code)
  values (my_institution(), auth.uid(), trim(p_name), coalesce(p_level, 'beginner'), private.new_class_code())
  returning id into v_id;
  return v_id;
end;
$$;

create function update_class(p_class uuid, p_name text, p_level difficulty, p_new_code boolean default false) returns void
language plpgsql security definer set search_path = public, private as
$$
begin
  if not private.can_manage_class(p_class) then raise exception 'Kelas tidak ditemukan'; end if;
  if length(trim(coalesce(p_name, ''))) not between 2 and 60 then raise exception 'Nama kelas 2–60 karakter'; end if;
  update classes set name = trim(p_name), level = coalesce(p_level, level),
         join_code = case when p_new_code then private.new_class_code() else join_code end
  where id = p_class;
end;
$$;

create function delete_class(p_class uuid) returns void
language plpgsql security definer set search_path = public, private as
$$
begin
  if not private.can_manage_class(p_class) then raise exception 'Kelas tidak ditemukan'; end if;
  delete from classes where id = p_class;
end;
$$;

create function join_class(p_code text) returns jsonb
language plpgsql security definer set search_path = public, private as
$$
declare c classes%rowtype;
begin
  if auth.uid() is null then raise exception 'Silakan login terlebih dahulu'; end if;
  select * into c from classes where join_code = upper(trim(p_code));
  if c.id is null then raise exception 'Kode kelas tidak ditemukan'; end if;
  if c.institution_id is distinct from my_institution() then raise exception 'Kelas ini milik lembaga lain'; end if;
  if c.teacher_id = auth.uid() then raise exception 'Kamu adalah guru kelas ini'; end if;
  insert into class_members (class_id, student_id) values (c.id, auth.uid()) on conflict do nothing;
  return jsonb_build_object('id', c.id, 'name', c.name);
end;
$$;

create function leave_class(p_class uuid) returns void
language sql security definer set search_path = public, private as
$$ delete from class_members where class_id = p_class and student_id = auth.uid() $$;

create function remove_class_member(p_class uuid, p_student uuid) returns void
language plpgsql security definer set search_path = public, private as
$$
begin
  if not private.can_manage_class(p_class) then raise exception 'Kelas tidak ditemukan'; end if;
  delete from class_members where class_id = p_class and student_id = p_student;
end;
$$;

-- Kelas saya: guru → kelas yang dikelola; santri → kelas yang diikuti
create function my_classes()
returns table (id uuid, name text, level difficulty, join_code text, teacher_name text, members integer, is_manager boolean, created_at timestamptz)
language sql stable security definer set search_path = public, private as
$$
  select c.id, c.name, c.level,
         case when private.can_manage_class(c.id) then c.join_code end,
         coalesce(nullif(t.full_name, ''), t.nickname),
         (select count(*)::integer from class_members m where m.class_id = c.id),
         private.can_manage_class(c.id), c.created_at
  from classes c join profiles t on t.id = c.teacher_id
  where c.institution_id = my_institution()
    and (private.can_manage_class(c.id) or private.is_class_member(c.id))
  order by c.created_at desc
$$;

-- Ringkasan kelas untuk guru: santri, statistik, materi lemah, tantangan
create function class_overview(p_class uuid) returns jsonb
language plpgsql stable security definer set search_path = public, private as
$$
declare
  v_out jsonb;
  v_week timestamptz := date_trunc('week', now() at time zone 'Asia/Jakarta') at time zone 'Asia/Jakarta';
begin
  if not private.can_manage_class(p_class) then raise exception 'Kelas tidak ditemukan'; end if;

  select jsonb_build_object(
    'class', (select jsonb_build_object('id', c.id, 'name', c.name, 'level', c.level, 'join_code', c.join_code,
                                        'teacher_name', coalesce(nullif(t.full_name, ''), t.nickname), 'created_at', c.created_at)
              from classes c join profiles t on t.id = c.teacher_id where c.id = p_class),
    'members', coalesce((
      select jsonb_agg(jsonb_build_object(
        'user_id', p.id, 'nickname', p.nickname, 'full_name', p.full_name, 'joined_at', m.joined_at,
        'xp', st.xp, 'level', st.level, 'games', st.total_games, 'answered', st.total_answered, 'correct', st.total_correct,
        'accuracy', case when st.total_answered > 0 then round(100.0 * st.total_correct / st.total_answered) end,
        'streak', st.current_streak, 'last_played_on', st.last_played_on,
        'week_score', (select coalesce(sum(s.score), 0) from scores s where s.user_id = p.id and s.created_at >= v_week)
      ) order by p.nickname)
      from class_members m join profiles p on p.id = m.student_id join player_stats st on st.user_id = p.id
      where m.class_id = p_class), '[]'::jsonb),
    -- Materi yang paling sering salah (minimal 3 jawaban di kelas ini)
    'weak_topics', coalesce((
      select jsonb_agg(w order by w.accuracy, w.answered desc) from (
        select c.slug, c.name, c.name_ar, g.name group_name, c.arena,
               sum(pp.answered)::integer answered, sum(pp.correct)::integer correct,
               round(100.0 * sum(pp.correct) / nullif(sum(pp.answered), 0)) accuracy,
               count(distinct pp.user_id)::integer students
        from player_progress pp
        join class_members m on m.student_id = pp.user_id and m.class_id = p_class
        join categories c on c.id = pp.category_id
        join categories g on g.id = c.parent_id
        group by c.id, g.id
        having sum(pp.answered) >= 3
        order by 8, 6 desc
        limit 8
      ) w), '[]'::jsonb)
  ) into v_out;
  return v_out;
end;
$$;

-- Progres satu santri per materi (guru kelasnya, atau santri itu sendiri)
create function student_progress(p_student uuid) returns jsonb
language plpgsql stable security definer set search_path = public, private as
$$
begin
  if p_student <> auth.uid() and not exists (
    select 1 from class_members m where m.student_id = p_student and private.can_manage_class(m.class_id)
  ) then
    raise exception 'Tidak punya akses';
  end if;
  return jsonb_build_object(
    'profile', (select jsonb_build_object('nickname', p.nickname, 'full_name', p.full_name) from profiles p where p.id = p_student),
    'stats', (select to_jsonb(s) - 'user_id' from player_stats s where s.user_id = p_student),
    'topics', coalesce((
      select jsonb_agg(jsonb_build_object('name', c.name, 'name_ar', c.name_ar, 'group_name', g.name, 'arena', c.arena,
                                          'answered', pp.answered, 'correct', pp.correct,
                                          'accuracy', round(100.0 * pp.correct / nullif(pp.answered, 0)))
                       order by round(100.0 * pp.correct / nullif(pp.answered, 0)), pp.answered desc)
      from player_progress pp join categories c on c.id = pp.category_id join categories g on g.id = c.parent_id
      where pp.user_id = p_student), '[]'::jsonb),
    'recent', coalesce((
      select jsonb_agg(r) from (
        select s.settings ->> 'category_name' category_name, s.arena, sc.score, sc.correct_count, sc.answered_count, s.ended_at
        from scores sc join game_sessions s on s.id = sc.session_id
        where sc.user_id = p_student order by s.ended_at desc nulls last limit 10) r), '[]'::jsonb)
  );
end;
$$;

-- Leaderboard kelas (anggota atau pengelola kelas)
create function class_leaderboard(p_class uuid, p_period text default 'week')
returns table (rank bigint, user_id uuid, nickname text, total_score bigint, games bigint, is_me boolean)
language sql stable security definer set search_path = public, private as
$$
  with allowed as (select private.can_manage_class(p_class) or private.is_class_member(p_class) ok),
  agg as (
    select m.student_id user_id, coalesce(sum(s.score), 0)::bigint total, count(s.session_id)::bigint games
    from class_members m
    left join scores s on s.user_id = m.student_id
      and s.created_at >= case p_period
            when 'today' then date_trunc('day', now() at time zone 'Asia/Jakarta') at time zone 'Asia/Jakarta'
            when 'week'  then date_trunc('week', now() at time zone 'Asia/Jakarta') at time zone 'Asia/Jakarta'
            else '-infinity'::timestamptz end
      and not exists (select 1 from game_sessions gs where gs.id = s.session_id and gs.room_id is null
                      and gs.arena = 'snake_ladder' and coalesce((gs.settings ->> 'players')::integer, 1) > 1)
    where m.class_id = p_class and (select ok from allowed)
    group by m.student_id
  )
  select rank() over (order by a.total desc), a.user_id, coalesce(nullif(p.nickname, ''), 'Pemain'), a.total, a.games, a.user_id = auth.uid()
  from agg a join profiles p on p.id = a.user_id
  order by 1, 3
$$;

-- =====================================================================
-- BANK SOAL
-- =====================================================================
create function private.arena_game_types(p_arena arena_type) returns game_type[]
language sql immutable as
$$
  select case p_arena
    when 'mufrodat' then array['vocabulary_challenge', 'arabic_translation', 'complete_expression', 'sentence_builder',
                               'picture_vocabulary', 'daily_conversation', 'listening_challenge', 'true_false',
                               'context_challenge', 'amiyah_challenge']::game_type[]
    else array['irab_challenge', 'nahwu_battle', 'tashrif_battle', 'grammar_detective', 'complete_rule',
               'sentence_analysis', 'fiil_challenge', 'identify_word', 'grammar_duel', 'sentence_builder']::game_type[]
  end
$$;

-- Validasi & simpan satu soal (dipakai formulir & impor CSV). p_id null = soal baru.
create function private.save_question_core(p_id uuid, p jsonb) returns uuid
language plpgsql set search_path = public, private as
$$
declare
  v_cat     categories%rowtype;
  v_type    game_type;
  v_q       questions%rowtype;
  v_opts    text[];
  v_acc     text[];
  v_correct integer;
  v_n       integer;
  v_id      uuid;
  v_inst    uuid := my_institution();
  v_time    integer;
  v_opt_id  uuid;
begin
  select * into v_cat from categories where slug = p ->> 'category_slug' and parent_id is not null;
  if v_cat.id is null then raise exception 'Kategori "%" tidak dikenal', p ->> 'category_slug'; end if;
  begin
    v_type := (p ->> 'game_type')::game_type;
  exception when others then
    raise exception 'Jenis permainan "%" tidak dikenal', p ->> 'game_type';
  end;
  if not v_type = any (private.arena_game_types(v_cat.arena)) then
    raise exception 'Jenis % tidak cocok untuk arena %', v_type, v_cat.arena;
  end if;
  if coalesce(p ->> 'difficulty', '') not in ('beginner', 'intermediate', 'advanced') then raise exception 'Tingkat harus beginner/intermediate/advanced'; end if;
  if coalesce(p ->> 'variety', 'fusha') not in ('fusha', 'amiyah_mesir') then raise exception 'Ragam harus fusha atau amiyah_mesir'; end if;
  if length(trim(coalesce(p ->> 'prompt', ''))) < 3 then raise exception 'Pertanyaan wajib diisi'; end if;
  if length(trim(coalesce(p ->> 'explanation', ''))) < 3 then raise exception 'Penjelasan wajib diisi'; end if;
  v_time := coalesce(nullif(p ->> 'time_limit_sec', '')::integer,
                     case when v_type = 'sentence_builder' then 45 else
                       case p ->> 'difficulty' when 'beginner' then 20 when 'intermediate' then 25 else 30 end end);
  if v_time not between 5 and 300 then raise exception 'Waktu menjawab 5–300 detik'; end if;

  select array_agg(trim(x) order by ord) into v_opts
  from jsonb_array_elements_text(coalesce(p -> 'options', '[]'::jsonb)) with ordinality t(x, ord)
  where trim(x) <> '';
  v_n := coalesce(array_length(v_opts, 1), 0);
  if v_n < 2 or v_n > 6 then raise exception 'Pilihan/potongan kata 2–6 buah'; end if;
  if (select count(distinct x) from unnest(v_opts) x) <> v_n then raise exception 'Ada pilihan yang sama'; end if;

  if v_type = 'sentence_builder' then
    select array_agg(regexp_replace(trim(x), '\s+', ' ', 'g')) into v_acc
    from jsonb_array_elements_text(coalesce(p -> 'accepted', '[]'::jsonb)) x where trim(x) <> '';
    if coalesce(array_length(v_acc, 1), 0) = 0 then raise exception 'Isi minimal satu susunan kalimat yang benar'; end if;
    if exists (
      select 1 from unnest(v_acc) a
      where (select array_agg(w order by w) from unnest(string_to_array(a, ' ')) w)
            is distinct from (select array_agg(w order by w) from unnest(v_opts) w)
    ) then
      raise exception 'Susunan benar harus memakai semua potongan kata tepat satu kali';
    end if;
  else
    v_correct := (p ->> 'correct')::integer;
    if v_correct is null or v_correct not between 1 and v_n then raise exception 'Tentukan jawaban benar (nomor 1–%)', v_n; end if;
    if v_type = 'true_false' and v_opts <> array['Benar', 'Salah'] then raise exception 'Soal benar/salah harus berpilihan "Benar" dan "Salah"'; end if;
  end if;

  if p_id is null then
    insert into questions (institution_id, category_id, game_type, difficulty, variety, prompt, prompt_ar, explanation,
                           image_url, audio_url, time_limit_sec, is_published, created_by)
    values (v_inst, v_cat.id, v_type, (p ->> 'difficulty')::difficulty, coalesce(p ->> 'variety', 'fusha')::arabic_variety,
            trim(p ->> 'prompt'), nullif(trim(coalesce(p ->> 'prompt_ar', '')), ''), trim(p ->> 'explanation'),
            nullif(p ->> 'image_url', ''), nullif(p ->> 'audio_url', ''), v_time,
            coalesce((p ->> 'is_published')::boolean, true), auth.uid())
    returning id into v_id;
  else
    select * into v_q from questions where id = p_id;
    if v_q.id is null then raise exception 'Soal tidak ditemukan'; end if;
    if v_q.institution_id is null and my_role() <> 'super_admin' then raise exception 'Soal bawaan hanya bisa diubah super admin'; end if;
    if v_q.institution_id is not null and v_q.institution_id <> v_inst then raise exception 'Soal tidak ditemukan'; end if;
    update questions set category_id = v_cat.id, game_type = v_type, difficulty = (p ->> 'difficulty')::difficulty,
           variety = coalesce(p ->> 'variety', 'fusha')::arabic_variety, prompt = trim(p ->> 'prompt'),
           prompt_ar = nullif(trim(coalesce(p ->> 'prompt_ar', '')), ''), explanation = trim(p ->> 'explanation'),
           image_url = nullif(p ->> 'image_url', ''), audio_url = nullif(p ->> 'audio_url', ''), time_limit_sec = v_time,
           is_published = coalesce((p ->> 'is_published')::boolean, is_published), updated_at = now()
    where id = p_id;
    v_id := p_id;
  end if;

  -- Pilihan disimpan per posisi; pilihan yang sudah pernah dijawab tidak dihapus
  for i in 1..v_n loop
    update answer_options set label = v_opts[i], is_arabic = v_opts[i] ~ '[؀-ۿ]' where question_id = v_id and position = i;
    if not found then
      insert into answer_options (question_id, label, is_arabic, position) values (v_id, v_opts[i], v_opts[i] ~ '[؀-ۿ]', i);
    end if;
  end loop;
  if exists (select 1 from answer_options o join player_answers a on a.option_id = o.id where o.question_id = v_id and o.position > v_n) then
    raise exception 'Soal ini sudah dimainkan; jumlah pilihan tidak bisa dikurangi';
  end if;
  delete from answer_options where question_id = v_id and position > v_n;

  if v_type = 'sentence_builder' then
    insert into answer_keys (question_id, correct_option_id, accepted_texts) values (v_id, null, v_acc)
    on conflict (question_id) do update set correct_option_id = null, accepted_texts = excluded.accepted_texts;
  else
    select id into v_opt_id from answer_options where question_id = v_id and position = v_correct;
    insert into answer_keys (question_id, correct_option_id, accepted_texts) values (v_id, v_opt_id, '{}')
    on conflict (question_id) do update set correct_option_id = excluded.correct_option_id, accepted_texts = '{}';
  end if;
  return v_id;
end;
$$;

create function save_question(p_id uuid, p_data jsonb) returns uuid
language plpgsql security definer set search_path = public, private as
$$
begin
  perform private.require_staff();
  return private.save_question_core(p_id, p_data);
end;
$$;

-- Impor banyak soal sekaligus. Semua berhasil atau tidak ada yang masuk.
create function import_questions(p_rows jsonb) returns integer
language plpgsql security definer set search_path = public, private as
$$
declare
  v_row jsonb;
  v_i integer := 0;
begin
  perform private.require_staff();
  if jsonb_array_length(p_rows) > 500 then raise exception 'Maksimal 500 soal per impor'; end if;
  for v_row in select * from jsonb_array_elements(p_rows) loop
    v_i := v_i + 1;
    begin
      perform private.save_question_core(null, v_row);
    exception when others then
      raise exception 'Baris %: %', coalesce(v_row ->> '_line', v_i::text), sqlerrm;
    end;
  end loop;
  return v_i;
end;
$$;

-- Hapus; jika sudah pernah dimainkan → diarsipkan (tidak terbit) agar riwayat tetap utuh
create function delete_question(p_id uuid) returns text
language plpgsql security definer set search_path = public, private as
$$
declare v_q questions%rowtype;
begin
  perform private.require_staff();
  select * into v_q from questions where id = p_id;
  if v_q.id is null or (v_q.institution_id is null and my_role() <> 'super_admin')
     or (v_q.institution_id is not null and v_q.institution_id <> my_institution()) then
    raise exception 'Soal tidak ditemukan atau tidak bisa dihapus';
  end if;
  if exists (select 1 from game_questions where question_id = p_id) then
    update questions set is_published = false, updated_at = now() where id = p_id;
    return 'archived';
  end if;
  delete from questions where id = p_id;
  return 'deleted';
end;
$$;

create function get_question(p_id uuid) returns jsonb
language plpgsql stable security definer set search_path = public, private as
$$
declare v jsonb;
begin
  perform private.require_staff();
  select jsonb_build_object(
    'id', q.id, 'category_slug', c.slug, 'arena', c.arena, 'game_type', q.game_type, 'difficulty', q.difficulty,
    'variety', q.variety, 'prompt', q.prompt, 'prompt_ar', q.prompt_ar, 'explanation', q.explanation,
    'image_url', q.image_url, 'audio_url', q.audio_url, 'time_limit_sec', q.time_limit_sec, 'is_published', q.is_published,
    'is_global', q.institution_id is null,
    'editable', (q.institution_id is null and my_role() = 'super_admin') or q.institution_id = my_institution(),
    'options', (select jsonb_agg(o.label order by o.position) from answer_options o where o.question_id = q.id),
    'correct', (select o.position from answer_options o where o.id = k.correct_option_id),
    'accepted', to_jsonb(k.accepted_texts),
    'played', exists (select 1 from game_questions g where g.question_id = q.id))
  into v
  from questions q join categories c on c.id = q.category_id left join answer_keys k on k.question_id = q.id
  where q.id = p_id and (q.institution_id is null or q.institution_id = my_institution());
  if v is null then raise exception 'Soal tidak ditemukan'; end if;
  return v;
end;
$$;

-- Daftar bank soal + statistik jawaban (untuk menemukan soal yang sering salah)
create function bank_questions(
  p_arena arena_type default null, p_category text default null, p_game_type game_type default null,
  p_difficulty difficulty default null, p_source text default 'all', p_search text default null
)
returns table (
  id uuid, category_slug text, category_name text, arena arena_type, game_type game_type, difficulty difficulty,
  variety arabic_variety, prompt text, prompt_ar text, is_published boolean, is_global boolean, editable boolean,
  times_answered integer, accuracy integer, created_at timestamptz
)
language plpgsql stable security definer set search_path = public, private as
$$
begin
  perform private.require_staff();
  return query
  select q.id, c.slug, c.name, c.arena, q.game_type, q.difficulty, q.variety, q.prompt, q.prompt_ar, q.is_published,
         q.institution_id is null,
         (q.institution_id is null and my_role() = 'super_admin') or q.institution_id = my_institution(),
         coalesce(st.n, 0)::integer, st.acc::integer, q.created_at
  from questions q
  join categories c on c.id = q.category_id
  left join lateral (
    select count(*) n, round(100.0 * count(*) filter (where a.is_correct) / nullif(count(*), 0)) acc
    from game_questions g join player_answers a on a.game_question_id = g.id
    join profiles pr on pr.id = a.user_id and pr.institution_id = my_institution()
    where g.question_id = q.id
  ) st on true
  where (q.institution_id is null or q.institution_id = my_institution())
    and (p_arena is null or c.arena = p_arena)
    and (p_category is null or c.slug = p_category)
    and (p_game_type is null or q.game_type = p_game_type)
    and (p_difficulty is null or q.difficulty = p_difficulty)
    and (p_source = 'all' or (p_source = 'global' and q.institution_id is null) or (p_source = 'mine' and q.institution_id is not null))
    and (p_search is null or q.prompt ilike '%' || p_search || '%' or q.prompt_ar ilike '%' || p_search || '%'
         or q.explanation ilike '%' || p_search || '%')
  order by q.created_at desc, q.prompt
  limit 500;
end;
$$;

-- ---------- Paket soal ----------
create function save_package(p_id uuid, p_name text, p_description text, p_class uuid, p_question_ids uuid[]) returns uuid
language plpgsql security definer set search_path = public, private as
$$
declare v_id uuid := p_id;
begin
  perform private.require_staff();
  if length(trim(coalesce(p_name, ''))) not between 2 and 80 then raise exception 'Nama paket 2–80 karakter'; end if;
  if p_class is not null and not private.can_manage_class(p_class) then raise exception 'Kelas tidak ditemukan'; end if;
  if coalesce(array_length(p_question_ids, 1), 0) = 0 then raise exception 'Pilih minimal satu soal'; end if;
  if exists (select 1 from unnest(p_question_ids) x left join questions q on q.id = x
             where q.id is null or not (q.institution_id is null or q.institution_id = my_institution())) then
    raise exception 'Ada soal yang tidak bisa dipakai';
  end if;
  if v_id is null then
    insert into question_packages (institution_id, owner_id, class_id, name, description)
    values (my_institution(), auth.uid(), p_class, trim(p_name), nullif(trim(coalesce(p_description, '')), ''))
    returning id into v_id;
  else
    update question_packages set name = trim(p_name), description = nullif(trim(coalesce(p_description, '')), ''), class_id = p_class
    where id = v_id and institution_id = my_institution();
    if not found then raise exception 'Paket tidak ditemukan'; end if;
    delete from package_questions where package_id = v_id;
  end if;
  insert into package_questions (package_id, question_id, position)
  select v_id, x, ord from unnest(p_question_ids) with ordinality t(x, ord) on conflict do nothing;
  return v_id;
end;
$$;

create function delete_package(p_id uuid) returns void
language plpgsql security definer set search_path = public, private as
$$
begin
  perform private.require_staff();
  delete from question_packages where id = p_id and institution_id = my_institution();
end;
$$;

create function my_packages()
returns table (id uuid, name text, description text, class_id uuid, class_name text, question_count integer, question_ids uuid[], created_at timestamptz)
language plpgsql stable security definer set search_path = public, private as
$$
begin
  perform private.require_staff();
  return query
  select p.id, p.name, p.description, p.class_id, c.name,
         (select count(*)::integer from package_questions x where x.package_id = p.id),
         (select array_agg(x.question_id order by x.position) from package_questions x where x.package_id = p.id),
         p.created_at
  from question_packages p left join classes c on c.id = p.class_id
  where p.institution_id = my_institution()
  order by p.created_at desc;
end;
$$;

-- =====================================================================
-- TANTANGAN KELAS
-- =====================================================================
create function save_challenge(p_id uuid, p jsonb) returns uuid
language plpgsql security definer set search_path = public, private as
$$
declare
  v_id uuid := p_id;
  v_class uuid := nullif(p ->> 'class_id', '')::uuid;
  v_pkg uuid := nullif(p ->> 'package_id', '')::uuid;
  v_cat uuid;
  v_arena arena_type := nullif(p ->> 'arena', '')::arena_type;
begin
  perform private.require_staff();
  if length(trim(coalesce(p ->> 'title', ''))) not between 3 and 80 then raise exception 'Judul tantangan 3–80 karakter'; end if;
  if v_class is not null and not private.can_manage_class(v_class) then raise exception 'Kelas tidak ditemukan'; end if;
  if v_pkg is not null and not exists (select 1 from question_packages where id = v_pkg and institution_id = my_institution()) then
    raise exception 'Paket soal tidak ditemukan';
  end if;
  if v_pkg is null and v_arena is null then raise exception 'Pilih arena atau paket soal'; end if;
  if nullif(p ->> 'category_slug', '') is not null then
    select id into v_cat from categories where slug = p ->> 'category_slug';
    if v_cat is null then raise exception 'Kategori tidak ditemukan'; end if;
  end if;
  if coalesce((p ->> 'target_count')::integer, 10) not between 3 and 30 then raise exception 'Jumlah soal 3–30'; end if;
  if coalesce((p ->> 'xp_reward')::integer, 50) not between 0 and 300 then raise exception 'Bonus XP 0–300'; end if;
  if (p ->> 'ends_on')::date < (p ->> 'starts_on')::date then raise exception 'Tanggal selesai sebelum tanggal mulai'; end if;

  if v_id is null then
    insert into daily_challenges (institution_id, class_id, kind, title, description, arena, category_id, difficulty,
                                  package_id, target_count, xp_reward, starts_on, ends_on, created_by)
    values (my_institution(), v_class, coalesce(nullif(p ->> 'kind', ''), 'teacher')::challenge_kind, trim(p ->> 'title'),
            nullif(trim(coalesce(p ->> 'description', '')), ''), v_arena, v_cat, nullif(p ->> 'difficulty', '')::difficulty,
            v_pkg, coalesce((p ->> 'target_count')::integer, 10), coalesce((p ->> 'xp_reward')::integer, 50),
            (p ->> 'starts_on')::date, (p ->> 'ends_on')::date, auth.uid())
    returning id into v_id;
  else
    update daily_challenges set class_id = v_class, kind = coalesce(nullif(p ->> 'kind', ''), 'teacher')::challenge_kind,
           title = trim(p ->> 'title'), description = nullif(trim(coalesce(p ->> 'description', '')), ''), arena = v_arena,
           category_id = v_cat, difficulty = nullif(p ->> 'difficulty', '')::difficulty, package_id = v_pkg,
           target_count = coalesce((p ->> 'target_count')::integer, 10), xp_reward = coalesce((p ->> 'xp_reward')::integer, 50),
           starts_on = (p ->> 'starts_on')::date, ends_on = (p ->> 'ends_on')::date
    where id = v_id and institution_id = my_institution();
    if not found then raise exception 'Tantangan tidak ditemukan'; end if;
  end if;
  return v_id;
end;
$$;

create function delete_challenge(p_id uuid) returns void
language plpgsql security definer set search_path = public, private as
$$
begin
  perform private.require_staff();
  delete from daily_challenges where id = p_id and institution_id = my_institution()
    and (class_id is null or private.can_manage_class(class_id));
end;
$$;

-- Tantangan yang terlihat oleh pengguna: santri → aktif hari ini untuk kelasnya / seluruh lembaga;
-- guru → semua tantangan lembaga beserta jumlah penyelesaian.
create function my_challenges(p_all boolean default false)
returns table (
  id uuid, title text, description text, kind challenge_kind, arena arena_type, category_slug text, category_name text,
  difficulty difficulty, package_id uuid, package_name text, target_count integer, xp_reward integer,
  starts_on date, ends_on date, class_id uuid, class_name text, completed boolean, completions integer, audience integer
)
language sql stable security definer set search_path = public, private as
$$
  select d.id, d.title, d.description, d.kind, d.arena, c.slug, c.name, d.difficulty, d.package_id, p.name,
         d.target_count, d.xp_reward, d.starts_on, d.ends_on, d.class_id, cl.name,
         exists (select 1 from challenge_attempts a where a.challenge_id = d.id and a.user_id = auth.uid() and a.completed_at is not null),
         (select count(*)::integer from challenge_attempts a where a.challenge_id = d.id and a.completed_at is not null),
         case when d.class_id is null then (select count(*)::integer from profiles x where x.institution_id = d.institution_id and x.role = 'student')
              else (select count(*)::integer from class_members m where m.class_id = d.class_id) end
  from daily_challenges d
  left join categories c on c.id = d.category_id
  left join question_packages p on p.id = d.package_id
  left join classes cl on cl.id = d.class_id
  where d.institution_id = my_institution()
    and (
      (p_all and is_staff())
      or ((now() at time zone 'Asia/Jakarta')::date between d.starts_on and d.ends_on
          and (d.class_id is null or private.is_class_member(d.class_id) or private.can_manage_class(d.class_id)))
    )
  order by d.ends_on, d.title
$$;

-- Selesaikan tantangan: dipanggil saat sesi Quick Play dari tantangan selesai
create function private.complete_challenge(p_user uuid, p_session uuid) returns void
language plpgsql set search_path = public, private as
$$
declare
  s game_sessions%rowtype;
  d daily_challenges%rowtype;
  v_answered integer;
  v_served integer;
begin
  select * into s from game_sessions where id = p_session;
  select * into d from daily_challenges where id = (s.settings ->> 'challenge_id')::uuid;
  if d.id is null then return; end if;
  select count(*) into v_served from game_questions where session_id = p_session;
  select count(*) into v_answered from player_answers a join game_questions g on g.id = a.game_question_id
  where g.session_id = p_session and a.user_id = p_user;
  -- Selesai jika semua soal sesi dijawab dan jumlahnya memenuhi target (atau seluruh isi paket)
  if v_answered < least(d.target_count, v_served) or v_answered < v_served then return; end if;

  insert into challenge_attempts (challenge_id, user_id, session_id, completed_at)
  values (d.id, p_user, p_session, now())
  on conflict (challenge_id, user_id) do update set session_id = excluded.session_id, completed_at = excluded.completed_at
    where challenge_attempts.completed_at is null;
  if not found then return; end if;   -- sudah pernah selesai: bonus tidak diberikan dua kali

  update player_stats set xp = xp + d.xp_reward, level = level_for_xp(xp + d.xp_reward) where user_id = p_user;
  update scores set xp_earned = xp_earned + d.xp_reward where session_id = p_session and user_id = p_user;
end;
$$;

create or replace function private.finish_session(p_session_id uuid, p_award boolean) returns void
language plpgsql set search_path = public, private as
$$
declare s game_sessions%rowtype;
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

  if not exists (select 1 from player_answers a join game_questions g on g.id = a.game_question_id
                 where g.session_id = s.id and a.user_id = auth.uid()) then
    update game_sessions set status = 'abandoned', ended_at = now() where id = s.id;
    return;
  end if;

  update game_sessions set status = 'finished', ended_at = now() where id = s.id;
  perform private.record_result(auth.uid(), s.id, p_award);
  if p_award and s.settings ? 'challenge_id' then
    perform private.complete_challenge(auth.uid(), s.id);
  end if;
end;
$$;

-- Quick Play kini bisa dari paket soal atau tantangan
drop function start_quick_play(arena_type, text, difficulty, integer, game_type);
create function start_quick_play(
  p_arena arena_type,
  p_category_slug text default null,
  p_difficulty difficulty default null,
  p_count integer default 10,
  p_game_type game_type default null,
  p_package uuid default null,
  p_challenge uuid default null
) returns uuid
language plpgsql security definer set search_path = public, private as
$$
declare
  v_session  uuid;
  v_cat_name text;
  v_n        integer;
  d          daily_challenges%rowtype;
  v_pkg_name text;
begin
  if auth.uid() is null then raise exception 'Silakan login terlebih dahulu'; end if;

  if p_challenge is not null then
    select * into d from daily_challenges where id = p_challenge
      and id in (select mc.id from my_challenges(false) mc);
    if d.id is null then raise exception 'Tantangan tidak aktif atau tidak untukmu'; end if;
    if exists (select 1 from challenge_attempts a where a.challenge_id = d.id and a.user_id = auth.uid() and a.completed_at is not null) then
      raise exception 'Tantangan ini sudah kamu selesaikan';
    end if;
    p_arena := coalesce(d.arena, p_arena);
    p_category_slug := (select slug from categories where id = d.category_id);
    p_difficulty := d.difficulty;
    p_count := d.target_count;
    p_game_type := null;
    p_package := d.package_id;
  end if;

  if p_package is not null then
    select name into v_pkg_name from question_packages where id = p_package and institution_id = my_institution();
    if v_pkg_name is null then raise exception 'Paket soal tidak ditemukan'; end if;
  end if;

  p_count := least(greatest(coalesce(p_count, 10), 1), 30);
  if p_category_slug is not null then
    select name into v_cat_name from categories where slug = p_category_slug;
    if v_cat_name is null then raise exception 'Kategori tidak ditemukan'; end if;
  end if;

  update game_sessions set status = 'abandoned', ended_at = now()
  where user_id = auth.uid() and room_id is null and status = 'active';

  insert into game_sessions (user_id, arena, settings)
  values (auth.uid(), coalesce(p_arena, 'mufrodat'), jsonb_strip_nulls(jsonb_build_object(
    'category_slug', p_category_slug,
    'category_name', coalesce(d.title, v_pkg_name, v_cat_name, 'Semua materi'),
    'difficulty', p_difficulty,
    'game_type', p_game_type,
    'count', p_count,
    'package_id', p_package,
    'challenge_id', d.id)))
  returning id into v_session;

  insert into game_questions (session_id, question_id, order_index)
  select v_session, pick.id, row_number() over (order by random())
  from (
    select q.id
    from questions q join categories c on c.id = q.category_id
    where q.is_published
      and (q.institution_id is null or q.institution_id = my_institution())
      and (p_package is not null or c.arena = p_arena)
      and (p_package is null or q.id in (select x.question_id from package_questions x where x.package_id = p_package))
      and (p_category_slug is null or c.slug = p_category_slug)
      and (p_difficulty is null or q.difficulty = p_difficulty)
      and (p_game_type is null or q.game_type = p_game_type)
    order by random()
    limit p_count
  ) pick;

  get diagnostics v_n = row_count;
  if v_n = 0 then raise exception 'Belum ada soal untuk pilihan ini'; end if;
  -- Arena sesi mengikuti soal (paket bisa berisi soal dari arena mana saja)
  update game_sessions set arena = (
    select c.arena from game_questions g join questions q on q.id = g.question_id join categories c on c.id = q.category_id
    where g.session_id = v_session group by c.arena order by count(*) desc limit 1)
  where id = v_session;
  return v_session;
end;
$$;

-- =====================================================================
-- ADMIN
-- =====================================================================
create function admin_users(p_search text default null)
returns table (id uuid, email text, full_name text, nickname text, role app_role, institution_name text,
               created_at timestamptz, xp integer, last_played_on date)
language plpgsql stable security definer set search_path = public, private as
$$
begin
  if not private.is_admin() then raise exception 'Khusus admin'; end if;
  return query
  select p.id, u.email::text, p.full_name, p.nickname, p.role, i.name, p.created_at, st.xp, st.last_played_on
  from profiles p
  join auth.users u on u.id = p.id
  left join institutions i on i.id = p.institution_id
  left join player_stats st on st.user_id = p.id
  where (my_role() = 'super_admin' or p.institution_id = my_institution())
    and (p_search is null or u.email ilike '%' || p_search || '%' or p.nickname ilike '%' || p_search || '%'
         or p.full_name ilike '%' || p_search || '%')
  order by p.created_at desc
  limit 300;
end;
$$;

create function set_user_role(p_user uuid, p_role app_role) returns void
language plpgsql security definer set search_path = public, private as
$$
declare v_target profiles%rowtype;
begin
  if not private.is_admin() then raise exception 'Khusus admin'; end if;
  if p_user = auth.uid() then raise exception 'Tidak bisa mengubah peran sendiri'; end if;
  select * into v_target from profiles where id = p_user;
  if v_target.id is null then raise exception 'Pengguna tidak ditemukan'; end if;
  if my_role() <> 'super_admin' then
    if v_target.institution_id is distinct from my_institution() then raise exception 'Pengguna tidak ditemukan'; end if;
    if p_role = 'super_admin' or v_target.role = 'super_admin' then raise exception 'Hanya super admin yang bisa mengatur peran ini'; end if;
  end if;
  update profiles set role = p_role where id = p_user;
end;
$$;

create function set_user_institution(p_user uuid, p_institution uuid) returns void
language plpgsql security definer set search_path = public, private as
$$
begin
  if my_role() <> 'super_admin' then raise exception 'Khusus super admin'; end if;
  if not exists (select 1 from institutions where id = p_institution) then raise exception 'Lembaga tidak ditemukan'; end if;
  update profiles set institution_id = p_institution where id = p_user;
end;
$$;

create function admin_stats() returns jsonb
language plpgsql stable security definer set search_path = public, private as
$$
declare
  v_all boolean := my_role() = 'super_admin';
  v_inst uuid := my_institution();
  v_since timestamptz := now() - interval '7 days';
begin
  if not private.is_admin() then raise exception 'Khusus admin'; end if;
  return jsonb_build_object(
    'scope', case when v_all then 'Seluruh platform' else (select name from institutions where id = v_inst) end,
    'users_by_role', (select jsonb_object_agg(role, n) from (
        select role, count(*) n from profiles where v_all or institution_id = v_inst group by role) r),
    'classes', (select count(*) from classes where v_all or institution_id = v_inst),
    'questions_global', (select count(*) from questions where institution_id is null and is_published),
    'questions_institution', (select count(*) from questions where institution_id is not null and (v_all or institution_id = v_inst)),
    'games_7d', (select count(*) from scores s where s.created_at >= v_since and (v_all or s.institution_id = v_inst)),
    'answers_7d', (select count(*) from player_answers a join profiles p on p.id = a.user_id
                   where a.answered_at >= v_since and (v_all or p.institution_id = v_inst)),
    'active_players_7d', (select count(distinct s.user_id) from scores s where s.created_at >= v_since and (v_all or s.institution_id = v_inst)),
    'rooms_active', (select count(*) from game_rooms where status in ('lobby', 'playing') and created_at > now() - interval '1 day'
                     and (v_all or institution_id = v_inst)),
    'top_categories', coalesce((select jsonb_agg(t) from (
        select c.name, c.arena, count(*) answers, round(100.0 * count(*) filter (where a.is_correct) / count(*)) accuracy
        from player_answers a join game_questions g on g.id = a.game_question_id
        join questions q on q.id = g.question_id join categories c on c.id = q.category_id
        join profiles p on p.id = a.user_id
        where a.answered_at >= v_since and (v_all or p.institution_id = v_inst)
        group by c.id order by count(*) desc limit 6) t), '[]'::jsonb),
    'institutions', case when v_all then (select jsonb_agg(jsonb_build_object('id', i.id, 'name', i.name, 'slug', i.slug,
        'users', (select count(*) from profiles p where p.institution_id = i.id)) order by i.created_at) from institutions i) end
  );
end;
$$;

create function create_institution(p_name text, p_slug text) returns uuid
language plpgsql security definer set search_path = public, private as
$$
declare v_id uuid;
begin
  if my_role() <> 'super_admin' then raise exception 'Khusus super admin'; end if;
  if length(trim(coalesce(p_name, ''))) < 3 then raise exception 'Nama lembaga minimal 3 karakter'; end if;
  if coalesce(p_slug, '') !~ '^[a-z0-9-]{3,40}$' then raise exception 'Slug: huruf kecil, angka, tanda minus (3–40)'; end if;
  insert into institutions (name, slug) values (trim(p_name), p_slug) returning id into v_id;
  return v_id;
end;
$$;

create function save_category(p_parent_slug text, p_slug text, p_name text, p_name_ar text) returns uuid
language plpgsql security definer set search_path = public, private as
$$
declare
  v_parent categories%rowtype;
  v_id uuid;
begin
  if my_role() <> 'super_admin' then raise exception 'Khusus super admin'; end if;
  select * into v_parent from categories where slug = p_parent_slug and parent_id is null;
  if v_parent.id is null then raise exception 'Kelompok induk tidak ditemukan'; end if;
  if coalesce(p_slug, '') !~ '^[a-z0-9-]{2,40}$' then raise exception 'Slug: huruf kecil, angka, tanda minus'; end if;
  if length(trim(coalesce(p_name, ''))) < 2 then raise exception 'Nama kategori wajib diisi'; end if;
  insert into categories (arena, parent_id, slug, name, name_ar, sort_order)
  values (v_parent.arena, v_parent.id, p_slug, trim(p_name), nullif(trim(coalesce(p_name_ar, '')), ''),
          (select coalesce(max(sort_order), 0) + 1 from categories where parent_id = v_parent.id))
  on conflict (slug) do update set name = excluded.name, name_ar = excluded.name_ar
  returning id into v_id;
  return v_id;
end;
$$;

-- Struktur kategori untuk formulir (semua pengguna login)
create function category_tree()
returns table (arena arena_type, group_slug text, group_name text, slug text, name text, name_ar text)
language sql stable security definer set search_path = public, private as
$$
  select c.arena, g.slug, g.name, c.slug, c.name, c.name_ar
  from categories c join categories g on g.id = c.parent_id
  order by g.sort_order, c.sort_order
$$;

-- =====================================================================
-- Hak eksekusi
-- =====================================================================
revoke execute on all functions in schema private from public, anon, authenticated;
grant execute on function private.my_role(), private.my_institution(), private.is_staff(), private.is_room_member(uuid)
to anon, authenticated;

revoke execute on function
  create_class(text, difficulty), update_class(uuid, text, difficulty, boolean), delete_class(uuid), join_class(text),
  leave_class(uuid), remove_class_member(uuid, uuid), my_classes(), class_overview(uuid), student_progress(uuid),
  class_leaderboard(uuid, text), save_question(uuid, jsonb), import_questions(jsonb), delete_question(uuid),
  get_question(uuid), bank_questions(arena_type, text, game_type, difficulty, text, text),
  save_package(uuid, text, text, uuid, uuid[]), delete_package(uuid), my_packages(),
  save_challenge(uuid, jsonb), delete_challenge(uuid), my_challenges(boolean),
  start_quick_play(arena_type, text, difficulty, integer, game_type, uuid, uuid),
  admin_users(text), set_user_role(uuid, app_role), set_user_institution(uuid, uuid), admin_stats(),
  create_institution(text, text), save_category(text, text, text, text), category_tree()
from public, anon;

grant execute on function
  create_class(text, difficulty), update_class(uuid, text, difficulty, boolean), delete_class(uuid), join_class(text),
  leave_class(uuid), remove_class_member(uuid, uuid), my_classes(), class_overview(uuid), student_progress(uuid),
  class_leaderboard(uuid, text), save_question(uuid, jsonb), import_questions(jsonb), delete_question(uuid),
  get_question(uuid), bank_questions(arena_type, text, game_type, difficulty, text, text),
  save_package(uuid, text, text, uuid, uuid[]), delete_package(uuid), my_packages(),
  save_challenge(uuid, jsonb), delete_challenge(uuid), my_challenges(boolean),
  start_quick_play(arena_type, text, difficulty, integer, game_type, uuid, uuid),
  admin_users(text), set_user_role(uuid, app_role), set_user_institution(uuid, uuid), admin_stats(),
  create_institution(text, text), save_category(text, text, text, text), category_tree()
to authenticated;
