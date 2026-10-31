-- =====================================================================
-- FUN ARENA AZHAR CENTER — Tahap 7: Gamifikasi & penyempurnaan
--   * Badge/achievement dinilai server setelah setiap permainan
--   * Misi harian & mingguan otomatis (XP diklaim sekali per periode)
--   * Batas XP harian yang lembut: setelah 600 XP/hari, XP permainan berikutnya ½
--     (menghargai konsistensi, bukan bermain berlebihan)
--   * Progres belajar, kosakata dikuasai/sulit, perbandingan antarperiode, riwayat lengkap
-- =====================================================================

-- ---------- Badge ----------
insert into achievements (code, name, description, icon, criteria) values
  ('first_game',      'Langkah Pertama',    'Menyelesaikan permainan pertama.',                       '🌱', '{"games": 1}'),
  ('games_10',        'Rajin Berlatih',     'Menyelesaikan 10 permainan.',                            '📘', '{"games": 10}'),
  ('games_50',        'Pejuang Ilmu',       'Menyelesaikan 50 permainan.',                            '🏅', '{"games": 50}'),
  ('streak_3',        'Istiqamah 3 Hari',   'Bermain 3 hari berturut-turut.',                         '🔥', '{"streak": 3}'),
  ('streak_7',        'Istiqamah Sepekan',  'Bermain 7 hari berturut-turut.',                         '🌟', '{"streak": 7}'),
  ('level_5',         'Level 5',            'Mencapai level 5.',                                      '⭐', '{"level": 5}'),
  ('level_10',        'Level 10',           'Mencapai level 10.',                                     '💫', '{"level": 10}'),
  ('perfect',         'Sempurna',           'Menjawab benar semua soal dalam satu permainan (min. 5 soal).', '💯', '{"perfect_min": 5}'),
  ('mufrodat_50',     'Ahli Mufrodat',      '50 jawaban benar di Arena Mufrodat & Muhadatsah.',       '📚', '{"arena": "mufrodat", "correct": 50}'),
  ('qowaid_50',       'Ahli Qowaid',        '50 jawaban benar di Qowaid Arena.',                      '🧩', '{"arena": "qowaid", "correct": 50}'),
  ('irab_30',         'Pemburu I''rab',     '30 jawaban benar di I''rab Challenge.',                  '🔍', '{"game_type": "irab_challenge", "correct": 30}'),
  ('tashrif_30',      'Ahli Tashrif',       '30 jawaban benar di Tashrif Battle.',                    '🔁', '{"game_type": "tashrif_battle", "correct": 30}'),
  ('amiyah_10',       'Penjelajah Kairo',   '10 jawaban benar soal Amiyah Mesir.',                    '🕌', '{"variety": "amiyah_mesir", "correct": 10}'),
  ('challenge_3',     'Penakluk Tantangan', 'Menyelesaikan 3 tantangan dari guru.',                   '🎯', '{"challenges": 3}'),
  ('quiz_champion',   'Juara Quiz Battle',  'Juara 1 Quiz Battle dengan minimal 3 pemain.',           '🏆', '{"room": "quiz"}'),
  ('ladder_king',     'Raja Tangga',        'Memenangkan Ular Tangga online.',                        '🪜', '{"room": "snake"}')
on conflict (code) do nothing;

-- Sesi tempat badge diraih (untuk menampilkan "badge baru" di halaman hasil)
alter table player_achievements add column session_id uuid references game_sessions (id) on delete set null;

create function private.award_badge(p_user uuid, p_code text, p_session uuid default null) returns void
language sql set search_path = public, private as
$$
  insert into player_achievements (user_id, achievement_id, session_id)
  select p_user, a.id, p_session from achievements a where a.code = p_code
  on conflict do nothing
$$;

-- Periksa semua badge berbasis statistik untuk satu pemain (aman dipanggil berulang)
create function private.check_achievements(p_user uuid, p_session uuid default null) returns void
language plpgsql set search_path = public, private as
$$
declare
  st player_stats%rowtype;
  v_count integer;
begin
  select * into st from player_stats where user_id = p_user;
  if st.total_games >= 1 then perform private.award_badge(p_user, 'first_game', p_session); end if;
  if st.total_games >= 10 then perform private.award_badge(p_user, 'games_10', p_session); end if;
  if st.total_games >= 50 then perform private.award_badge(p_user, 'games_50', p_session); end if;
  if st.longest_streak >= 3 then perform private.award_badge(p_user, 'streak_3', p_session); end if;
  if st.longest_streak >= 7 then perform private.award_badge(p_user, 'streak_7', p_session); end if;
  if st.level >= 5 then perform private.award_badge(p_user, 'level_5', p_session); end if;
  if st.level >= 10 then perform private.award_badge(p_user, 'level_10', p_session); end if;

  if p_session is not null and exists (
    select 1 from scores s where s.session_id = p_session and s.user_id = p_user
      and s.answered_count >= 5 and s.correct_count = s.answered_count
  ) then
    perform private.award_badge(p_user, 'perfect', p_session);
  end if;

  -- Badge berbasis jumlah jawaban benar
  select count(*) into v_count from player_answers a join game_questions g on g.id = a.game_question_id
    join questions q on q.id = g.question_id join categories c on c.id = q.category_id
    where a.user_id = p_user and a.is_correct and c.arena = 'mufrodat';
  if v_count >= 50 then perform private.award_badge(p_user, 'mufrodat_50', p_session); end if;
  select count(*) into v_count from player_answers a join game_questions g on g.id = a.game_question_id
    join questions q on q.id = g.question_id join categories c on c.id = q.category_id
    where a.user_id = p_user and a.is_correct and c.arena = 'qowaid';
  if v_count >= 50 then perform private.award_badge(p_user, 'qowaid_50', p_session); end if;
  select count(*) into v_count from player_answers a join game_questions g on g.id = a.game_question_id
    join questions q on q.id = g.question_id where a.user_id = p_user and a.is_correct and q.game_type = 'irab_challenge';
  if v_count >= 30 then perform private.award_badge(p_user, 'irab_30', p_session); end if;
  select count(*) into v_count from player_answers a join game_questions g on g.id = a.game_question_id
    join questions q on q.id = g.question_id where a.user_id = p_user and a.is_correct and q.game_type = 'tashrif_battle';
  if v_count >= 30 then perform private.award_badge(p_user, 'tashrif_30', p_session); end if;
  select count(*) into v_count from player_answers a join game_questions g on g.id = a.game_question_id
    join questions q on q.id = g.question_id where a.user_id = p_user and a.is_correct and q.variety = 'amiyah_mesir';
  if v_count >= 10 then perform private.award_badge(p_user, 'amiyah_10', p_session); end if;
  select count(*) into v_count from challenge_attempts where user_id = p_user and completed_at is not null;
  if v_count >= 3 then perform private.award_badge(p_user, 'challenge_3', p_session); end if;
end;
$$;

-- ---------- record_result: + batas XP harian lembut + badge ----------
create or replace function private.record_result(p_user uuid, p_session uuid, p_award boolean) returns void
language plpgsql set search_path = public, private as
$$
declare
  v_score    integer;
  v_correct  integer;
  v_answered integer;
  v_xp       integer;
  v_today    date := (now() at time zone 'Asia/Jakarta')::date;
  v_xp_today integer;
begin
  select coalesce(sum(a.points), 0), count(*) filter (where a.is_correct), count(*)
  into v_score, v_correct, v_answered
  from player_answers a join game_questions g on g.id = a.game_question_id
  where g.session_id = p_session and a.user_id = p_user;

  if v_answered = 0 then return; end if;
  v_xp := case when p_award then round(v_score / 10.0)::integer else 0 end;

  -- Batas lembut: setelah 600 XP hari ini, XP permainan berikutnya setengah
  select coalesce(sum(s.xp_earned), 0) into v_xp_today from scores s
  where s.user_id = p_user and (s.created_at at time zone 'Asia/Jakarta')::date = v_today;
  if v_xp_today >= 600 then v_xp := round(v_xp / 2.0)::integer; end if;

  insert into scores (session_id, user_id, institution_id, score, correct_count, answered_count, xp_earned)
  values (p_session, p_user, (select institution_id from profiles where id = p_user), v_score, v_correct, v_answered, v_xp)
  on conflict (session_id, user_id) do nothing;
  if not found or not p_award then return; end if;

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
  where user_id = p_user;

  insert into player_progress (user_id, category_id, answered, correct)
  select p_user, q.category_id, count(*), count(*) filter (where a.is_correct)
  from player_answers a
  join game_questions g on g.id = a.game_question_id
  join questions q on q.id = g.question_id
  where g.session_id = p_session and a.user_id = p_user
  group by q.category_id
  on conflict (user_id, category_id) do update
    set answered   = player_progress.answered + excluded.answered,
        correct    = player_progress.correct + excluded.correct,
        updated_at = now();

  perform private.check_achievements(p_user, p_session);
end;
$$;

-- Tantangan selesai juga bisa membuka badge
create or replace function private.complete_challenge(p_user uuid, p_session uuid) returns void
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
  if v_answered < least(d.target_count, v_served) or v_answered < v_served then return; end if;

  insert into challenge_attempts (challenge_id, user_id, session_id, completed_at)
  values (d.id, p_user, p_session, now())
  on conflict (challenge_id, user_id) do update set session_id = excluded.session_id, completed_at = excluded.completed_at
    where challenge_attempts.completed_at is null;
  if not found then return; end if;   -- sudah pernah selesai: bonus tidak diberikan dua kali

  update player_stats set xp = xp + d.xp_reward, level = level_for_xp(xp + d.xp_reward) where user_id = p_user;
  update scores set xp_earned = xp_earned + d.xp_reward where session_id = p_session and user_id = p_user;
  perform private.check_achievements(p_user, null);
end;
$$;

-- Juara room: badge Juara Quiz Battle / Raja Tangga
create or replace function private.finish_room(p_room uuid, p_state jsonb) returns void
language plpgsql set search_path = public, private as
$$
declare
  r game_rooms%rowtype;
  p record;
  v_top uuid;
  v_players integer;
begin
  select * into r from game_rooms where id = p_room;
  update game_sessions set status = 'finished', ended_at = now() where id = r.session_id and status = 'active';
  for p in select user_id from room_players where room_id = p_room and is_player loop
    perform private.record_result(p.user_id, r.session_id, true);
  end loop;

  select count(*) into v_players from room_players where room_id = p_room and is_player;
  if r.settings ->> 'game' = 'snake' and p_state ->> 'winner' is not null then
    perform private.award_badge((p_state ->> 'winner')::uuid, 'ladder_king', r.session_id);
  elsif r.settings ->> 'game' = 'quiz' and v_players >= 3 then
    -- Juara tunggal saja (skor tertinggi tidak seri)
    select s.user_id into v_top from scores s where s.session_id = r.session_id
    order by s.score desc limit 1;
    if v_top is not null and (select count(*) from scores s where s.session_id = r.session_id
                              and s.score = (select max(score) from scores where session_id = r.session_id)) = 1 then
      perform private.award_badge(v_top, 'quiz_champion', r.session_id);
    end if;
  end if;

  update game_rooms set status = 'finished', state = jsonb_set(p_state, '{phase}', '"finished"') where id = p_room;
  perform private.bump(p_room);
end;
$$;

-- Hasil sesi kini menyertakan badge yang baru didapat & info batas XP harian
create or replace function get_session_result(p_session_id uuid) returns jsonb
language plpgsql stable security definer set search_path = public, private as
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
    'challenge_completed', exists (select 1 from challenge_attempts ca where ca.session_id = s.id and ca.user_id = auth.uid()),
    -- XP dikurangi karena batas harian (main sendiri, bukan tantangan)
    'xp_halved', sc.session_id is not null and coalesce((s.settings ->> 'players')::integer, 1) = 1
                 and not exists (select 1 from challenge_attempts ca where ca.session_id = s.id)
                 and sc.xp_earned < round(sc.score / 10.0)::integer,
    'new_badges', coalesce((
      select jsonb_agg(jsonb_build_object('code', a.code, 'name', a.name, 'icon', a.icon, 'description', a.description))
      from player_achievements pa join achievements a on a.id = pa.achievement_id
      where pa.user_id = auth.uid() and pa.session_id = s.id), '[]'::jsonb),
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

create function my_badges()
returns table (code text, name text, description text, icon text, earned_at timestamptz)
language sql stable security definer set search_path = public, private as
$$
  select a.code, a.name, a.description, a.icon, pa.earned_at
  from achievements a left join player_achievements pa on pa.achievement_id = a.id and pa.user_id = auth.uid()
  order by pa.earned_at is null, pa.earned_at, a.name
$$;

-- ---------- Misi harian & mingguan ----------
create table mission_claims (
  user_id    uuid references profiles (id) on delete cascade,
  code       text not null,
  period_key text not null,        -- tanggal (harian) atau awal pekan (mingguan), WIB
  xp         integer not null,
  claimed_at timestamptz not null default now(),
  primary key (user_id, code, period_key)
);
alter table mission_claims enable row level security;
create policy "lihat klaim sendiri" on mission_claims for select using (user_id = auth.uid());

create function my_missions()
returns table (code text, period text, title text, description text, progress integer, target integer, xp integer, claimed boolean)
language plpgsql stable security definer set search_path = public, private as
$$
declare
  v_today date := (now() at time zone 'Asia/Jakarta')::date;
  v_week  date := date_trunc('week', now() at time zone 'Asia/Jakarta')::date;
  v_day_start  timestamptz := v_today::timestamp at time zone 'Asia/Jakarta';
  v_week_start timestamptz := v_week::timestamp at time zone 'Asia/Jakarta';
begin
  return query
  with a as (
    select pa.is_correct, pa.answered_at, c.arena, gs.room_id
    from player_answers pa
    join game_questions g on g.id = pa.game_question_id
    join game_sessions gs on gs.id = g.session_id
    join questions q on q.id = g.question_id
    join categories c on c.id = q.category_id
    where pa.user_id = auth.uid() and pa.answered_at >= v_week_start
      -- jawaban ular tangga lokal multi-pemain bukan milik satu akun
      and not (gs.room_id is null and gs.arena = 'snake_ladder' and coalesce((gs.settings ->> 'players')::integer, 1) > 1)
  ), m as (
    select 'daily_correct_10' code, 'daily' period, 'Sepuluh jawaban benar' title,
           'Jawab 10 soal dengan benar hari ini.' description,
           (select count(*) from a where a.is_correct and a.answered_at >= v_day_start)::integer progress, 10 target, 30 xp, v_today::text pkey
    union all
    select 'daily_qowaid_5', 'daily', 'Sentuhan Qowaid', 'Jawab 5 soal Qowaid hari ini (benar atau salah, yang penting berlatih).',
           (select count(*) from a where a.arena = 'qowaid' and a.answered_at >= v_day_start)::integer, 5, 20, v_today::text
    union all
    select 'weekly_days_4', 'weekly', 'Istiqamah Pekan Ini', 'Bermain di 4 hari berbeda minggu ini. Sedikit tapi rutin!',
           (select count(distinct (a.answered_at at time zone 'Asia/Jakarta')::date) from a)::integer, 4, 100, v_week::text
    union all
    select 'weekly_correct_50', 'weekly', 'Lima Puluh Benar', 'Kumpulkan 50 jawaban benar minggu ini.',
           (select count(*) from a where a.is_correct)::integer, 50, 80, v_week::text
    union all
    select 'weekly_together', 'weekly', 'Belajar Bersama', 'Ikut 1 permainan Main Bareng minggu ini.',
           (select count(distinct a.room_id) from a where a.room_id is not null)::integer, 1, 50, v_week::text
  )
  select m.code, m.period, m.title, m.description, least(m.progress, m.target), m.target, m.xp,
         exists (select 1 from mission_claims mc where mc.user_id = auth.uid() and mc.code = m.code and mc.period_key = m.pkey)
  from m;
end;
$$;

create function claim_mission(p_code text) returns integer
language plpgsql security definer set search_path = public, private as
$$
declare
  m record;
  v_key text;
begin
  select * into m from my_missions() x where x.code = p_code;
  if m.code is null then raise exception 'Misi tidak ditemukan'; end if;
  if m.claimed then raise exception 'Hadiah misi ini sudah diambil'; end if;
  if m.progress < m.target then raise exception 'Misi belum selesai'; end if;
  v_key := case when m.period = 'daily' then (now() at time zone 'Asia/Jakarta')::date::text
                else date_trunc('week', now() at time zone 'Asia/Jakarta')::date::text end;
  insert into mission_claims (user_id, code, period_key, xp) values (auth.uid(), p_code, v_key, m.xp);
  update player_stats set xp = xp + m.xp, level = level_for_xp(xp + m.xp) where user_id = auth.uid();
  perform private.check_achievements(auth.uid(), null);
  return m.xp;
end;
$$;

-- ---------- Riwayat & progres ----------
create function my_history(p_limit integer default 20, p_offset integer default 0, p_arena arena_type default null)
returns table (session_id uuid, arena arena_type, category_name text, mode text, score integer, correct_count integer,
               answered_count integer, xp_earned integer, ended_at timestamptz, total bigint)
language sql stable security definer set search_path = public, private as
$$
  select s.id, s.arena, s.settings ->> 'category_name',
         case when s.room_id is not null then (case when s.settings ->> 'game' = 'snake' then 'Ular Tangga online' else 'Quiz Battle' end)
              when s.arena = 'snake_ladder' then case when coalesce((s.settings ->> 'players')::integer, 1) > 1 then 'Ular Tangga bergiliran' else 'Ular Tangga' end
              when s.settings ? 'challenge_id' then 'Tantangan'
              else 'Quick Play' end,
         sc.score, sc.correct_count, sc.answered_count, sc.xp_earned, s.ended_at,
         count(*) over ()
  from scores sc join game_sessions s on s.id = sc.session_id
  where sc.user_id = auth.uid() and (p_arena is null or s.arena = p_arena)
  order by s.ended_at desc nulls last
  limit least(greatest(coalesce(p_limit, 20), 1), 100) offset greatest(coalesce(p_offset, 0), 0)
$$;

create function my_progress() returns jsonb
language plpgsql stable security definer set search_path = public, private as
$$
declare
  v_week timestamptz := date_trunc('week', now() at time zone 'Asia/Jakarta') at time zone 'Asia/Jakarta';
  v_today date := (now() at time zone 'Asia/Jakarta')::date;
begin
  return jsonb_build_object(
    -- Kemampuan per kelompok materi
    'skills', coalesce((
      select jsonb_agg(jsonb_build_object('group_slug', g.slug, 'name', g.name, 'name_ar', g.name_ar, 'arena', g.arena,
                                          'answered', coalesce(t.answered, 0), 'correct', coalesce(t.correct, 0),
                                          'accuracy', case when t.answered > 0 then round(100.0 * t.correct / t.answered) end)
                       order by g.sort_order)
      from categories g
      left join lateral (
        select sum(pp.answered) answered, sum(pp.correct) correct
        from player_progress pp join categories c on c.id = pp.category_id
        where pp.user_id = auth.uid() and c.parent_id = g.id
      ) t on true
      where g.parent_id is null), '[]'::jsonb),
    'topics', coalesce((
      select jsonb_agg(jsonb_build_object('name', c.name, 'name_ar', c.name_ar, 'group_slug', g.slug, 'answered', pp.answered,
                                          'correct', pp.correct, 'accuracy', round(100.0 * pp.correct / nullif(pp.answered, 0)))
                       order by g.sort_order, c.sort_order)
      from player_progress pp join categories c on c.id = pp.category_id join categories g on g.id = c.parent_id
      where pp.user_id = auth.uid()), '[]'::jsonb),
    -- Minggu ini vs minggu lalu
    'compare', (
      select jsonb_build_object(
        'this', jsonb_build_object('answered', count(*) filter (where a.answered_at >= v_week),
                                   'correct', count(*) filter (where a.answered_at >= v_week and a.is_correct),
                                   'days', count(distinct (a.answered_at at time zone 'Asia/Jakarta')::date) filter (where a.answered_at >= v_week)),
        'last', jsonb_build_object('answered', count(*) filter (where a.answered_at < v_week),
                                   'correct', count(*) filter (where a.answered_at < v_week and a.is_correct),
                                   'days', count(distinct (a.answered_at at time zone 'Asia/Jakarta')::date) filter (where a.answered_at < v_week)),
        'xp_this', (select coalesce(sum(xp_earned), 0) from scores where user_id = auth.uid() and created_at >= v_week),
        'xp_last', (select coalesce(sum(xp_earned), 0) from scores where user_id = auth.uid() and created_at >= v_week - interval '7 days' and created_at < v_week))
      from player_answers a
      where a.user_id = auth.uid() and a.answered_at >= v_week - interval '7 days'),
    -- Aktivitas 14 hari terakhir (WIB)
    'activity', (
      select jsonb_agg(jsonb_build_object('date', d::date, 'answered', coalesce(x.answered, 0), 'correct', coalesce(x.correct, 0)) order by d)
      from generate_series(v_today - 13, v_today, interval '1 day') d
      left join (
        select (a.answered_at at time zone 'Asia/Jakarta')::date as day_wib, count(*) answered, count(*) filter (where a.is_correct) correct
        from player_answers a where a.user_id = auth.uid() and a.answered_at >= now() - interval '15 days'
        group by 1
      ) x on x.day_wib = d::date),
    -- Kosakata (soal Mufrodat bertulisan Arab): dikuasai & masih sulit
    'vocab', (
      with v as (
        select q.id, q.prompt_ar, q.explanation, count(*) answered, count(*) filter (where a.is_correct) correct
        from player_answers a join game_questions g on g.id = a.game_question_id
        join questions q on q.id = g.question_id join categories c on c.id = q.category_id
        where a.user_id = auth.uid() and c.arena = 'mufrodat' and q.prompt_ar is not null and q.prompt_ar ~ '[؀-ۿ]'
        group by q.id
      )
      select jsonb_build_object(
        'mastered', coalesce((select jsonb_agg(jsonb_build_object('word', prompt_ar, 'answered', answered, 'correct', correct) order by correct desc)
                              from v where correct >= 2 and correct::numeric / answered >= 0.75), '[]'::jsonb),
        'difficult', coalesce((select jsonb_agg(jsonb_build_object('word', prompt_ar, 'answered', answered, 'correct', correct, 'explanation', explanation)
                                                order by correct::numeric / answered, answered desc)
                               from v where correct::numeric / answered < 0.5), '[]'::jsonb),
        'seen', (select count(*) from v)))
  );
end;
$$;

-- ---------- Hak eksekusi ----------
revoke execute on all functions in schema private from public, anon, authenticated;
grant execute on function private.my_role(), private.my_institution(), private.is_staff(), private.is_room_member(uuid)
to anon, authenticated;

revoke execute on function my_badges(), my_missions(), claim_mission(text), my_history(integer, integer, arena_type), my_progress()
from public, anon;
grant execute on function my_badges(), my_missions(), claim_mission(text), my_history(integer, integer, arena_type), my_progress()
to authenticated;
