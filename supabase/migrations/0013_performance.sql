-- =====================================================================
-- Tahap 8: optimasi performa (hasil Supabase Advisor) — tanpa mengubah hak akses
-- 1. auth.uid()/fungsi bantu di policy dibungkus (select ...) agar dihitung sekali per query, bukan per baris
-- 2. Policy "kelola" (FOR ALL) dipecah menjadi insert/update/delete agar SELECT tidak dievaluasi dua kali
--    (hak baca tetap: policy kelola selalu bagian dari policy baca yang sudah ada)
-- 3. Indeks untuk semua foreign key yang belum punya indeks
-- =====================================================================

-- ---------- 1. Policy baca ----------
drop policy "baca achievement" on achievements;
create policy "baca achievement" on achievements for select using ((select auth.uid()) is not null);

drop policy "baca kategori" on categories;
create policy "baca kategori" on categories for select using ((select auth.uid()) is not null);

drop policy "lihat percobaan sendiri" on challenge_attempts;
create policy "lihat percobaan sendiri" on challenge_attempts for select using (user_id = (select auth.uid()));

drop policy "lihat klaim sendiri" on mission_claims;
create policy "lihat klaim sendiri" on mission_claims for select using (user_id = (select auth.uid()));

drop policy "lihat anggota kelas" on class_members;
create policy "lihat anggota kelas" on class_members for select using (
  student_id = (select auth.uid())
  or exists (select 1 from classes c where c.id = class_members.class_id and c.teacher_id = (select auth.uid())));

drop policy "lihat sesi sendiri" on game_sessions;
create policy "lihat sesi sendiri" on game_sessions for select using (
  user_id = (select auth.uid()) or (room_id is not null and private.is_room_member(room_id)));

drop policy "lihat achievement pemain" on player_achievements;
create policy "lihat achievement pemain" on player_achievements for select using (
  user_id = (select auth.uid())
  or exists (select 1 from profiles p where p.id = player_achievements.user_id and p.institution_id = (select private.my_institution())));

drop policy "lihat jawaban" on player_answers;
create policy "lihat jawaban" on player_answers for select using (
  user_id = (select auth.uid())
  or ((select private.is_staff()) and exists (select 1 from profiles p where p.id = player_answers.user_id and p.institution_id = (select private.my_institution()))));

drop policy "lihat progres" on player_progress;
create policy "lihat progres" on player_progress for select using (
  user_id = (select auth.uid())
  or ((select private.is_staff()) and exists (select 1 from profiles p where p.id = player_progress.user_id and p.institution_id = (select private.my_institution()))));

drop policy "lihat statistik" on player_stats;
create policy "lihat statistik" on player_stats for select using (
  user_id = (select auth.uid())
  or exists (select 1 from parent_links pl where pl.parent_id = (select auth.uid()) and pl.student_id = player_stats.user_id)
  or ((select private.is_staff()) and exists (select 1 from profiles p where p.id = player_stats.user_id and p.institution_id = (select private.my_institution()))));

drop policy "lihat profil selembaga" on profiles;
create policy "lihat profil selembaga" on profiles for select using (
  id = (select auth.uid()) or institution_id = (select private.my_institution()) or (select private.my_role()) = 'super_admin');

drop policy "ubah profil sendiri" on profiles;
create policy "ubah profil sendiri" on profiles for update
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()) and role = (select private.my_role())
              and not (institution_id is distinct from (select private.my_institution())));

drop policy "lihat skor selembaga" on scores;
create policy "lihat skor selembaga" on scores for select using (
  user_id = (select auth.uid()) or institution_id = (select private.my_institution()));

-- ---------- 2. Policy kelola: pecah FOR ALL → insert / update / delete ----------
drop policy "kelola soal" on questions;
create policy "kelola soal: tambah" on questions for insert
  with check ((select private.is_staff()) and institution_id = (select private.my_institution()));
create policy "kelola soal: ubah" on questions for update
  using ((select private.is_staff()) and institution_id = (select private.my_institution()))
  with check ((select private.is_staff()) and institution_id = (select private.my_institution()));
create policy "kelola soal: hapus" on questions for delete
  using ((select private.is_staff()) and institution_id = (select private.my_institution()));

drop policy "kelola opsi" on answer_options;
create policy "kelola opsi: tambah" on answer_options for insert with check (
  (select private.is_staff()) and exists (select 1 from questions q where q.id = answer_options.question_id and q.institution_id = (select private.my_institution())));
create policy "kelola opsi: ubah" on answer_options for update using (
  (select private.is_staff()) and exists (select 1 from questions q where q.id = answer_options.question_id and q.institution_id = (select private.my_institution())));
create policy "kelola opsi: hapus" on answer_options for delete using (
  (select private.is_staff()) and exists (select 1 from questions q where q.id = answer_options.question_id and q.institution_id = (select private.my_institution())));

drop policy "guru kelola kelas" on classes;
create policy "guru kelola kelas: tambah" on classes for insert
  with check ((select private.is_staff()) and institution_id = (select private.my_institution()));
create policy "guru kelola kelas: ubah" on classes for update
  using ((select private.is_staff()) and institution_id = (select private.my_institution()))
  with check ((select private.is_staff()) and institution_id = (select private.my_institution()));
create policy "guru kelola kelas: hapus" on classes for delete
  using ((select private.is_staff()) and institution_id = (select private.my_institution()));

drop policy "staf kelola tantangan" on daily_challenges;
create policy "staf kelola tantangan: tambah" on daily_challenges for insert
  with check ((select private.is_staff()) and institution_id = (select private.my_institution()));
create policy "staf kelola tantangan: ubah" on daily_challenges for update
  using ((select private.is_staff()) and institution_id = (select private.my_institution()))
  with check ((select private.is_staff()) and institution_id = (select private.my_institution()));
create policy "staf kelola tantangan: hapus" on daily_challenges for delete
  using ((select private.is_staff()) and institution_id = (select private.my_institution()));

-- ---------- 3. Indeks foreign key ----------
do $$
declare r record;
begin
  for r in
    select c.conrelid::regclass as tbl, c.conname,
           string_agg(quote_ident(a.attname), ', ' order by k.n) as cols
    from pg_constraint c
    join pg_namespace ns on ns.oid = c.connamespace and ns.nspname = 'public'
    cross join lateral unnest(c.conkey) with ordinality as k(attnum, n)
    join pg_attribute a on a.attrelid = c.conrelid and a.attnum = k.attnum
    where c.contype = 'f'
      -- lewati FK yang kolom-kolomnya sudah menjadi awalan suatu indeks
      and not exists (
        select 1 from pg_index i
        where i.indrelid = c.conrelid
          and (i.indkey::int2[])[0:array_length(c.conkey, 1) - 1] @> c.conkey
          and (i.indkey::int2[])[0:array_length(c.conkey, 1) - 1] <@ c.conkey)
    group by c.conrelid, c.conname
  loop
    execute format('create index if not exists %I on %s (%s)', 'idx_' || r.conname, r.tbl, r.cols);
  end loop;
end $$;
