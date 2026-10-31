# Panduan Deploy (Tahap 8)

Aplikasi ini adalah situs statis (React + Vite). Semua data dan logika penilaian ada di Supabase, jadi deploy cukup dilakukan di Vercel (gratis, paket Hobby).

## 1. Simpan kode ke GitHub

1. Buat repo baru di <https://github.com/new>, misalnya `fun-arena-azhar-center` (boleh **Private**).
2. Dari folder proyek, jalankan:

```bash
git remote add origin https://github.com/NAMA-ANDA/fun-arena-azhar-center.git
```

```bash
git push -u origin main
```

> File `.env.local` **tidak** ikut terunggah (sudah ada di `.gitignore`). Kunci yang dipakai aplikasi adalah *publishable key*, yang memang aman berada di browser. Keamanan data dijaga oleh RLS dan fungsi server di Supabase.

## 2. Import ke Vercel

1. Buka <https://vercel.com/new>, lalu pilih repo tadi dan klik **Import**.
2. *Framework Preset*: **Vite** (otomatis terbaca dari `vercel.json`).
3. Buka **Environment Variables** dan isi dua variabel berikut:

| Nama | Nilai |
|---|---|
| `VITE_SUPABASE_URL` | `https://rraahwdbommiycalvhjl.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | isi dari `.env.local` (diawali `sb_publishable_`) |

4. Klik **Deploy**. Setelah ±1 menit, Anda mendapat alamat seperti `https://fun-arena-azhar-center.vercel.app`.

Setiap `git push` berikutnya ke branch `main` otomatis memicu deploy ulang.

## 3. Hubungkan alamat Vercel di Supabase (wajib)

Tanpa langkah ini, tautan konfirmasi email akan kembali ke `localhost`.

1. Buka Supabase Dashboard, lalu **Authentication → URL Configuration**.
2. Isi **Site URL** dengan alamat Vercel Anda, misalnya `https://fun-arena-azhar-center.vercel.app`.
3. Di **Redirect URLs**, tambahkan:
   - `https://fun-arena-azhar-center.vercel.app/**`
   - `http://localhost:3000/**` (untuk pengembangan di komputer sendiri)
4. Klik **Save**.

Disarankan pula membuka **Authentication → Sign In / Providers → Email** dan memastikan **Confirm email** aktif.

## 4. Jadikan akun Anda super admin

Daftar lewat halaman `/daftar` di alamat Vercel, konfirmasi email, lalu jalankan perintah berikut di Supabase **SQL Editor**:

```sql
update profiles set role = 'super_admin'
where id = (select id from auth.users where email = 'EMAIL-ANDA@gmail.com');
```

Muat ulang aplikasi. Menu **Guru** dan **Admin** akan muncul.

## 5. Daftar periksa setelah deploy

- [ ] Halaman depan terbuka. Muat ulang di `/app/progres` tidak menampilkan 404 (diatur oleh `rewrites` di `vercel.json`).
- [ ] Daftar akun baru → email konfirmasi → kembali ke aplikasi dalam keadaan login.
- [ ] Mainkan 1 Quick Play, lalu periksa skor, XP, dan badge "Langkah Pertama".
- [ ] Buka room Quiz Battle di 2 perangkat. Status "Realtime" terlihat dan soal berganti bersamaan.
- [ ] Unggah foto avatar di Profil dan gambar soal di Bank Soal (Storage).
- [ ] Ganti kata sandi di Pengaturan.
- [ ] Buka di HP: navigasi bawah tampil dan tidak ada geser horizontal.

## Catatan keamanan yang sudah diterapkan

- Header keamanan dipasang di `vercel.json`: CSP, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, dan `Permissions-Policy`. Koneksi hanya diizinkan ke Supabase.
- Supabase Security Advisor tidak menemukan masalah terbuka. Peringatan *"SECURITY DEFINER dapat dijalankan pengguna login"* memang disengaja: setiap fungsi memeriksa login, peran, dan lembaga di dalamnya, dan hal ini dibuktikan oleh `supabase/tests/10_security_test.sql`.
- Pengguna tanpa login (`anon`) tidak bisa menjalankan fungsi apa pun.
