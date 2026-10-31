-- =====================================================================
-- Tahap 6: media soal (gambar & audio) di Supabase Storage
-- Bucket publik untuk dibaca (gambar tampil saat bermain); unggah/hapus hanya guru/admin,
-- dan hanya ke folder lembaganya sendiri: <institution_id>/<nama-file>
-- (Khusus Supabase — tidak dijalankan pada database uji lokal karena memerlukan skema storage.)
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('question-media', 'question-media', true, 5242880,
        array['image/png', 'image/jpeg', 'image/webp', 'image/gif',
              'audio/mpeg', 'audio/mp4', 'audio/ogg', 'audio/wav', 'audio/webm'])
on conflict (id) do nothing;

create policy "staf unggah media soal" on storage.objects for insert to authenticated
  with check (bucket_id = 'question-media' and private.is_staff()
              and (storage.foldername(name))[1] = private.my_institution()::text);

create policy "staf ubah media soal" on storage.objects for update to authenticated
  using (bucket_id = 'question-media' and private.is_staff()
         and (storage.foldername(name))[1] = private.my_institution()::text);

create policy "staf hapus media soal" on storage.objects for delete to authenticated
  using (bucket_id = 'question-media' and private.is_staff()
         and (storage.foldername(name))[1] = private.my_institution()::text);
