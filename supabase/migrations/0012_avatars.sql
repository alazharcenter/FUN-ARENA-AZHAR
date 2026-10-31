-- =====================================================================
-- Tahap 7: foto profil (avatar) di Supabase Storage
-- Bucket publik untuk dibaca; setiap pengguna hanya boleh menulis ke foldernya sendiri: <user_id>/...
-- (Khusus Supabase — tidak dijalankan pada database uji lokal.)
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;

create policy "unggah avatar sendiri" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "ubah avatar sendiri" on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "hapus avatar sendiri" on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
