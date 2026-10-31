-- =====================================================================
-- Uji keamanan & validasi server (Tahap 8). Dijalankan oleh scripts/test-db.sh pada database kosong
-- yang sudah berisi migrasi + seed. Setiap pemeriksaan yang gagal menghentikan uji dengan pesan "GAGAL: ...".
-- =====================================================================
\set ON_ERROR_STOP 1
set client_min_messages = notice;

-- ---------- Data uji: 2 lembaga, masing-masing santri & guru; admin lembaga A ----------
insert into institutions (id, name, slug) values ('b0000000-0000-0000-0000-000000000000', 'Lembaga Uji B', 'uji-b');
insert into auth.users (id, email, raw_user_meta_data) values
  ('a0000000-0000-0000-0000-000000000001', 'santri.a@uji.id', '{"nickname":"Santri A"}'),
  ('a0000000-0000-0000-0000-000000000002', 'guru.a@uji.id', '{"nickname":"Guru A"}'),
  ('a0000000-0000-0000-0000-000000000003', 'admin.a@uji.id', '{"nickname":"Admin A"}'),
  ('b0000000-0000-0000-0000-000000000001', 'santri.b@uji.id', '{"nickname":"Santri B"}'),
  ('b0000000-0000-0000-0000-000000000002', 'guru.b@uji.id', '{"nickname":"Guru B"}');
update profiles set role = 'teacher' where id in ('a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002');
update profiles set role = 'institution_admin' where id = 'a0000000-0000-0000-0000-000000000003';
update profiles set institution_id = 'b0000000-0000-0000-0000-000000000000' where id::text like 'b%';

\ir helpers.sql

do $$
declare
  sa uuid := 'a0000000-0000-0000-0000-000000000001'; ga uuid := 'a0000000-0000-0000-0000-000000000002';
  aa uuid := 'a0000000-0000-0000-0000-000000000003'; sb uuid := 'b0000000-0000-0000-0000-000000000001';
  gb uuid := 'b0000000-0000-0000-0000-000000000002';
  sid uuid; r record; res record; qa uuid; cls uuid; code text; n int; xp0 int;
begin
  raise notice '== 1. Pengunjung tanpa login (anon)';
  perform set_config('request.jwt.claims', '{"role":"anon"}', false); execute 'set role anon';
  perform t.ok((select count(*) from profiles) = 0, 'anon tidak bisa membaca profil');
  perform t.ok((select count(*) from questions) = 0, 'anon tidak bisa membaca soal');
  perform t.denied($q$select start_quick_play('mufrodat')$q$, 'anon tidak bisa memulai permainan');
  perform t.denied($q$select leaderboard('week')$q$, 'anon tidak bisa membuka leaderboard');
  execute 'reset role';

  raise notice '== 2. Kunci jawaban tidak pernah sampai ke santri';
  perform t.as_user(sa);
  perform t.ok((select count(*) from questions) = 0, 'santri tidak bisa membaca tabel soal langsung');
  perform t.ok((select count(*) from answer_options) = 0, 'santri tidak bisa membaca opsi langsung');
  perform t.ok((select count(*) from answer_keys) = 0, 'santri tidak bisa membaca kunci jawaban');
  perform t.ok(pg_get_function_result('public.next_question(uuid)'::regprocedure) !~* 'correct|accepted|explanation',
               'next_question tidak mengembalikan kolom kunci/penjelasan');

  raise notice '== 3. Validasi jawaban di server';
  sid := start_quick_play('mufrodat', null, null, 3);
  select * into r from next_question(sid);
  perform t.ok(r.game_question_id is not null, 'soal pertama dikirim');
  perform t.ok(not (r.options::text ~* 'correct'), 'opsi yang dikirim tidak memuat penanda benar');
  -- santri lain tidak bisa mengintip / menjawab sesi orang lain
  execute 'reset role'; perform t.as_user(sb);
  perform t.denied(format('select next_question(%L)', sid), 'santri lembaga lain tidak bisa mengambil soal sesi orang lain');
  perform t.denied(format('select submit_answer(%L, %L, null)', r.game_question_id, t.key_of(r.game_question_id)),
                   'santri lain tidak bisa menjawab soal sesi orang lain');
  perform t.ok((select count(*) from game_sessions where id = sid) = 0, 'sesi orang lain tidak terlihat');
  execute 'reset role'; perform t.as_user(sa);
  select * into res from submit_answer(r.game_question_id, t.key_of(r.game_question_id), null);
  perform t.ok(res.is_correct and res.points > 0, 'jawaban benar dinilai server');
  perform t.denied(format('select submit_answer(%L, %L, null)', r.game_question_id, t.key_of(r.game_question_id)),
                   'satu soal tidak bisa dijawab dua kali');
  perform t.denied(format('select submit_answer(%L, %L, null)', gen_random_uuid(), gen_random_uuid()),
                   'soal palsu ditolak');

  raise notice '== 4. Santri tidak bisa menaikkan hak sendiri / menulis data langsung';
  perform t.denied(format('update profiles set role = %L where id = %L', 'super_admin', sa), 'santri tidak bisa mengubah perannya');
  perform t.denied(format('update profiles set institution_id = %L where id = %L', 'b0000000-0000-0000-0000-000000000000', sa),
                   'santri tidak bisa pindah lembaga sendiri');
  update profiles set nickname = 'Santri A2' where id = sa;
  perform t.ok((select nickname from profiles where id = sa) = 'Santri A2', 'santri bisa mengubah nickname sendiri');
  update profiles set nickname = 'Diretas' where id = ga;
  perform t.ok((select nickname from profiles where id = ga) = 'Guru A', 'santri tidak bisa mengubah profil orang lain');
  xp0 := (select xp from player_stats where user_id = sa);
  update player_stats set xp = 999999 where user_id = sa;
  perform t.ok((select xp from player_stats where user_id = sa) = xp0, 'santri tidak bisa mengubah XP langsung');
  perform t.denied(format('insert into scores (user_id, institution_id, score) values (%L, private.my_institution(), 99999)', sa),
                   'santri tidak bisa menyisipkan skor');
  perform t.denied($q$select claim_mission('daily_correct_10')$q$, 'misi yang belum selesai tidak bisa diklaim');
  perform t.denied($q$select claim_mission('misi_palsu')$q$, 'kode misi palsu ditolak');

  raise notice '== 5. Fungsi guru/admin tertutup untuk santri';
  perform t.denied($q$select save_question(null, '{}')$q$, 'santri tidak bisa menambah soal');
  perform t.denied($q$select * from bank_questions(null, null, null, null, null, null)$q$, 'santri tidak bisa membuka bank soal');
  perform t.denied($q$select create_class('Kelas Palsu', 'beginner')$q$, 'santri tidak bisa membuat kelas');
  perform t.denied($q$select * from admin_users(null)$q$, 'santri tidak bisa melihat daftar pengguna');
  perform t.denied($q$select admin_stats()$q$, 'santri tidak bisa membuka statistik admin');
  perform t.denied(format('select set_user_role(%L, %L)', ga, 'student'), 'santri tidak bisa mengubah peran orang lain');
  execute 'reset role';

  raise notice '== 6. Pemisahan data antarlembaga';
  perform t.as_user(ga);
  qa := save_question(null, '{"category_slug":"dasar","game_type":"vocabulary_challenge","difficulty":"beginner","prompt":"Apa arti kata berikut?","prompt_ar":"قَلَمٌ","explanation":"قَلَمٌ = pena.","options":["Pena","Buku","Meja"],"correct":1}');
  cls := create_class('Kelas Uji A', 'beginner');
  select join_code into code from classes where name = 'Kelas Uji A';
  perform t.ok(qa is not null and code is not null, 'guru A membuat soal & kelas');
  execute 'reset role'; perform t.as_user(gb);
  perform t.ok((select count(*) from profiles where institution_id is distinct from private.my_institution()) = 0,
               'guru B hanya melihat profil lembaganya');
  perform t.ok((select count(*) from questions where id = qa) = 0, 'guru B tidak melihat soal lembaga A');
  perform t.denied(format('select get_question(%L)', qa), 'guru B tidak bisa membuka soal lembaga A');
  perform t.denied(format('select delete_question(%L)', qa), 'guru B tidak bisa menghapus soal lembaga A');
  perform t.denied(format($q$select save_question(%L, '{"category_slug":"dasar","game_type":"vocabulary_challenge","difficulty":"beginner","prompt":"Diretas","prompt_ar":"قَلَمٌ","explanation":"Soal ini diubah orang lain.","options":["Pena","Buku"],"correct":1}')$q$, qa),
                   'guru B tidak bisa mengubah soal lembaga A');
  perform t.ok((select count(*) from classes where name = 'Kelas Uji A') = 0, 'guru B tidak melihat kelas lembaga A');
  execute 'reset role'; perform t.as_user(sb);
  perform t.denied(format('select join_class(%L)', code), 'santri B tidak bisa bergabung ke kelas lembaga A');
  perform t.ok((select count(*) from leaderboard('all') l join profiles p on p.id = l.user_id where p.institution_id is distinct from private.my_institution()) = 0,
               'leaderboard hanya berisi lembaga sendiri');
  execute 'reset role'; perform t.as_user(sa);
  perform t.ok((select count(*) from profiles where id::text like 'b%') = 0, 'santri A tidak melihat profil lembaga B');
  -- soal buatan guru A dipakai di permainan santri A, tetapi kuncinya tetap tersembunyi
  perform t.ok((select count(*) from answer_keys) = 0, 'kunci soal lembaga sendiri pun tidak terlihat santri');
  execute 'reset role';

  raise notice '== 7. Batas wewenang admin lembaga';
  perform t.as_user(aa);
  perform set_user_role(sa, 'teacher');
  perform t.ok((select role from profiles where id = sa) = 'teacher', 'admin lembaga bisa mengubah peran di lembaganya');
  perform set_user_role(sa, 'student');
  perform t.denied(format('select set_user_role(%L, %L)', sa, 'super_admin'), 'admin lembaga tidak bisa membuat super admin');
  perform t.denied(format('select set_user_role(%L, %L)', sb, 'teacher'), 'admin lembaga tidak bisa mengubah pengguna lembaga lain');
  perform t.denied(format('select set_user_role(%L, %L)', aa, 'super_admin'), 'admin tidak bisa menaikkan peran sendiri');
  perform t.denied($q$select create_institution('Lembaga Liar', 'liar')$q$, 'hanya super admin yang bisa menambah lembaga');
  execute 'reset role';

  raise notice '== 8. Room multiplayer antarlembaga';
  perform t.as_user(sa);
  code := create_room('{"game":"quiz","arena":"mufrodat"}');
  execute 'reset role'; perform t.as_user(sb);
  perform t.denied(format('select join_room(%L)', code), 'santri lembaga lain tidak bisa masuk room');
  perform t.ok((select count(*) from game_rooms) = 0, 'room lembaga lain tidak terlihat');
  execute 'reset role';
end $$;

reset role;
set client_min_messages = warning;
drop schema t cascade;
\echo 'SEMUA UJI KEAMANAN LOLOS'
