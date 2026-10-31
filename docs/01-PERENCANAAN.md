# FUN ARENA AZHAR CENTER — Dokumen Perencanaan

> Belajar, Bermain, Berkompetisi, dan Menguasai Bahasa Arab!

Dokumen ini adalah acuan tetap untuk seluruh tahap. Jika ada keputusan baru, perbarui dokumen ini.

---

## 1. Analisis Kebutuhan (ringkas)

| Aspek | Kebutuhan inti | Implikasi teknis |
|---|---|---|
| Pengguna | Santri (pemula–lanjut), guru, admin lembaga, super admin, orang tua (opsional) | Auth + role + RLS per lembaga |
| Inti produk | Belajar lewat **permainan**, bukan LMS | UI berbasis kartu/arena, sesi singkat, umpan balik instan |
| 3 arena | Mufrodat & Muhadatsah, Qowaid, Ular Tangga Arab | Satu "mesin soal" dipakai bersama; tiap arena = konfigurasi kategori + jenis permainan |
| Konten | Bank soal dinamis, Fusha vs Amiyah, harakat, gambar/audio | Soal di database, media di Storage, kolom `variety` |
| Multiplayer | 2–30 pemain/room, realtime, reconnect | Status game di database (sumber kebenaran) + Realtime untuk siaran |
| Keadilan | Jawaban & skor divalidasi server, kunci tidak bocor | Kunci jawaban di tabel terpisah yang tidak bisa dibaca santri; penilaian lewat fungsi database |
| Multi-lembaga | Awalnya Al-Azhar Center, nanti banyak lembaga | Kolom `institution_id` di semua data milik lembaga |
| Pemula | Pemilik proyek baru belajar coding | Stack sederhana, sedikit server buatan sendiri, tahapan kecil yang bisa diuji |

**Risiko utama & mitigasi**
1. *Soal Arab ambigu/harakat salah* → setiap soal wajib punya `explanation`, alur review (`is_published`), dan kolom pembuat.
2. *Kecurangan di multiplayer* → frontend tidak pernah menerima kunci jawaban; timer memakai `deadline_at` dari server.
3. *30 pemain realtime* → siaran lewat Supabase Realtime (Broadcast/Presence), state penting disimpan di Postgres sehingga pemain yang terputus bisa memuat ulang.

---

## 2. Arsitektur Teknis

Stack yang Anda usulkan **sudah tepat** dan saya pertahankan:

```
┌──────────────────────────────┐        ┌──────────────────────────────────┐
│  Frontend (Vercel/Netlify)   │        │            Supabase              │
│  React + TypeScript + Vite   │  HTTPS │  Auth      → login, role         │
│  Tailwind CSS                │ ─────► │  Postgres  → data + RLS          │
│  React Router                │        │  RPC (fungsi SQL) → nilai jawaban│
│  supabase-js                 │ ◄───── │  Realtime  → room, giliran, skor │
└──────────────────────────────┘   WS   │  Storage   → gambar & audio soal │
                                        │  Edge Functions (bila perlu)     │
                                        └──────────────────────────────────┘
```

Keputusan penting:
- **Vite** (bukan Next.js): lebih sederhana untuk pemula, tidak perlu server sendiri; semua logika sensitif ada di Supabase.
- **Logika sensitif di Postgres (fungsi RPC `security definer`)**: `start_quick_play`, `submit_answer`, `roll_dice`, dll. Fungsi ini yang membaca kunci jawaban, menghitung poin, dan memeriksa batas waktu. Frontend hanya menerima `is_correct`, poin, dan penjelasan **setelah** menjawab.
- **Realtime**: Postgres tetap sumber kebenaran; perubahan disiarkan ke pemain. Presence dipakai untuk status online/terputus.
- **Edge Functions** hanya dipakai bila logika terlalu rumit untuk SQL (mis. impor CSV besar).
- **Deployment**: frontend ke Vercel, backend di Supabase (tier gratis cukup untuk tahap awal).

Struktur proyek:
```
fun-arena/
├─ docs/                     dokumen perencanaan
├─ supabase/migrations/      skema database (SQL)
└─ src/
   ├─ components/            komponen UI yang dipakai ulang
   ├─ pages/                 satu file per halaman
   ├─ lib/                   konfigurasi (rute, arena), nanti klien Supabase
   └─ data/demo.ts           DATA DEMO (dihapus setelah backend tersambung)
```

---

## 3. Struktur Database Awal

File lengkap: [`supabase/migrations/`](../supabase/migrations/) — sudah diterapkan ke Supabase pada Tahap 2.

```
institutions ─┬─< profiles (users + role; teacher/student/parent = role)
              │      ├─ player_stats (XP, level, streak)
              │      ├─< player_progress (per kategori)
              │      ├─< player_achievements >─ achievements
              │      └─< parent_links (orang tua ↔ santri)
              ├─< classes ─< class_members >─ profiles
              ├─< questions ─< answer_options
              │      └─ answer_keys (TERSEMBUNYI dari santri)
              ├─< question_packages ─< package_questions >─ questions
              ├─< game_rooms ─< room_players
              │      └─< game_sessions ─< game_questions ─< player_answers
              │                         └─< scores ──► view leaderboard
              └─< daily_challenges ─< challenge_attempts
categories (pohon: arena → kategori → subkategori)
```

Catatan desain:
- **Users/Teachers/Students** digabung dalam `profiles` + kolom `role` (lebih sederhana, satu orang satu baris). Data khusus guru/santri cukup lewat relasi (kelas, anggota kelas).
- **answer_keys** dipisah dari `answer_options` agar RLS bisa menutup total akses santri ke kunci.
- Santri juga **tidak bisa membaca tabel `questions` langsung** (penjelasan bisa membocorkan jawaban); soal dikirim satu per satu oleh `next_question()`.
- Pendaftar selalu menjadi santri; peran guru/admin diberikan admin.
- **Leaderboards** dibuat sebagai *view* dari `scores` (harian/mingguan/total/kelas) — tidak ada data ganda.
- Soal dengan `institution_id = null` adalah soal global (bisa dipakai semua lembaga).

---

## 4. Sitemap & Navigasi

```
Publik
├─ /                     Landing Page
├─ /masuk                Login
└─ /daftar               Registrasi

Santri (/app)            — sidebar (desktop) / bottom-nav (HP)
├─ /app                  Dashboard Santri
├─ /app/arena/mufrodat   Mufrodat & Muhadatsah Arena
├─ /app/arena/qowaid     Qowaid Arena
├─ /app/arena/ular-tangga Arabic Snake & Ladder
├─ /app/quick-play       Quick Play
├─ /app/tantangan        Challenge Mode
├─ /app/lobby            Multiplayer Lobby (buat/gabung room)
├─ /app/room/:kode       Game Room
├─ /app/hasil/:id        Game Result
├─ /app/leaderboard      Leaderboard
├─ /app/progres          Statistik/Progres saya
├─ /app/riwayat          Riwayat Permainan
└─ /app/profil           Profil Pemain

Guru (/guru)
├─ /guru                 Dashboard Guru
├─ /guru/kelas           Manajemen Kelas
├─ /guru/bank-soal       Bank Soal
├─ /guru/tantangan       Manajemen Tantangan
└─ /guru/statistik       Statistik Santri

Admin
├─ /admin                Dashboard Admin
└─ /pengaturan           Pengaturan Aplikasi
```

Navigasi utama santri: **Beranda · Arena · Main Bareng · Peringkat · Profil**.

**Arsitektur multiplayer (Tahap 5):** status room di Postgres (`game_rooms.state`), setiap perubahan menaikkan `version` → Supabase Realtime memberi sinyal → klien memanggil `room_state()`; polling 4 detik sebagai cadangan; heartbeat 10 detik (terputus jika > 25 detik). `room_advance()` boleh dipanggil siapa pun dan hanya maju bila syarat terpenuhi, sehingga permainan tidak bergantung pada host.

---

## 5. Desain UI/UX

**Identitas**: biru tua `#173B57` (primer, kesan ilmu & Al-Azhar), latar `#F5F7FA`, kartu putih, teks `#172B3A`, sekunder `#64748B`.
Aksen per arena agar mudah dikenali:

| Arena | Aksen | Ikon |
|---|---|---|
| Mufrodat & Muhadatsah | Teal `#0F9D8A` | gelembung percakapan |
| Qowaid | Ungu `#6D4AD8` | blok/struktur |
| Ular Tangga | Oranye `#E8712B` | dadu |
| XP / hadiah | Emas `#E3A82B` | bintang |

**Tipografi**: Inter (Indonesia), Noto Naskh Arabic (Arab — mendukung harakat dengan baik), selalu `dir="rtl"` dan ukuran lebih besar untuk teks Arab.

**Prinsip**: kartu besar mudah disentuh (min. 44px), satu aksi utama per layar, umpan balik warna (hijau benar / merah salah) + penjelasan, animasi ringan (hover-lift, progress bar), tidak kekanak-kanakan.

**Rancangan halaman utama**

| Halaman | Isi & tata letak |
|---|---|
| Landing | Hero (nama, tagline, CTA "Mulai Bermain" & "Masuk"), 3 kartu arena, cara kerja 3 langkah, fitur guru, footer |
| Login/Daftar | Kartu tengah, email + kata sandi, pilihan peran saat daftar, kode kelas opsional |
| Dashboard Santri | Sapaan + level/XP bar; 4 stat (XP, permainan, akurasi, streak); tombol aksi utama; 3 kartu arena; tantangan aktif; badge; riwayat & peringkat |
| Halaman Arena | Header berwarna arena, daftar jenis permainan (kartu), kategori materi, pilihan tingkat kesulitan, tombol Quick Play / Main Bareng |
| Quick Play / Game | Progress soal di atas, timer melingkar, soal besar (RTL), 4 pilihan berupa tombol besar, penjelasan setelah menjawab |
| Ular Tangga | Papan 10×10 (bisa diatur), dadu besar di bawah (HP) / samping (desktop), daftar pemain & giliran, modal soal saat mendarat di petak tantangan |
| Lobby / Room | Kode room besar untuk dibagikan, daftar pemain + status siap, panel pengaturan (khusus host), tombol Mulai |
| Hasil | Podium 3 besar, skor & akurasi, XP diperoleh, ulasan jawaban salah + penjelasan |
| Leaderboard | Tab harian/mingguan/total/kelas, daftar ranking dengan posisi saya disorot |
| Dashboard Guru | Ringkasan kelas, tombol buat room/tantangan, materi paling sering salah, aktivitas terbaru |
| Bank Soal | Tabel + filter (arena, kategori, tingkat, ragam), form soal dengan pratinjau RTL, impor CSV |

---

## 6. MVP yang Realistis

MVP = **santri bisa login, bermain Quick Play di Arena Mufrodat & Qowaid dengan soal dari database, nilai dihitung server, dan guru bisa menambah soal.**
Ular tangga solo/lokal (satu perangkat, beberapa pemain bergantian) masuk MVP karena fitur unggulan dan tidak butuh realtime.
Multiplayer online, dashboard guru lengkap, dan gamifikasi lanjutan menyusul setelah MVP stabil.

---

## 7. Roadmap

| Tahap | Isi | Hasil yang bisa diuji |
|---|---|---|
| 1 — Prototype ✅ | Landing, dashboard santri, navigasi 3 arena, sistem desain, data demo berlabel | `npm run dev`, klik semua menu |
| 2 — Mufrodat & Muhadatsah ✅ | Setup Supabase, Auth, tabel + RLS, bank soal awal (seed), Quick Play, timer, skor via `submit_answer`, halaman hasil | Daftar akun, main 10 soal, skor tersimpan |
| 3 — Qowaid Arena ✅ | Kategori Nahwu/Shorof/I'rab, I'rab Challenge, Tashrif Battle, penjelasan kaidah | Main soal qowaid 3 tingkat |
| 4 — Ular Tangga ✅ | Papan, dadu, bidak, petak tantangan, ular/tangga, kemenangan (lokal dulu) | 2–4 pemain di satu perangkat sampai finish |
| 5 — Multiplayer ✅ | Room, kode undangan, lobby, sinkronisasi soal/timer/giliran/skor, reconnect | Uji dengan 2 browser |
| 6 — Guru & Admin ✅ | Dashboard guru, kelas, bank soal CRUD + CSV, tantangan kelas, statistik santri | Guru buat soal → santri memainkannya |
| 7 — Gamifikasi ✅ | XP, level, badge, achievement, streak, misi, analitik | Badge muncul setelah syarat terpenuhi |
| **8 — Testing & Deploy** ✅ | Uji fungsi, keamanan RLS, multiplayer, responsif, deploy Vercel | URL publik |
