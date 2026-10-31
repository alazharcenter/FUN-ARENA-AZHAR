-- =====================================================================
-- Uji alur permainan & gamifikasi: skor, XP, badge, misi, batas XP harian, riwayat, progres.
-- =====================================================================
\set ON_ERROR_STOP 1
\ir helpers.sql
insert into auth.users (id, email, raw_user_meta_data) values ('c0000000-0000-0000-0000-000000000001', 'pemain@uji.id', '{"nickname":"Pemain"}');

-- mainkan satu Quick Play sampai selesai; jawab benar kecuali soal nomor "salah_di"
create function t.play(p_arena arena_type, p_n int, salah_di int default 0) returns uuid language plpgsql as $$  -- hanya jenis pilihan ganda
declare sid uuid; r record; i int := 0;
begin
  sid := start_quick_play(p_arena, null, null, p_n,
    case p_arena when 'qowaid' then 'irab_challenge' else 'vocabulary_challenge' end::game_type);
  loop
    select * into r from next_question(sid);
    exit when r.game_question_id is null;
    i := i + 1;
    if i = salah_di then
      perform submit_answer(r.game_question_id, (select (o ->> 'id')::uuid from jsonb_array_elements(r.options) o
                                                 where (o ->> 'id')::uuid is distinct from t.key_of(r.game_question_id) limit 1), null);
    else
      perform submit_answer(r.game_question_id, t.key_of(r.game_question_id), null);
    end if;
  end loop;
  perform finish_quick_play(sid);
  return sid;
end $$;
grant execute on function t.play(arena_type, int, int) to authenticated;

do $$
declare u uuid := 'c0000000-0000-0000-0000-000000000001'; sid uuid; res jsonb; xp1 int; xp2 int; got int;
begin
  perform t.as_user(u);
  raise notice '== 1. Quick Play penuh';
  sid := t.play('mufrodat', 5, 2);
  res := get_session_result(sid);
  perform t.ok(res ->> 'status' = 'finished', 'sesi berstatus selesai');
  perform t.ok((res ->> 'answered_count')::int = 5 and (res ->> 'correct_count')::int = 4, 'skor: 4 dari 5 benar');
  perform t.ok(jsonb_array_length(res -> 'review') = 5, 'ulasan berisi 5 soal (kunci baru dibuka setelah selesai)');
  perform t.ok((res -> 'review' -> 1 ->> 'is_correct')::boolean = false, 'soal ke-2 tercatat salah');
  perform t.ok(res -> 'new_badges' @> '[{"code":"first_game"}]', 'badge "Langkah Pertama" diberikan');
  xp1 := (select xp from player_stats where user_id = u);
  perform t.ok(xp1 = (res ->> 'xp_earned')::int and xp1 > 0, 'XP masuk ke statistik pemain');
  perform finish_quick_play(sid);
  perform t.ok((select xp from player_stats where user_id = u) = xp1, 'menyelesaikan ulang permainan tidak menambah XP');

  raise notice '== 2. Badge tidak dobel';
  sid := t.play('mufrodat', 3);
  perform t.ok(not (get_session_result(sid) -> 'new_badges' @> '[{"code":"first_game"}]'), 'badge yang sama tidak diberikan lagi');
  perform t.ok((select count(*) from my_badges() where code = 'first_game' and earned_at is not null) = 1, 'my_badges menandai badge yang didapat');

  raise notice '== 3. Misi';
  sid := t.play('qowaid', 5);
  xp1 := (select xp from player_stats where user_id = u);
  got := claim_mission('daily_qowaid_5');
  xp2 := (select xp from player_stats where user_id = u);
  perform t.ok(got = 20 and xp2 = xp1 + 20, 'klaim misi menambah XP sesuai hadiah');
  perform t.denied($q$select claim_mission('daily_qowaid_5')$q$, 'misi tidak bisa diklaim dua kali');
  perform t.ok((select claimed from my_missions() where code = 'daily_qowaid_5'), 'status misi menjadi diklaim');

  raise notice '== 4. Batas XP harian';
  execute 'reset role';
  update scores set xp_earned = 700 where user_id = u and session_id = sid;   -- seolah sudah 600+ XP hari ini
  perform t.as_user(u);
  sid := t.play('mufrodat', 3);
  res := get_session_result(sid);
  perform t.ok((res ->> 'xp_halved')::boolean, 'hasil memberi tanda XP dihitung setengah');
  perform t.ok((res ->> 'xp_earned')::int = round(round((res ->> 'score')::int / 10.0) / 2.0), 'XP benar-benar setengah');

  raise notice '== 5. Riwayat & progres';
  perform t.ok((select count(*) from my_history(10, 0, null)) = 4 and (select max(total) from my_history(2, 0, null)) = 4,
               'riwayat berisi 4 permainan dengan total untuk paginasi');
  perform t.ok((select count(*) from my_history(10, 0, 'qowaid')) = 1, 'filter arena riwayat');
  res := my_progress();
  perform t.ok((res -> 'compare' -> 'this' ->> 'answered')::int = 16, 'progres minggu ini menghitung 16 jawaban');
  perform t.ok(jsonb_array_length(res -> 'activity') = 14, 'grafik aktivitas berisi 14 hari');
  execute 'reset role';
end $$;

reset role;
set client_min_messages = warning;
drop schema t cascade;
\echo 'SEMUA UJI PERMAINAN LOLOS'
