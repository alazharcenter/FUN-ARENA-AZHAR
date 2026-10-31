-- =====================================================================
-- FUN ARENA AZHAR CENTER — Tahap 5: Multiplayer realtime
--   * Room dengan kode undangan, lobby, status siap, pengaturan host.
--   * Quiz Battle (semua pemain menjawab soal yang sama) & Ular Tangga online (bergiliran).
--   * Server adalah sumber kebenaran: soal, timer, dadu, giliran, skor, pemenang.
--   * Setiap perubahan menaikkan game_rooms.version → disiarkan Supabase Realtime;
--     klien lalu mengambil room_state(). Klien juga polling sebagai cadangan.
--   * room_advance() boleh dipanggil siapa saja; server hanya maju jika syarat terpenuhi
--     (waktu habis / semua sudah menjawab), sehingga permainan tidak bergantung pada host.
-- =====================================================================

alter table game_rooms
  add column version    bigint not null default 0,
  add column state      jsonb  not null default '{}',
  add column session_id uuid references game_sessions (id) on delete set null;

alter table room_players add column is_player boolean not null default true;  -- false = host penonton (Classroom)

-- Siaran realtime untuk perubahan room (RLS tetap berlaku: hanya anggota room)
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table game_rooms;
  end if;
end $$;

-- =====================================================================
-- Fungsi bantu (skema private: tidak bisa dipanggil lewat API)
-- =====================================================================
create function private.is_online(p_last_seen timestamptz) returns boolean
language sql stable as $$ select p_last_seen > now() - interval '25 seconds' $$;

create function private.bump(p_room uuid) returns void
language sql as $$ update game_rooms set version = version + 1 where id = p_room $$;

-- Catat skor satu pemain untuk satu sesi (+ XP/statistik/progres jika p_award)
create function private.record_result(p_user uuid, p_session uuid, p_award boolean) returns void
language plpgsql set search_path = public, private as
$$
declare
  v_score    integer;
  v_correct  integer;
  v_answered integer;
  v_xp       integer;
  v_today    date := (now() at time zone 'Asia/Jakarta')::date;
begin
  select coalesce(sum(a.points), 0), count(*) filter (where a.is_correct), count(*)
  into v_score, v_correct, v_answered
  from player_answers a join game_questions g on g.id = a.game_question_id
  where g.session_id = p_session and a.user_id = p_user;

  if v_answered = 0 then return; end if;
  v_xp := case when p_award then round(v_score / 10.0)::integer else 0 end;

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
end;
$$;

-- Quick Play & Ular Tangga lokal kini memakai record_result
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
end;
$$;

-- Pilih soal untuk petak ular tangga (dipakai mode lokal & online)
create function private.pick_question(p_session uuid, p_tile text, p_diff difficulty, p_institution uuid) returns uuid
language sql set search_path = public, private as
$$
  select q.id
  from questions q
  join categories c on c.id = q.category_id
  join categories g on g.id = c.parent_id
  where q.is_published
    and (q.institution_id is null or q.institution_id = p_institution)
    and case p_tile
          when 'mufrodat'   then g.slug = 'mufrodat-kosakata' and q.game_type <> 'arabic_translation'
          when 'terjemah'   then c.arena = 'mufrodat' and q.game_type in ('arabic_translation', 'vocabulary_challenge', 'amiyah_challenge')
          when 'muhadatsah' then g.slug = 'mufrodat-percakapan'
          when 'qowaid'     then c.arena = 'qowaid'
          when 'nahwu'      then g.slug in ('qowaid-nahwu', 'qowaid-irab')
          when 'shorof'     then g.slug = 'qowaid-shorof'
        end
  -- Prioritas: belum dipakai di sesi ini → tingkat sesuai → acak
  order by exists (select 1 from game_questions u where u.session_id = p_session and u.question_id = q.id),
           (p_diff is null or q.difficulty = p_diff) desc,
           random()
  limit 1
$$;

-- Tampilkan soal: catat waktu tampil & tenggat
create function private.serve_question(p_session uuid, p_question uuid, p_time integer) returns uuid
language plpgsql set search_path = public, private as
$$
declare v_id uuid;
begin
  insert into game_questions (session_id, question_id, order_index, served_at, deadline_at)
  values (p_session, p_question,
          coalesce((select max(order_index) from game_questions where session_id = p_session), 0) + 1,
          now(), now() + make_interval(secs => p_time))
  returning id into v_id;
  return v_id;
end;
$$;

-- Soal TANPA kunci jawaban. Urutan pilihan tetap sama di setiap pengambilan (hash), agar tidak
-- teracak ulang setiap kali status room di-refresh.
create function private.question_payload(p_gq uuid) returns jsonb
language sql stable set search_path = public, private as
$$
  select jsonb_build_object(
    'game_question_id', g.id, 'order_index', g.order_index,
    'game_type', q.game_type, 'difficulty', q.difficulty, 'variety', q.variety,
    'prompt', q.prompt, 'prompt_ar', q.prompt_ar, 'image_url', q.image_url, 'audio_url', q.audio_url,
    'time_limit_sec', round(extract(epoch from g.deadline_at - g.served_at))::integer,
    'remaining_ms', greatest(0, (extract(epoch from g.deadline_at - now()) * 1000)::integer),
    'options', coalesce((
      select jsonb_agg(jsonb_build_object('id', o.id, 'label', o.label, 'is_arabic', o.is_arabic)
                       order by case when q.game_type = 'true_false' then o.position else hashtext(o.id::text || g.id::text) end)
      from answer_options o where o.question_id = q.id), '[]'::jsonb))
  from game_questions g join questions q on q.id = g.question_id
  where g.id = p_gq
$$;

-- Kunci & penjelasan — hanya dipanggil saat jawaban sudah boleh dibuka
create function private.answer_reveal(p_gq uuid) returns jsonb
language sql stable set search_path = public, private as
$$
  select jsonb_build_object('correct_option_id', k.correct_option_id, 'correct_text', k.accepted_texts[1], 'explanation', q.explanation)
  from game_questions g join questions q on q.id = g.question_id
  left join answer_keys k on k.question_id = q.id
  where g.id = p_gq
$$;

create function private.new_room_code() returns text
language plpgsql set search_path = public, private as
$$
declare
  v_code text;
  v_abc  text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';   -- tanpa huruf/angka yang mirip (I, L, O, 0, 1)
begin
  loop
    v_code := '';
    for i in 1..6 loop
      v_code := v_code || substr(v_abc, 1 + floor(random() * length(v_abc))::integer, 1);
    end loop;
    exit when not exists (select 1 from game_rooms where code = v_code);
  end loop;
  return v_code;
end;
$$;

-- Bersihkan & validasi pengaturan room dari klien
create function private.room_settings(p jsonb) returns jsonb
language plpgsql stable set search_path = public, private as
$$
declare
  v_game text := p ->> 'game';
  v_max  integer := coalesce((p ->> 'max_players')::integer, 30);
  v_time integer := nullif(p ->> 'time_limit', '')::integer;
  v_diff difficulty := nullif(p ->> 'difficulty', '')::difficulty;
  v_host boolean := coalesce((p ->> 'host_plays')::boolean, true);
begin
  if v_max not between 2 and 30 then raise exception 'Jumlah pemain 2–30'; end if;
  if v_time is not null and v_time not between 10 and 90 then raise exception 'Durasi menjawab 10–90 detik'; end if;

  if v_game = 'quiz' then
    if coalesce(p ->> 'arena', '') not in ('mufrodat', 'qowaid') then raise exception 'Arena tidak dikenal'; end if;
    if coalesce((p ->> 'count')::integer, 10) not between 3 and 30 then raise exception 'Jumlah soal 3–30'; end if;
    if nullif(p ->> 'category_slug', '') is not null
       and not exists (select 1 from categories where slug = p ->> 'category_slug' and arena = (p ->> 'arena')::arena_type) then
      raise exception 'Kategori tidak ditemukan';
    end if;
    return jsonb_build_object(
      'game', 'quiz', 'arena', p ->> 'arena',
      'category_slug', nullif(p ->> 'category_slug', ''),
      'category_name', coalesce((select name from categories where slug = p ->> 'category_slug'), 'Semua materi'),
      'difficulty', v_diff, 'game_type', nullif(p ->> 'game_type', '')::game_type,
      'count', coalesce((p ->> 'count')::integer, 10), 'time_limit', v_time,
      'max_players', v_max, 'host_plays', v_host);
  elsif v_game = 'snake' then
    if coalesce(p ->> 'mode', '') not in ('casual', 'mixed', 'qowaid') then raise exception 'Mode tidak dikenal'; end if;
    if coalesce((p ->> 'size')::integer, 50) not in (50, 100) then raise exception 'Jumlah petak 50 atau 100'; end if;
    return jsonb_build_object(
      'game', 'snake', 'mode', p ->> 'mode', 'size', coalesce((p ->> 'size')::integer, 50),
      'difficulty', v_diff, 'time_limit', coalesce(v_time, 30),
      'wrong_skips', coalesce((p ->> 'wrong_skips')::boolean, (p ->> 'mode') <> 'casual'),
      'snake_rescue', coalesce((p ->> 'snake_rescue')::boolean, true),
      'max_players', v_max, 'host_plays', v_host);
  end if;
  raise exception 'Jenis permainan tidak dikenal';
end;
$$;

-- =====================================================================
-- Aturan papan ular tangga (HARUS sama dengan src/lib/snake.ts)
-- =====================================================================
create function private.snake_board(p_size integer) returns jsonb
language sql immutable as
$$
  select case p_size
    when 100 then '{"ladders":{"4":25,"13":46,"33":49,"42":63,"50":69,"62":81,"74":92},
                    "snakes":{"27":5,"40":3,"43":18,"54":31,"66":45,"89":53,"95":76,"99":41}}'::jsonb
    else          '{"ladders":{"3":22,"11":28,"20":39,"32":48},
                    "snakes":{"17":4,"29":9,"37":19,"47":26}}'::jsonb
  end
$$;

create function private.snake_mode_tiles(p_mode text) returns text[]
language sql immutable as
$$
  select case p_mode
    when 'casual' then array['mufrodat', 'terjemah', 'muhadatsah']
    when 'qowaid' then array['qowaid', 'nahwu', 'shorof']
    else array['mufrodat', 'terjemah', 'qowaid', 'muhadatsah', 'nahwu', 'shorof']
  end
$$;

create function private.snake_tile(p_n integer, p_size integer, p_mode text) returns text
language plpgsql immutable set search_path = public, private as
$$
declare
  b jsonb := private.snake_board(p_size);
  t text[] := private.snake_mode_tiles(p_mode);
begin
  if b -> 'ladders' ? p_n::text then return 'tangga'; end if;
  if b -> 'snakes' ? p_n::text then return 'ular'; end if;
  if p_n <= 1 or p_n >= p_size then return 'normal'; end if;
  if p_n % 15 = 0 then return 'bonus'; end if;
  if p_n % 23 = 0 then return 'khusus'; end if;
  if p_n % 3 = 0 then return t[((p_n / 3) % array_length(t, 1)) + 1]; end if;
  return 'normal';
end;
$$;

-- Petak yang dilalui; kelebihan langkah memantul mundur dari petak terakhir
create function private.snake_path(p_from integer, p_steps integer, p_size integer) returns integer[]
language plpgsql immutable as
$$
declare
  v_path integer[] := '{}';
  v_pos  integer := p_from;
  v_dir  integer := case when p_steps >= 0 then 1 else -1 end;
begin
  for i in 1..abs(p_steps) loop
    if v_dir = 1 and v_pos >= p_size then v_dir := -1; end if;
    v_pos := greatest(1, v_pos + v_dir);
    v_path := v_path || v_pos;
  end loop;
  return v_path;
end;
$$;

-- =====================================================================
-- Inti permainan room (private)
-- =====================================================================
create function private.player_name(p_user uuid) returns text
language sql stable set search_path = public as $$ select coalesce(nullif(nickname, ''), 'Pemain') from profiles where id = p_user $$;

create function private.add_log(p_state jsonb, p_msg text) returns jsonb
language sql immutable as
$$ select jsonb_set(p_state, '{log}', (jsonb_build_array(p_msg) || coalesce(p_state -> 'log', '[]'::jsonb)) - 20) $$;

-- Akhiri permainan room: sesi selesai, skor & XP setiap pemain dari jawabannya sendiri
create function private.finish_room(p_room uuid, p_state jsonb) returns void
language plpgsql set search_path = public, private as
$$
declare
  r game_rooms%rowtype;
  p record;
begin
  select * into r from game_rooms where id = p_room;
  update game_sessions set status = 'finished', ended_at = now() where id = r.session_id and status = 'active';
  for p in select user_id from room_players where room_id = p_room and is_player loop
    perform private.record_result(p.user_id, r.session_id, true);
  end loop;
  update game_rooms set status = 'finished', state = jsonb_set(p_state, '{phase}', '"finished"') where id = p_room;
  perform private.bump(p_room);
end;
$$;

-- Ular tangga: tentukan giliran berikutnya (lewati yang tertahan / terputus)
create function private.snake_next_turn(p_room uuid, p_state jsonb) returns jsonb
language plpgsql set search_path = public, private as
$$
declare
  v_order uuid[];
  v_n     integer;
  v_idx   integer;
  v_cand  uuid;
  p       room_players%rowtype;
  st      jsonb := p_state;
begin
  select array_agg(user_id order by turn_order) into v_order
  from room_players where room_id = p_room and is_player;
  v_n := array_length(v_order, 1);
  v_idx := coalesce(array_position(v_order, (st ->> 'turn_user')::uuid), 0);

  for i in 1..v_n loop
    v_cand := v_order[((v_idx - 1 + i) % v_n) + 1];
    select * into p from room_players where room_id = p_room and user_id = v_cand;
    if p.skip_turns > 0 then
      update room_players set skip_turns = skip_turns - 1 where room_id = p_room and user_id = v_cand;
      st := private.add_log(st, '⏸️ ' || private.player_name(v_cand) || ' tertahan, giliran dilewati');
      continue;
    end if;
    if not private.is_online(p.last_seen_at) and v_n > 1 then
      st := private.add_log(st, '📴 ' || private.player_name(v_cand) || ' terputus, giliran dilewati');
      continue;
    end if;
    return st || jsonb_build_object('phase', 'turn', 'turn_user', v_cand,
                                    'turn_deadline', now() + interval '45 seconds', 'pending', null);
  end loop;
  -- Semua tertahan/terputus: tetap lanjut ke pemain berikutnya
  v_cand := v_order[(v_idx % v_n) + 1];
  return st || jsonb_build_object('phase', 'turn', 'turn_user', v_cand,
                                  'turn_deadline', now() + interval '45 seconds', 'pending', null);
end;
$$;

-- Pindahkan bidak sepanjang path; catat gerakan untuk animasi di semua perangkat
create function private.snake_move(p_room uuid, p_user uuid, p_path integer[], p_state jsonb) returns jsonb
language plpgsql set search_path = public, private as
$$
declare st jsonb := p_state;
begin
  if array_length(p_path, 1) is null then return st; end if;
  update room_players set board_pos = p_path[array_length(p_path, 1)] where room_id = p_room and user_id = p_user;
  return st || jsonb_build_object('move', jsonb_build_object(
    'id', coalesce((st -> 'move' ->> 'id')::integer, 0) + 1, 'user', p_user, 'path', to_jsonb(p_path)));
end;
$$;

-- Buat soal petak untuk pemain; null jika tidak ada soal
create function private.snake_question_for(p_room uuid, p_tile text, p_harder boolean) returns uuid
language plpgsql set search_path = public, private as
$$
declare
  r     game_rooms%rowtype;
  v_qid uuid;
  v_diff difficulty;
begin
  select * into r from game_rooms where id = p_room;
  v_diff := case when p_harder then 'advanced'::difficulty else (r.settings ->> 'difficulty')::difficulty end;
  v_qid := private.pick_question(r.session_id, p_tile, v_diff, r.institution_id);
  if v_qid is null then return null; end if;
  return private.serve_question(r.session_id, v_qid, (r.settings ->> 'time_limit')::integer);
end;
$$;

-- Apa yang terjadi setelah bidak berhenti di petak p_pos. Mengembalikan state baru.
create function private.snake_land(p_room uuid, p_user uuid, p_pos integer, p_path integer[], p_state jsonb) returns jsonb
language plpgsql set search_path = public, private as
$$
declare
  r      game_rooms%rowtype;
  st     jsonb := p_state;
  v_size integer;
  v_mode text;
  v_kind text;
  v_b    jsonb;
  v_name text := private.player_name(p_user);
  v_path integer[] := p_path;
  v_tile text;
  v_gq   uuid;
  v_reason text;
begin
  select * into r from game_rooms where id = p_room;
  v_size := (r.settings ->> 'size')::integer;
  v_mode := r.settings ->> 'mode';
  v_b := private.snake_board(v_size);

  if p_pos = v_size then
    st := private.snake_move(p_room, p_user, v_path, st);
    return private.add_log(st, '🏆 ' || v_name || ' mencapai garis akhir!') || jsonb_build_object('winner', p_user, 'phase', 'finished');
  end if;

  v_kind := private.snake_tile(p_pos, v_size, v_mode);

  if v_kind = 'tangga' then
    v_path := v_path || (v_b -> 'ladders' ->> p_pos::text)::integer;
    st := private.snake_move(p_room, p_user, v_path, st);
    st := private.add_log(st, '🪜 ' || v_name || ' naik tangga ke petak ' || (v_b -> 'ladders' ->> p_pos::text));
    return private.snake_next_turn(p_room, st);
  end if;

  if v_kind = 'ular' and not (r.settings ->> 'snake_rescue')::boolean then
    v_path := v_path || (v_b -> 'snakes' ->> p_pos::text)::integer;
    st := private.snake_move(p_room, p_user, v_path, st);
    st := private.add_log(st, '🐍 ' || v_name || ' turun ke petak ' || (v_b -> 'snakes' ->> p_pos::text));
    return private.snake_next_turn(p_room, st);
  end if;

  st := private.snake_move(p_room, p_user, v_path, st);

  if v_kind = 'bonus' then
    st := private.add_log(st, '⭐ Bonus! ' || v_name || ' melempar dadu lagi');
    return st || jsonb_build_object('phase', 'turn', 'turn_deadline', now() + interval '45 seconds');
  end if;

  if v_kind in ('ular', 'khusus') or v_kind = any (private.snake_mode_tiles('mixed')) then
    v_tile := case when v_kind in ('ular', 'khusus')
                   then (private.snake_mode_tiles(v_mode))[1 + floor(random() * array_length(private.snake_mode_tiles(v_mode), 1))::integer]
                   else v_kind end;
    v_reason := case v_kind when 'ular' then 'snake' when 'khusus' then 'special' else 'challenge' end;
    v_gq := private.snake_question_for(p_room, v_tile, v_kind = 'khusus');
    if v_gq is null then
      st := private.add_log(st, 'Belum ada soal untuk petak ini');
      return private.snake_next_turn(p_room, st);
    end if;
    if v_kind = 'ular' then st := private.add_log(st, '🐍 ' || v_name || ' di kepala ular — soal penyelamat!'); end if;
    if v_kind = 'khusus' then st := private.add_log(st, '❗ ' || v_name || ' mendapat tantangan khusus'); end if;
    return st || jsonb_build_object('phase', 'question', 'pending',
      jsonb_build_object('user', p_user, 'reason', v_reason, 'at', p_pos, 'tile', v_tile, 'gq', v_gq));
  end if;

  return private.snake_next_turn(p_room, st);
end;
$$;

-- Terapkan hasil jawaban soal petak (dipanggil pemain yang menjawab, atau siapa saja setelah tenggat)
create function private.snake_resolve(p_room uuid) returns void
language plpgsql set search_path = public, private as
$$
declare
  r      game_rooms%rowtype;
  st     jsonb;
  pd     jsonb;
  v_user uuid;
  v_gq   uuid;
  v_ok   boolean;
  v_pts  integer;
  v_name text;
  v_size integer;
  v_b    jsonb;
  v_path integer[];
  v_pos  integer;
begin
  select * into r from game_rooms where id = p_room;
  st := r.state; pd := st -> 'pending';
  v_user := (pd ->> 'user')::uuid; v_gq := (pd ->> 'gq')::uuid;
  v_name := private.player_name(v_user);
  v_size := (r.settings ->> 'size')::integer;
  v_b := private.snake_board(v_size);

  select is_correct, points into v_ok, v_pts from player_answers where game_question_id = v_gq and user_id = v_user;
  if v_ok is null then   -- tidak menjawab sampai tenggat
    insert into player_answers (game_question_id, user_id, is_correct, time_ms, points)
    values (v_gq, v_user, false, 0, 0) on conflict do nothing;
    v_ok := false; v_pts := 0;
  end if;
  st := private.add_log(st, case when v_ok then '✅ ' || v_name || ' menjawab benar (+' || v_pts || ')' else '❌ ' || v_name || ' belum tepat' end);

  if pd ->> 'reason' = 'challenge' then
    if not v_ok and (r.settings ->> 'wrong_skips')::boolean then
      update room_players set skip_turns = 1 where room_id = p_room and user_id = v_user;
    end if;
  elsif pd ->> 'reason' = 'snake' then
    if v_ok then
      st := private.add_log(st, '🛡️ ' || v_name || ' selamat dari ular');
    else
      st := private.snake_move(p_room, v_user, array[(v_b -> 'snakes' ->> (pd ->> 'at'))::integer], st);
      st := private.add_log(st, '🐍 ' || v_name || ' turun ke petak ' || (v_b -> 'snakes' ->> (pd ->> 'at')));
    end if;
  elsif pd ->> 'reason' = 'special' then
    v_path := private.snake_path((pd ->> 'at')::integer, case when v_ok then 5 else -3 end, v_size);
    v_pos := v_path[array_length(v_path, 1)];
    st := private.add_log(st, case when v_ok then '🚀 ' || v_name || ' maju 5 petak' else '↩️ ' || v_name || ' mundur 3 petak' end);
    if v_pos = v_size then
      st := private.snake_move(p_room, v_user, v_path, st);
      st := private.add_log(st, '🏆 ' || v_name || ' mencapai garis akhir!') || jsonb_build_object('winner', v_user, 'pending', null);
      perform private.finish_room(p_room, st);
      return;
    end if;
    -- tangga/ular setelah tantangan khusus berlaku otomatis
    if v_b -> 'ladders' ? v_pos::text then v_path := v_path || (v_b -> 'ladders' ->> v_pos::text)::integer;
    elsif v_b -> 'snakes' ? v_pos::text then v_path := v_path || (v_b -> 'snakes' ->> v_pos::text)::integer;
    end if;
    st := private.snake_move(p_room, v_user, v_path, st);
  end if;

  st := private.snake_next_turn(p_room, st);
  update game_rooms set state = st where id = p_room;
  perform private.bump(p_room);
end;
$$;

-- Quiz Battle: maju ke pembahasan / soal berikutnya / selesai jika syarat terpenuhi
create function private.quiz_advance(p_room uuid) returns void
language plpgsql set search_path = public, private as
$$
declare
  r       game_rooms%rowtype;
  st      jsonb;
  v_gq    game_questions%rowtype;
  v_next  game_questions%rowtype;
  v_all   boolean;
  v_time  integer;
begin
  select * into r from game_rooms where id = p_room;
  st := r.state;

  if st ->> 'phase' = 'question' then
    select * into v_gq from game_questions where id = (st ->> 'gq')::uuid;
    select not exists (
      select 1 from room_players p
      where p.room_id = p_room and p.is_player and private.is_online(p.last_seen_at)
        and not exists (select 1 from player_answers a where a.game_question_id = v_gq.id and a.user_id = p.user_id)
    ) into v_all;
    if v_all or now() > v_gq.deadline_at + interval '1 second' then
      update game_rooms set state = st || jsonb_build_object('phase', 'reveal', 'reveal_until', now() + interval '6 seconds')
      where id = p_room;
      perform private.bump(p_room);
    end if;

  elsif st ->> 'phase' = 'reveal' and now() >= (st ->> 'reveal_until')::timestamptz then
    if (st ->> 'index')::integer >= (st ->> 'total')::integer then
      perform private.finish_room(p_room, st);
      return;
    end if;
    select g.* into v_next from game_questions g
    where g.session_id = r.session_id and g.order_index = (st ->> 'index')::integer + 1;
    select coalesce((r.settings ->> 'time_limit')::integer, q.time_limit_sec) into v_time from questions q where q.id = v_next.question_id;
    update game_questions set served_at = now(), deadline_at = now() + make_interval(secs => v_time) where id = v_next.id;
    update game_rooms set state = st || jsonb_build_object('phase', 'question', 'index', v_next.order_index, 'gq', v_next.id, 'reveal_until', null)
    where id = p_room;
    perform private.bump(p_room);
  end if;
end;
$$;

-- =====================================================================
-- API room (dipanggil aplikasi)
-- =====================================================================
create function create_room(p_settings jsonb) returns text
language plpgsql security definer set search_path = public, private as
$$
declare
  v_settings jsonb := private.room_settings(p_settings);
  v_code text := private.new_room_code();
  v_room uuid;
begin
  if auth.uid() is null then raise exception 'Silakan login terlebih dahulu'; end if;
  insert into game_rooms (code, institution_id, host_id, arena, max_players, settings, state)
  values (v_code, my_institution(), auth.uid(),
          case when v_settings ->> 'game' = 'snake' then 'snake_ladder' else v_settings ->> 'arena' end::arena_type,
          (v_settings ->> 'max_players')::integer, v_settings, '{"phase":"lobby"}')
  returning id into v_room;
  insert into room_players (room_id, user_id, piece_color, is_ready, is_player)
  values (v_room, auth.uid(), '0', true, (v_settings ->> 'host_plays')::boolean);
  return v_code;
end;
$$;

create function join_room(p_code text) returns text
language plpgsql security definer set search_path = public, private as
$$
declare
  r game_rooms%rowtype;
  v_n integer;
begin
  if auth.uid() is null then raise exception 'Silakan login terlebih dahulu'; end if;
  select * into r from game_rooms where code = upper(trim(p_code)) for update;
  if r.id is null or r.status = 'cancelled' then raise exception 'Kode room tidak ditemukan'; end if;
  if r.institution_id is distinct from my_institution() then raise exception 'Room ini milik lembaga lain'; end if;

  if exists (select 1 from room_players where room_id = r.id and user_id = auth.uid()) then
    update room_players set last_seen_at = now() where room_id = r.id and user_id = auth.uid();   -- bergabung kembali
    perform private.bump(r.id);
    return r.code;
  end if;
  if r.status <> 'lobby' then raise exception 'Permainan sudah dimulai'; end if;
  select count(*) into v_n from room_players where room_id = r.id and is_player;
  if v_n >= r.max_players then raise exception 'Room penuh'; end if;

  insert into room_players (room_id, user_id, piece_color, is_ready, is_player)
  values (r.id, auth.uid(), ((select count(*) from room_players where room_id = r.id) % 12)::text, false, true);
  perform private.bump(r.id);
  return r.code;
end;
$$;

create function leave_room(p_room uuid) returns void
language plpgsql security definer set search_path = public, private as
$$
declare
  r game_rooms%rowtype;
  v_next uuid;
begin
  select * into r from game_rooms where id = p_room for update;
  if r.id is null or not exists (select 1 from room_players where room_id = p_room and user_id = auth.uid()) then return; end if;

  if r.status = 'lobby' then
    delete from room_players where room_id = p_room and user_id = auth.uid();
    if r.host_id = auth.uid() then
      select user_id into v_next from room_players where room_id = p_room order by joined_at limit 1;
      if v_next is null then
        update game_rooms set status = 'cancelled' where id = p_room;
      else
        update game_rooms set host_id = v_next where id = p_room;
        update room_players set is_ready = true, is_player = true where room_id = p_room and user_id = v_next;
      end if;
    end if;
  else
    -- Saat bermain: tandai terputus (giliran/soal tidak menunggu)
    update room_players set last_seen_at = now() - interval '1 minute' where room_id = p_room and user_id = auth.uid();
  end if;
  perform private.bump(p_room);
end;
$$;

create function set_ready(p_room uuid, p_ready boolean) returns void
language plpgsql security definer set search_path = public, private as
$$
begin
  update room_players p set is_ready = p_ready, last_seen_at = now()
  from game_rooms r
  where r.id = p.room_id and r.id = p_room and r.status = 'lobby' and p.user_id = auth.uid();
  if not found then raise exception 'Tidak bisa mengubah status siap'; end if;
  perform private.bump(p_room);
end;
$$;

create function update_room_settings(p_room uuid, p_settings jsonb) returns void
language plpgsql security definer set search_path = public, private as
$$
declare
  v_settings jsonb := private.room_settings(p_settings);
  r game_rooms%rowtype;
begin
  select * into r from game_rooms where id = p_room for update;
  if r.host_id is distinct from auth.uid() then raise exception 'Hanya host yang bisa mengubah pengaturan'; end if;
  if r.status <> 'lobby' then raise exception 'Pengaturan hanya bisa diubah di lobby'; end if;
  if (v_settings ->> 'game') <> (r.settings ->> 'game') then raise exception 'Jenis permainan tidak bisa diganti; buat room baru'; end if;
  if (select count(*) from room_players where room_id = p_room and (is_player or user_id = auth.uid())) > (v_settings ->> 'max_players')::integer then
    raise exception 'Pemain di room melebihi batas baru';
  end if;
  update game_rooms set settings = v_settings, max_players = (v_settings ->> 'max_players')::integer,
         arena = case when v_settings ->> 'game' = 'snake' then 'snake_ladder' else v_settings ->> 'arena' end::arena_type
  where id = p_room;
  update room_players set is_player = (v_settings ->> 'host_plays')::boolean where room_id = p_room and user_id = auth.uid();
  perform private.bump(p_room);
end;
$$;

create function room_heartbeat(p_room uuid) returns void
language sql security definer set search_path = public, private as
$$ update room_players set last_seen_at = now() where room_id = p_room and user_id = auth.uid() $$;

create function start_room(p_room uuid) returns void
language plpgsql security definer set search_path = public, private as
$$
declare
  r game_rooms%rowtype;
  s jsonb;
  v_session uuid;
  v_players integer;
  v_members integer;
  v_n integer;
  v_first game_questions%rowtype;
  v_time integer;
  v_turn uuid;
begin
  select * into r from game_rooms where id = p_room for update;
  if r.host_id is distinct from auth.uid() then raise exception 'Hanya host yang bisa memulai'; end if;
  if r.status <> 'lobby' then raise exception 'Permainan sudah dimulai'; end if;
  s := r.settings;
  select count(*) filter (where is_player), count(*) into v_players, v_members from room_players where room_id = p_room;
  if v_members < 2 or v_players < 1 then raise exception 'Minimal 2 orang di room untuk memulai'; end if;
  if exists (select 1 from room_players where room_id = p_room and is_player and not is_ready) then
    raise exception 'Masih ada pemain yang belum siap';
  end if;

  insert into game_sessions (room_id, arena, settings) values (p_room, r.arena, s) returning id into v_session;

  if s ->> 'game' = 'quiz' then
    insert into game_questions (session_id, question_id, order_index)
    select v_session, pick.id, row_number() over (order by random())
    from (
      select q.id from questions q join categories c on c.id = q.category_id
      where q.is_published and c.arena = (s ->> 'arena')::arena_type
        and (q.institution_id is null or q.institution_id = r.institution_id)
        and (s ->> 'category_slug' is null or c.slug = s ->> 'category_slug')
        and (s ->> 'difficulty' is null or q.difficulty = (s ->> 'difficulty')::difficulty)
        and (s ->> 'game_type' is null or q.game_type = (s ->> 'game_type')::game_type)
      order by random() limit (s ->> 'count')::integer
    ) pick;
    get diagnostics v_n = row_count;
    if v_n = 0 then raise exception 'Belum ada soal untuk pengaturan ini'; end if;

    select * into v_first from game_questions where session_id = v_session and order_index = 1;
    select coalesce((s ->> 'time_limit')::integer, q.time_limit_sec) into v_time from questions q where q.id = v_first.question_id;
    update game_questions set served_at = now(), deadline_at = now() + make_interval(secs => v_time) where id = v_first.id;
    update game_rooms set status = 'playing', session_id = v_session,
           state = jsonb_build_object('phase', 'question', 'index', 1, 'total', v_n, 'gq', v_first.id)
    where id = p_room;
  else
    update room_players p set turn_order = o.rn, board_pos = 0, skip_turns = 0
    from (select user_id, row_number() over (order by random()) rn from room_players where room_id = p_room and is_player) o
    where p.room_id = p_room and p.user_id = o.user_id;
    select user_id into v_turn from room_players where room_id = p_room and is_player order by turn_order limit 1;
    update game_rooms set status = 'playing', session_id = v_session,
           state = jsonb_build_object('phase', 'turn', 'turn_user', v_turn, 'turn_deadline', now() + interval '45 seconds',
                                      'dice', null, 'move', null, 'pending', null, 'winner', null,
                                      'log', jsonb_build_array('🎮 Permainan dimulai! Giliran pertama: ' || private.player_name(v_turn)))
    where id = p_room;
  end if;
  perform private.bump(p_room);
end;
$$;

-- Ular tangga online: lempar dadu (hanya pemain yang sedang giliran; dadu diacak server)
create function room_roll(p_room uuid) returns void
language plpgsql security definer set search_path = public, private as
$$
declare
  r game_rooms%rowtype;
  st jsonb;
  v_dice integer := 1 + floor(random() * 6)::integer;
  v_pos integer;
  v_path integer[];
begin
  select * into r from game_rooms where id = p_room for update;
  st := r.state;
  if r.status <> 'playing' or r.settings ->> 'game' <> 'snake' or st ->> 'phase' <> 'turn' then raise exception 'Belum saatnya melempar dadu'; end if;
  if (st ->> 'turn_user')::uuid is distinct from auth.uid() then raise exception 'Bukan giliranmu'; end if;

  update room_players set last_seen_at = now() where room_id = p_room and user_id = auth.uid();
  select board_pos into v_pos from room_players where room_id = p_room and user_id = auth.uid();
  v_path := private.snake_path(v_pos, v_dice, (r.settings ->> 'size')::integer);
  st := private.add_log(st || jsonb_build_object('dice', v_dice), '🎲 ' || private.player_name(auth.uid()) || ' mendapat ' || v_dice);
  st := private.snake_land(p_room, auth.uid(), v_path[array_length(v_path, 1)], v_path, st);

  if st ->> 'phase' = 'finished' then
    perform private.finish_room(p_room, st);
  else
    update game_rooms set state = st where id = p_room;
    perform private.bump(p_room);
  end if;
end;
$$;

-- Ular tangga online: lanjutkan setelah pemain melihat hasil jawabannya
create function room_snake_resolve(p_room uuid) returns void
language plpgsql security definer set search_path = public, private as
$$
declare r game_rooms%rowtype;
begin
  select * into r from game_rooms where id = p_room for update;
  if r.state ->> 'phase' <> 'question' then return; end if;   -- sudah diselesaikan perangkat lain
  if (r.state -> 'pending' ->> 'user')::uuid is distinct from auth.uid() then raise exception 'Bukan giliranmu'; end if;
  if not exists (select 1 from player_answers where game_question_id = (r.state -> 'pending' ->> 'gq')::uuid and user_id = auth.uid()) then
    raise exception 'Jawab soal terlebih dahulu';
  end if;
  perform private.snake_resolve(p_room);
end;
$$;

-- Boleh dipanggil anggota mana pun; server hanya maju jika syarat terpenuhi
create function room_advance(p_room uuid) returns void
language plpgsql security definer set search_path = public, private as
$$
declare
  r game_rooms%rowtype;
  st jsonb;
begin
  if not is_room_member(p_room) then raise exception 'Bukan anggota room'; end if;
  select * into r from game_rooms where id = p_room for update;
  if r.status <> 'playing' then return; end if;
  st := r.state;

  if r.settings ->> 'game' = 'quiz' then
    perform private.quiz_advance(p_room);
  elsif st ->> 'phase' = 'turn' and now() > (st ->> 'turn_deadline')::timestamptz then
    st := private.add_log(st, '⏱️ ' || private.player_name((st ->> 'turn_user')::uuid) || ' tidak melempar dadu, giliran dilewati');
    update game_rooms set state = private.snake_next_turn(p_room, st) where id = p_room;
    perform private.bump(p_room);
  elsif st ->> 'phase' = 'question'
        and now() > (select deadline_at from game_questions where id = (st -> 'pending' ->> 'gq')::uuid) + interval '8 seconds' then
    perform private.snake_resolve(p_room);
  end if;
end;
$$;

-- Status lengkap room untuk ditampilkan (tanpa kunci jawaban sebelum waktunya)
create function room_state(p_room uuid) returns jsonb
language plpgsql security definer set search_path = public, private as
$$
declare
  r   game_rooms%rowtype;
  st  jsonb;
  v_gq uuid;
  v_out jsonb;
  v_reveal boolean := false;
  v_mine jsonb;
begin
  if not is_room_member(p_room) then raise exception 'Bukan anggota room'; end if;
  select * into r from game_rooms where id = p_room;
  st := r.state;
  v_gq := coalesce((st ->> 'gq')::uuid, (st -> 'pending' ->> 'gq')::uuid);

  v_out := jsonb_build_object(
    'room', jsonb_build_object('id', r.id, 'code', r.code, 'status', r.status, 'arena', r.arena,
                               'settings', r.settings, 'host_id', r.host_id, 'version', r.version),
    'me', auth.uid(),
    'players', coalesce((
      select jsonb_agg(jsonb_build_object(
        'user_id', p.user_id, 'nickname', coalesce(nullif(pr.nickname, ''), 'Pemain'),
        'color', p.piece_color::integer, 'turn_order', p.turn_order, 'is_player', p.is_player,
        'is_ready', p.is_ready, 'online', private.is_online(p.last_seen_at),
        'board_pos', p.board_pos, 'skip', p.skip_turns,
        'score', coalesce(sc.score, 0), 'correct', coalesce(sc.correct, 0), 'answered', coalesce(sc.answered, 0),
        'answered_current', v_gq is not null and exists (select 1 from player_answers a where a.game_question_id = v_gq and a.user_id = p.user_id)
      ) order by p.joined_at)
      from room_players p
      join profiles pr on pr.id = p.user_id
      left join lateral (
        select sum(a.points)::integer score, count(*) filter (where a.is_correct)::integer correct, count(*)::integer answered
        from player_answers a join game_questions g on g.id = a.game_question_id
        where g.session_id = r.session_id and a.user_id = p.user_id
      ) sc on true
      where p.room_id = p_room), '[]'::jsonb),
    'state', st - 'gq' - 'turn_deadline' - 'reveal_until'
  );

  if r.status = 'playing' and st ->> 'phase' = 'turn' then
    v_out := jsonb_set(v_out, '{state,turn_remaining_ms}',
      to_jsonb(greatest(0, (extract(epoch from (st ->> 'turn_deadline')::timestamptz - now()) * 1000)::integer)));
  end if;

  if v_gq is not null and st ->> 'phase' in ('question', 'reveal') then
    v_out := jsonb_set(v_out, '{question}', private.question_payload(v_gq));
    select jsonb_build_object('option_id', a.option_id, 'text', a.text_answer, 'is_correct', a.is_correct, 'points', a.points)
    into v_mine from player_answers a where a.game_question_id = v_gq and a.user_id = auth.uid();

    if r.settings ->> 'game' = 'quiz' then
      v_reveal := st ->> 'phase' = 'reveal';
      if v_reveal then
        v_out := jsonb_set(v_out, '{state,reveal_remaining_ms}',
          to_jsonb(greatest(0, (extract(epoch from (st ->> 'reveal_until')::timestamptz - now()) * 1000)::integer)));
      end if;
    else
      -- Ular tangga: hasil dibuka untuk semua setelah pemain yang giliran menjawab (atau waktu habis)
      select jsonb_build_object('option_id', a.option_id, 'text', a.text_answer, 'is_correct', a.is_correct, 'points', a.points)
      into v_mine from player_answers a where a.game_question_id = v_gq and a.user_id = (st -> 'pending' ->> 'user')::uuid;
      v_reveal := v_mine is not null
                  or now() > (select deadline_at from game_questions where id = v_gq) + interval '1 second';
    end if;

    -- Hasil jawaban sendiri hanya ditampilkan setelah pembahasan dibuka
    if v_reveal then
      v_out := jsonb_set(v_out, '{reveal}', private.answer_reveal(v_gq) || jsonb_build_object('answer', v_mine));
    elsif v_mine is not null then
      v_out := jsonb_set(v_out, '{reveal}', jsonb_build_object('answer', jsonb_build_object('option_id', v_mine -> 'option_id', 'text', v_mine -> 'text')));
    end if;
  end if;
  return v_out;
end;
$$;

-- Room yang sedang saya ikuti (untuk tombol "kembali ke room")
create function my_active_rooms() returns table (code text, status room_status, game text, players integer)
language sql stable security definer set search_path = public, private as
$$
  select r.code, r.status, r.settings ->> 'game', (select count(*)::integer from room_players x where x.room_id = r.id)
  from game_rooms r join room_players p on p.room_id = r.id and p.user_id = auth.uid()
  where r.status in ('lobby', 'playing') and r.created_at > now() - interval '1 day'
  order by r.created_at desc
$$;

-- =====================================================================
-- submit_answer: aturan tambahan untuk room
--   * Quiz Battle: hanya soal yang sedang berjalan; hasil BARU dibuka saat pembahasan.
--   * Ular tangga: hanya pemain yang sedang giliran.
-- =====================================================================
create or replace function submit_answer(p_game_question_id uuid, p_option_id uuid default null, p_text text default null)
returns table (is_correct boolean, points integer, correct_option_id uuid, correct_text text, explanation text)
language plpgsql security definer set search_path = public, private as
$$
#variable_conflict use_column
declare
  gq        game_questions%rowtype;
  s         game_sessions%rowtype;
  r         game_rooms%rowtype;
  k         answer_keys%rowtype;
  v_correct boolean;
  v_ms      integer;
  v_limit   numeric;
  v_points  integer := 0;
begin
  select * into gq from game_questions g where g.id = p_game_question_id;
  if gq.id is null or gq.served_at is null then raise exception 'Soal tidak ditemukan'; end if;

  select * into s from game_sessions gs where gs.id = gq.session_id;
  if s.status <> 'active' or not (s.user_id = auth.uid() or (s.room_id is not null and is_room_member(s.room_id))) then
    raise exception 'Bukan peserta sesi ini';
  end if;

  if s.room_id is not null then
    select * into r from game_rooms where id = s.room_id;
    if not exists (select 1 from room_players where room_id = r.id and user_id = auth.uid() and is_player) then
      raise exception 'Penonton tidak bisa menjawab';
    end if;
    if r.settings ->> 'game' = 'quiz' and (r.state ->> 'phase' <> 'question' or (r.state ->> 'gq')::uuid <> gq.id) then
      raise exception 'Soal sudah ditutup';
    end if;
    if r.settings ->> 'game' = 'snake' and (r.state ->> 'phase' <> 'question'
        or (r.state -> 'pending' ->> 'gq')::uuid <> gq.id or (r.state -> 'pending' ->> 'user')::uuid <> auth.uid()) then
      raise exception 'Bukan giliranmu menjawab';
    end if;
    update room_players set last_seen_at = now() where room_id = r.id and user_id = auth.uid();
  end if;

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

  if r.id is not null and r.settings ->> 'game' = 'quiz' then
    perform private.bump(r.id);            -- "N pemain sudah menjawab"
    return query select null::boolean, null::integer, null::uuid, null::text, null::text;   -- dibuka saat pembahasan
    return;
  end if;
  if r.id is not null then perform private.bump(r.id); end if;

  return query
  select v_correct, v_points, k.correct_option_id, k.accepted_texts[1], q.explanation
  from questions q where q.id = gq.question_id;
end;
$$;

-- snake_question (mode lokal) kini memakai pemilih soal bersama
create or replace function snake_question(p_session_id uuid, p_tile text, p_harder boolean default false)
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
  v_qid  uuid;
  v_id   uuid;
  v_time integer;
begin
  select * into s from game_sessions gs
  where gs.id = p_session_id and gs.user_id = auth.uid() and gs.arena = 'snake_ladder';
  if s.id is null then raise exception 'Sesi tidak ditemukan'; end if;
  if s.status <> 'active' then raise exception 'Permainan sudah selesai'; end if;
  if p_tile not in ('mufrodat', 'terjemah', 'muhadatsah', 'qowaid', 'nahwu', 'shorof') then
    raise exception 'Jenis petak tidak dikenal';
  end if;

  -- Soal yang masih berjalan dikembalikan lagi agar pemain tidak bisa "memilih" soal
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
    v_qid := private.pick_question(s.id, p_tile,
               case when p_harder then 'advanced'::difficulty else (s.settings ->> 'difficulty')::difficulty end,
               my_institution());
    if v_qid is null then raise exception 'Belum ada soal untuk petak ini'; end if;
    select coalesce((s.settings ->> 'time_limit')::integer, q.time_limit_sec) into v_time from questions q where q.id = v_qid;
    v_id := private.serve_question(s.id, v_qid, v_time);
    select * into gq from game_questions g where g.id = v_id;
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

-- =====================================================================
-- Leaderboard lembaga: harian / mingguan / keseluruhan (WIB)
-- Ular tangga lokal multi-pemain tidak dihitung (jawaban bukan milik satu akun).
-- =====================================================================
create function leaderboard(p_period text default 'week')
returns table (rank bigint, user_id uuid, nickname text, total_score bigint, games bigint, is_me boolean)
language sql stable security definer set search_path = public, private as
$$
  with agg as (
    select s.user_id, sum(s.score)::bigint total, count(*)::bigint games
    from scores s join game_sessions gs on gs.id = s.session_id
    where s.institution_id = my_institution()
      and not (gs.room_id is null and gs.arena = 'snake_ladder' and coalesce((gs.settings ->> 'players')::integer, 1) > 1)
      and s.created_at >= case p_period
            when 'today' then date_trunc('day', now() at time zone 'Asia/Jakarta') at time zone 'Asia/Jakarta'
            when 'week'  then date_trunc('week', now() at time zone 'Asia/Jakarta') at time zone 'Asia/Jakarta'
            else '-infinity'::timestamptz end
    group by s.user_id
  ), ranked as (
    select rank() over (order by a.total desc) rk, a.user_id, coalesce(nullif(p.nickname, ''), 'Pemain') nick, a.total, a.games
    from agg a join profiles p on p.id = a.user_id
  )
  select rk, user_id, nick, total, games, user_id = auth.uid()
  from ranked where rk <= 50 or user_id = auth.uid()
  order by rk, nick
$$;

-- =====================================================================
-- Hak eksekusi
-- =====================================================================
revoke execute on all functions in schema private from public, anon, authenticated;

revoke execute on function
  create_room(jsonb), join_room(text), leave_room(uuid), set_ready(uuid, boolean),
  update_room_settings(uuid, jsonb), room_heartbeat(uuid), start_room(uuid), room_roll(uuid),
  room_snake_resolve(uuid), room_advance(uuid), room_state(uuid), my_active_rooms(), leaderboard(text)
from public, anon;

grant execute on function
  create_room(jsonb), join_room(text), leave_room(uuid), set_ready(uuid, boolean),
  update_room_settings(uuid, jsonb), room_heartbeat(uuid), start_room(uuid), room_roll(uuid),
  room_snake_resolve(uuid), room_advance(uuid), room_state(uuid), my_active_rooms(), leaderboard(text)
to authenticated;

-- Fungsi bantu RLS (my_role, my_institution, is_staff, is_room_member) tetap bisa dipakai policy
grant execute on function private.my_role(), private.my_institution(), private.is_staff(), private.is_room_member(uuid)
to anon, authenticated;
