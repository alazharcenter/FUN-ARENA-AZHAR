# Fun Arena Azhar Center

Belajar, Bermain, Berkompetisi, dan Menguasai Bahasa Arab!

Status: **Tahap 8 — Testing & Deploy** siap. Panduan online: [`docs/02-DEPLOY.md`](docs/02-DEPLOY.md). Rencana lengkap: [`docs/01-PERENCANAAN.md`](docs/01-PERENCANAAN.md).

## Menjalankan di komputer Anda

1. Pasang **Node.js 20+** dari https://nodejs.org (versi LTS).
2. Di folder `fun-arena`, pasang dependensi (sekali saja):
   ```bash
   npm install
   ```
3. Pastikan file `.env.local` ada (berisi alamat & kunci publik Supabase). Jika belum, salin `.env.example` menjadi `.env.local` lalu isi dari dashboard Supabase.
4. Jalankan:
   ```bash
   npm run dev
   ```
5. Buka http://localhost:3000

## Pengujian otomatis

```bash
npm test
```
Uji unit logika frontend: aturan papan ular tangga, level/XP (harus sama dengan server), dan pembaca CSV.

```bash
PGPASSWORD=sandi-postgres npm run test:db
```
Membuat database PostgreSQL lokal baru, menjalankan semua migrasi dan seed, lalu menjalankan:
- `supabase/tests/10_security_test.sql`: 48 pemeriksaan keamanan. Mencakup anon, kunci jawaban, validasi jawaban di server, kenaikan peran, pemisahan antarlembaga, batas wewenang admin, dan room.
- `supabase/tests/20_game_test.sql`: 18 pemeriksaan alur permainan, yaitu skor, XP, badge, misi, batas XP harian, riwayat, dan progres.

Database Supabase produksi sudah dicek identik dengan database uji (semua fungsi dan 34 policy RLS).

## Yang bisa diuji


### Tahap 7 — Gamifikasi & Progres
1. **Badge**: main 1 Quick Play → halaman hasil menampilkan *Badge baru!* (mis. Langkah Pertama). Semua badge (16) ada di **Profil**; yang belum didapat tampil pudar beserta syaratnya.
2. **Misi** (`/app/tantangan`): 2 misi harian (reset 00.00 WIB) + 3 misi mingguan (reset Senin). Selesaikan → tombol **Klaim** aktif → XP bertambah. Klaim dua kali ditolak server. Tantangan dari guru juga ada di halaman ini.
3. **Batas XP harian**: setelah 600 XP dalam sehari, XP permainan berikutnya dihitung setengah (ada keterangan di halaman hasil).
4. **Progres** (`/app/progres`): akurasi per kemampuan & per materi, minggu ini vs minggu lalu, grafik 14 hari (arahkan kursor/ketuk batang), kosakata dikuasai & masih sulit.
5. **Riwayat** (`/app/riwayat`): semua permainan, filter arena, 15 per halaman.
6. **Avatar** (Profil): pilih avatar bawaan atau unggah foto (PNG/JPG/WEBP, maks. 2 MB).
7. **Pengaturan** (`/pengaturan`): ganti kata sandi, **Kurangi animasi** (disimpan di perangkat).
8. Tidak ada lagi data demo di aplikasi.

### Tahap 6 — Guru & Admin (butuh akun berperan guru/admin, lihat "Menjadikan akun sebagai guru/admin")
1. **Kelas** (`/guru/kelas`): buat kelas → bagikan kode 6 karakter. Santri: menu **Kelas Saya** → Gabung Kelas.
2. **Bank Soal** (`/guru/bank-soal`): tambah/ubah soal dengan pratinjau santri, unggah gambar/audio, tandai kata dengan `[[...]]`.
   - **Impor CSV**: unduh templat → isi → unggah. Semua baris diperiksa server; satu baris salah = tidak ada yang masuk, nomor barisnya ditampilkan.
   - **Paket soal**: centang soal → Paket soal → simpan (bisa untuk kelas tertentu).
   - Soal bawaan hanya bisa dilihat; soal yang sudah dimainkan diarsipkan, bukan dihapus.
   - Urutkan "Paling sering salah" untuk menemukan soal yang perlu dibahas.
3. **Tantangan** (`/guru/tantangan`): untuk satu kelas atau semua santri, dari materi atau paket, dengan bonus XP & tanggal. Muncul di dashboard santri; selesai otomatis saat semua soalnya dijawab.
4. **Detail kelas**: statistik tiap santri (klik untuk progres per materi), **materi perlu diulang**, peringkat kelas, progres tantangan, **ekspor CSV**.
5. **Admin** (`/admin`): statistik lembaga/platform, ubah peran pengguna; super admin: tambah lembaga & materi.

### Tahap 5 — Multiplayer (uji dengan 2 browser/perangkat & 2 akun)
1. Akun A: **Main Bareng** → pilih **Quiz Battle** atau **Ular Tangga** → atur → **Buat Room** → muncul kode 6 karakter.
2. Akun B: **Main Bareng** → masukkan kode (atau buka tautan undangan) → **Saya Siap**.
3. Akun A: **Mulai Permainan**.
   - Quiz Battle: semua menjawab soal yang sama; jawaban benar & penjelasan dibuka bersamaan setelah semua menjawab / waktu habis; papan skor langsung.
   - Ular Tangga online: dadu diacak server, hanya pemain yang giliran yang bisa melempar & menjawab, pemain lain ikut melihat soal.
4. Tutup/refresh salah satu browser di tengah permainan → buka lagi room yang sama → bergabung kembali otomatis. Pemain yang terputus tidak ditunggu.
5. **Mode Kelas**: centang "saya hanya memandu" agar guru menjadi host tanpa ikut menjawab.
6. **Leaderboard**: harian, mingguan, keseluruhan (per lembaga). Dashboard menampilkan 5 besar minggu ini.
7. Lencana di kiri atas room: **Live** = realtime tersambung; **Sinkron** = memakai cadangan sinkron berkala (permainan tetap berjalan).

### Tahap 4 — Arabic Snake & Ladder (سُلَّمُ الْعَرَبِيَّةِ)
1. Buka **Arabic Snake & Ladder** → atur mode (Casual / Mixed / Qowaid), pemain (1–6, bergiliran di satu perangkat), tingkat, jumlah petak (50/100), durasi menjawab, dan aturan.
2. Lempar dadu → bidak berjalan petak demi petak.
3. Petak tantangan (م ت ح ق ن ص) membuka soal sesuai jenisnya; soal diambil & dinilai server.
4. Tangga ▲ naik otomatis · Kepala ular ▼ soal penyelamat · Bonus ★ lempar lagi · Khusus ! soal sulit (benar maju 5, salah mundur 3) · Salah di petak biasa → tertahan 1 giliran (bisa dimatikan).
5. Pemain pertama di petak terakhir menang → podium, ulasan jawaban.
6. Refresh di tengah permainan → posisi, giliran, dan soal yang sedang tampil tetap sama.
7. Main sendiri mendapat XP; main bergiliran hanya mencatat skor (jawaban bukan milik satu akun).

### Tahap 3 — Qowaid Arena
1. Buka **Qowaid Arena** → kartu jenis permainan yang sudah punya soal bisa diklik (mis. **I'rab Challenge**, **Tashrif Battle**).
2. Quick Play menampilkan filter *Jenis: …*; materi yang tidak punya soal untuk jenis itu dinonaktifkan.
3. Pada soal I'rab, kata yang ditanyakan **disorot** di dalam kalimat.
4. Setiap jawaban disertai penjelasan kaidah; tombol *Main lagi* mengulang jenis permainan yang sama.

### Tahap 2 — Mufrodat & Muhadatsah
1. **Daftar** akun di `/daftar` → buka email konfirmasi → klik tautannya.
2. **Masuk** → Dashboard menampilkan XP, level, akurasi, streak, riwayat **asli** dari database.
3. **Quick Play** → pilih arena, tingkat, materi, jumlah soal → main.
   - Timer dari server; jawaban dinilai server (benar = 100 + bonus cepat maks. 50).
   - Penjelasan muncul setelah menjawab. Coba juga biarkan waktu habis.
   - Refresh halaman di tengah permainan → soal yang sama berlanjut dengan sisa waktunya.
4. **Hasil** → skor, akurasi, XP, ulasan setiap jawaban.
5. **Profil** → ubah nickname.

Bagian berlabel **Data Demo** (tantangan, badge, peringkat kelas) belum tersambung ke database — dibangun di Tahap 5 & 7.

## Database (Supabase)

| File | Isi |
|---|---|
| `supabase/migrations/0001_initial_schema.sql` | Tabel, Row Level Security, trigger profil |
| `supabase/migrations/0002_quick_play.sql` | Fungsi server: mulai sesi, kirim soal, nilai jawaban, simpan skor/XP |
| `supabase/migrations/0003_private_helpers.sql` | Fungsi bantu keamanan dipindah ke skema tertutup |
| `supabase/migrations/0004_qowaid.sql` | `seed_key` (seed bisa diulang), filter jenis permainan |
| `supabase/migrations/0005_snake_ladder.sql` | Sesi & soal per petak ular tangga, penyelesaian sesi bersama |
| `supabase/migrations/0006_multiplayer.sql` | Room, lobby, Quiz Battle, ular tangga online, leaderboard, realtime |
| `supabase/migrations/0007_search_path.sql` | Pengamanan fungsi bantu (saran security advisor) |
| `supabase/migrations/0008_teacher_admin.sql` | Kelas, bank soal, impor CSV, paket, tantangan, statistik, admin |
| `supabase/migrations/0009_question_media.sql` | Storage gambar/audio soal (khusus Supabase) |
| `supabase/migrations/0010_search_path.sql` | Pengamanan fungsi bantu Tahap 6 |
| `supabase/migrations/0011_gamification.sql` | Badge/achievement, misi harian & mingguan, batas XP harian, riwayat, progres |
| `supabase/migrations/0012_avatars.sql` | Storage foto profil (khusus Supabase) |
| `supabase/migrations/0013_performance.sql` | Optimasi RLS & indeks (Supabase Advisor) |
| `supabase/tests/` | Uji keamanan & permainan (`npm run test:db`) |
| `supabase/seed/data.mjs` | Kategori + **51 soal Mufrodat & Muhadatsah** |
| `supabase/seed/data-qowaid.mjs` | **72 soal Qowaid** (Nahwu, Shorof, I'rab) |
| `supabase/seed/data-mufrodat-2.mjs` | **117 soal Mufrodat tambahan** |
| `supabase/seed/data-qowaid-2.mjs` | **119 soal Qowaid tambahan** |
| `supabase/seed/data-mufrodat-3.mjs` | **84 soal Mufrodat tambahan** |
| `supabase/seed/data-qowaid-3.mjs` | **57 soal Qowaid tambahan** — total bank soal bawaan: **500** |
| `supabase/seed/seed.sql` | Dihasilkan dengan `npm run seed:build` — aman dijalankan berulang (soal yang sudah ada dilewati) |

Semua sudah diterapkan ke proyek Supabase **FUN ARENA ACP**.

### Menambah soal lewat file seed
1. Tambahkan soal di salah satu file `supabase/seed/data*.mjs` (jawaban benar di urutan pertama; `[[kata]]` untuk menyorot kata yang ditanya).
2. Jalankan `npm run seed:build` — generator memeriksa kategori, duplikat, dan kelengkapan penjelasan.
3. Jalankan isi `supabase/seed/seed.sql` di Supabase → SQL Editor. Hanya soal baru yang ditambahkan.

### Menjadikan akun sebagai guru/admin
Pendaftaran selalu menghasilkan akun santri (agar tidak ada yang bisa mengangkat dirinya sendiri).
Setelah ada satu admin, peran bisa diubah lewat halaman **Admin**. Untuk admin pertama, jalankan di Supabase → SQL Editor:
```sql
update profiles set role = 'super_admin'
where id = (select id from auth.users where email = 'email-anda@contoh.com');
```

## Struktur
```
docs/                    perencanaan, arsitektur, roadmap
supabase/                migrasi database & bank soal awal
scripts/build-seed.mjs   generator seed.sql
src/lib/                 supabase, auth, api (pemanggil fungsi server), arenas, level, snake (aturan papan)
src/components/          QuestionPlayer (soal + timer + umpan balik), SnakeBoard, Dice, ...
src/pages/               satu file per halaman (GamePage = layar bermain)
```
