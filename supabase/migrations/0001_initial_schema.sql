-- =====================================================================
-- FUN ARENA AZHAR CENTER — Skema database awal (Supabase / PostgreSQL)
-- Status : diterapkan di Supabase pada Tahap 2.
-- Prinsip:
--   * Data setiap lembaga dipisah lewat institution_id + Row Level Security.
--   * Kunci jawaban (answer_keys) TIDAK PERNAH bisa dibaca santri.
--   * Penilaian jawaban & skor hanya lewat fungsi server (submit_answer).
-- =====================================================================

-- ---------- Tipe enum ----------
create type app_role       as enum ('super_admin', 'institution_admin', 'teacher', 'student', 'parent');
create type arena_type     as enum ('mufrodat', 'qowaid', 'snake_ladder');
create type difficulty     as enum ('beginner', 'intermediate', 'advanced');
create type arabic_variety as enum ('fusha', 'amiyah_mesir');
create type game_type      as enum (
  -- Mufrodat & Muhadatsah
  'vocabulary_challenge', 'arabic_translation', 'complete_expression', 'sentence_builder',
  'picture_vocabulary', 'daily_conversation', 'listening_challenge', 'true_false',
  'context_challenge', 'amiyah_challenge',
  -- Qowaid
  'irab_challenge', 'nahwu_battle', 'tashrif_battle', 'grammar_detective', 'complete_rule',
  'sentence_analysis', 'fiil_challenge', 'identify_word', 'grammar_duel'
);
create type room_status    as enum ('lobby', 'playing', 'finished', 'cancelled');
create type session_status as enum ('active', 'finished', 'abandoned');
create type challenge_kind as enum ('daily', 'weekly', 'category', 'teacher', 'class_mission');

-- ---------- Lembaga & pengguna ----------
create table institutions (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       text not null unique,
  created_at timestamptz not null default now()
);

-- Satu baris per akun auth. Guru/santri/orang tua dibedakan oleh kolom role.
create table profiles (
  id             uuid primary key references auth.users (id) on delete cascade,
  institution_id uuid references institutions (id) on delete set null,
  role           app_role not null default 'student',
  full_name      text not null default '',
  nickname       text not null default '',
  avatar_url     text,
  created_at     timestamptz not null default now()
);

create table parent_links (
  parent_id  uuid references profiles (id) on delete cascade,
  student_id uuid references profiles (id) on delete cascade,
  primary key (parent_id, student_id)
);

create table player_stats (
  user_id        uuid primary key references profiles (id) on delete cascade,
  xp             integer not null default 0,
  level          integer not null default 1,
  total_games    integer not null default 0,
  total_answered integer not null default 0,
  total_correct  integer not null default 0,
  current_streak integer not null default 0,
  longest_streak integer not null default 0,
  last_played_on date
);

-- ---------- Kelas ----------
create table classes (
  id             uuid primary key default gen_random_uuid(),
  institution_id uuid not null references institutions (id) on delete cascade,
  teacher_id     uuid not null references profiles (id) on delete restrict,
  name           text not null,
  level          difficulty not null default 'beginner',
  join_code      text not null unique,
  created_at     timestamptz not null default now()
);

create table class_members (
  class_id   uuid references classes (id) on delete cascade,
  student_id uuid references profiles (id) on delete cascade,
  joined_at  timestamptz not null default now(),
  primary key (class_id, student_id)
);

-- ---------- Kategori & bank soal ----------
create table categories (
  id         uuid primary key default gen_random_uuid(),
  arena      arena_type not null,
  parent_id  uuid references categories (id) on delete cascade,  -- null = kategori utama
  slug       text not null unique,
  name       text not null,          -- nama Indonesia
  name_ar    text,                   -- nama Arab (berharakat bila perlu)
  sort_order integer not null default 0
);

create table questions (
  id              uuid primary key default gen_random_uuid(),
  institution_id  uuid references institutions (id) on delete cascade, -- null = soal global
  category_id     uuid not null references categories (id) on delete restrict,
  game_type       game_type not null,
  difficulty      difficulty not null,
  variety         arabic_variety not null default 'fusha',
  prompt          text not null,     -- instruksi/pertanyaan (Indonesia)
  prompt_ar       text,              -- teks Arab berharakat
  explanation     text not null,     -- penjelasan kaidah/arti, wajib
  image_url       text,
  audio_url       text,
  time_limit_sec  integer not null default 20 check (time_limit_sec between 5 and 300),
  is_published    boolean not null default false,
  created_by      uuid references profiles (id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index on questions (category_id, difficulty) where is_published;

create table answer_options (
  id          uuid primary key default gen_random_uuid(),
  question_id uuid not null references questions (id) on delete cascade,
  label       text not null,         -- teks pilihan (Arab atau Indonesia)
  is_arabic   boolean not null default false,
  position    smallint not null
);

-- Kunci jawaban: terpisah agar bisa dikunci total dari santri.
-- correct_option_id untuk pilihan ganda; accepted_texts untuk jawaban isian/susun kalimat.
create table answer_keys (
  question_id       uuid primary key references questions (id) on delete cascade,
  correct_option_id uuid references answer_options (id) on delete cascade,
  accepted_texts    text[] not null default '{}',
  check (correct_option_id is not null or cardinality(accepted_texts) > 0)
);

create table question_packages (
  id             uuid primary key default gen_random_uuid(),
  institution_id uuid references institutions (id) on delete cascade,
  owner_id       uuid references profiles (id) on delete set null,
  class_id       uuid references classes (id) on delete set null,
  name           text not null,
  description    text,
  created_at     timestamptz not null default now()
);

create table package_questions (
  package_id  uuid references question_packages (id) on delete cascade,
  question_id uuid references questions (id) on delete cascade,
  position    integer not null default 0,
  primary key (package_id, question_id)
);

-- ---------- Room & sesi permainan ----------
create table game_rooms (
  id             uuid primary key default gen_random_uuid(),
  code           text not null unique,            -- kode undangan, mis. "AZH-4821"
  institution_id uuid references institutions (id) on delete cascade,
  host_id        uuid not null references profiles (id) on delete cascade,
  arena          arena_type not null,
  status         room_status not null default 'lobby',
  max_players    integer not null default 30 check (max_players between 2 and 30),
  settings       jsonb not null default '{}',     -- mode, kategori, tingkat, durasi, jumlah petak, aturan bonus
  package_id     uuid references question_packages (id) on delete set null,
  current_turn   uuid references profiles (id),   -- untuk ular tangga
  created_at     timestamptz not null default now()
);

create table room_players (
  room_id      uuid references game_rooms (id) on delete cascade,
  user_id      uuid references profiles (id) on delete cascade,
  turn_order   smallint,
  piece_color  text,
  board_pos    integer not null default 0,       -- posisi bidak ular tangga
  skip_turns   smallint not null default 0,      -- konsekuensi jawaban salah
  score        integer not null default 0,
  is_ready     boolean not null default false,
  is_connected boolean not null default true,
  last_seen_at timestamptz not null default now(),
  joined_at    timestamptz not null default now(),
  primary key (room_id, user_id)
);

-- Sesi = satu kali permainan. Quick Play: room_id null, user_id terisi.
create table game_sessions (
  id         uuid primary key default gen_random_uuid(),
  room_id    uuid references game_rooms (id) on delete cascade,
  user_id    uuid references profiles (id) on delete cascade,
  arena      arena_type not null,
  settings   jsonb not null default '{}',
  status     session_status not null default 'active',
  started_at timestamptz not null default now(),
  ended_at   timestamptz,
  check (room_id is not null or user_id is not null)
);

-- Soal yang dikirim ke sesi, dengan tenggat dari server (timer adil).
create table game_questions (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references game_sessions (id) on delete cascade,
  question_id uuid not null references questions (id) on delete restrict,
  order_index integer not null,
  served_at   timestamptz,
  deadline_at timestamptz,
  unique (session_id, order_index)
);

create table player_answers (
  id               uuid primary key default gen_random_uuid(),
  game_question_id uuid not null references game_questions (id) on delete cascade,
  user_id          uuid not null references profiles (id) on delete cascade,
  option_id        uuid references answer_options (id),
  text_answer      text,
  is_correct       boolean not null,
  time_ms          integer not null,
  points           integer not null default 0,
  answered_at      timestamptz not null default now(),
  unique (game_question_id, user_id)            -- satu jawaban per soal per pemain
);

create table scores (
  session_id     uuid references game_sessions (id) on delete cascade,
  user_id        uuid references profiles (id) on delete cascade,
  institution_id uuid references institutions (id) on delete cascade,
  score          integer not null default 0,
  correct_count  integer not null default 0,
  answered_count integer not null default 0,
  xp_earned      integer not null default 0,
  final_rank     integer,
  created_at     timestamptz not null default now(),
  primary key (session_id, user_id)
);

-- ---------- Gamifikasi & progres ----------
create table achievements (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,
  name        text not null,
  description text not null,
  icon        text not null,
  criteria    jsonb not null default '{}'
);

create table player_achievements (
  user_id        uuid references profiles (id) on delete cascade,
  achievement_id uuid references achievements (id) on delete cascade,
  earned_at      timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

-- Penguasaan per kategori: dasar analitik "materi yang masih sulit".
create table player_progress (
  user_id     uuid references profiles (id) on delete cascade,
  category_id uuid references categories (id) on delete cascade,
  answered    integer not null default 0,
  correct     integer not null default 0,
  updated_at  timestamptz not null default now(),
  primary key (user_id, category_id)
);

create table daily_challenges (
  id             uuid primary key default gen_random_uuid(),
  institution_id uuid references institutions (id) on delete cascade,
  class_id       uuid references classes (id) on delete cascade,
  kind           challenge_kind not null,
  title          text not null,
  description    text,
  arena          arena_type,
  category_id    uuid references categories (id) on delete set null,
  difficulty     difficulty,
  package_id     uuid references question_packages (id) on delete set null,
  target_count   integer not null default 10,
  xp_reward      integer not null default 50,
  starts_on      date not null,
  ends_on        date not null,
  created_by     uuid references profiles (id) on delete set null,
  check (ends_on >= starts_on)
);

create table challenge_attempts (
  challenge_id uuid references daily_challenges (id) on delete cascade,
  user_id      uuid references profiles (id) on delete cascade,
  session_id   uuid references game_sessions (id) on delete set null,
  completed_at timestamptz,
  primary key (challenge_id, user_id)
);

-- ---------- Leaderboard (view, tanpa data ganda) ----------
create view leaderboard_weekly with (security_invoker = true) as
select s.institution_id, s.user_id, p.nickname, p.avatar_url,
       sum(s.score) as total_score, sum(s.correct_count) as total_correct
from scores s join profiles p on p.id = s.user_id
where s.created_at >= date_trunc('week', now())
group by s.institution_id, s.user_id, p.nickname, p.avatar_url;

-- =====================================================================
-- Fungsi bantu untuk RLS
-- =====================================================================
create function my_role() returns app_role
language sql stable security definer set search_path = public as
$$ select role from profiles where id = auth.uid() $$;

create function my_institution() returns uuid
language sql stable security definer set search_path = public as
$$ select institution_id from profiles where id = auth.uid() $$;

create function is_staff() returns boolean
language sql stable security definer set search_path = public as
$$ select coalesce(my_role() in ('super_admin', 'institution_admin', 'teacher'), false) $$;

-- Dipakai policy room agar tidak terjadi rekursi RLS (room_players ↔ game_rooms).
create function is_room_member(p_room_id uuid) returns boolean
language sql stable security definer set search_path = public as
$$ select exists (select 1 from room_players where room_id = p_room_id and user_id = auth.uid())
       or exists (select 1 from game_rooms where id = p_room_id and host_id = auth.uid()) $$;

-- =====================================================================
-- Row Level Security
-- =====================================================================
alter table institutions        enable row level security;
alter table profiles            enable row level security;
alter table parent_links        enable row level security;
alter table player_stats        enable row level security;
alter table classes             enable row level security;
alter table class_members       enable row level security;
alter table categories          enable row level security;
alter table questions           enable row level security;
alter table answer_options      enable row level security;
alter table answer_keys         enable row level security;
alter table question_packages   enable row level security;
alter table package_questions   enable row level security;
alter table game_rooms          enable row level security;
alter table room_players        enable row level security;
alter table game_sessions       enable row level security;
alter table game_questions      enable row level security;
alter table player_answers      enable row level security;
alter table scores              enable row level security;
alter table achievements        enable row level security;
alter table player_achievements enable row level security;
alter table player_progress     enable row level security;
alter table daily_challenges    enable row level security;
alter table challenge_attempts  enable row level security;

-- Lembaga: anggota melihat lembaganya sendiri.
create policy "lihat lembaga sendiri" on institutions for select
  using (id = my_institution() or my_role() = 'super_admin');

-- Profil: sesama lembaga boleh melihat (untuk leaderboard), ubah hanya milik sendiri.
create policy "lihat profil selembaga" on profiles for select
  using (id = auth.uid() or institution_id = my_institution() or my_role() = 'super_admin');
create policy "ubah profil sendiri" on profiles for update
  using (id = auth.uid())
  with check (id = auth.uid() and role = my_role() and institution_id is not distinct from my_institution());

-- Statistik: milik sendiri, orang tua yang terhubung, atau staf lembaga.
create policy "lihat statistik" on player_stats for select
  using (user_id = auth.uid()
      or exists (select 1 from parent_links where parent_id = auth.uid() and student_id = user_id)
      or (is_staff() and exists (select 1 from profiles where id = user_id and institution_id = my_institution())));

-- Kategori & achievement: katalog publik untuk pengguna login.
create policy "baca kategori"    on categories   for select using (auth.uid() is not null);
create policy "baca achievement" on achievements for select using (auth.uid() is not null);

-- Soal: staf mengelola soal lembaganya; soal global (institution_id null) hanya bisa dibaca.
-- Santri TIDAK membaca tabel soal secara langsung (penjelasan bisa membocorkan jawaban).
-- Soal dikirim satu per satu lewat fungsi server next_question().
create policy "staf baca soal" on questions for select
  using (is_staff() and (institution_id is null or institution_id = my_institution()));
create policy "kelola soal" on questions for all
  using (is_staff() and institution_id = my_institution())
  with check (is_staff() and institution_id = my_institution());

create policy "staf baca opsi" on answer_options for select
  using (exists (select 1 from questions q where q.id = question_id));   -- ikut RLS questions (staf saja)
create policy "kelola opsi" on answer_options for all
  using (is_staff() and exists (select 1 from questions q where q.id = question_id and q.institution_id = my_institution()));

-- KUNCI JAWABAN: hanya staf lembaga pemilik soal. Santri TIDAK punya policy apa pun.
create policy "staf kelola kunci" on answer_keys for all
  using (is_staff() and exists (select 1 from questions q where q.id = question_id and q.institution_id = my_institution()));

-- Kelas
create policy "lihat kelas" on classes for select
  using (institution_id = my_institution());
create policy "guru kelola kelas" on classes for all
  using (is_staff() and institution_id = my_institution())
  with check (is_staff() and institution_id = my_institution());
create policy "lihat anggota kelas" on class_members for select
  using (student_id = auth.uid() or exists (select 1 from classes c where c.id = class_id and c.teacher_id = auth.uid()));

-- Room: terlihat oleh pemain di dalamnya dan host. Bergabung/aksi lewat fungsi server.
create policy "lihat room" on game_rooms for select
  using (is_room_member(id));
create policy "lihat pemain room" on room_players for select
  using (is_room_member(room_id));

-- Sesi, jawaban, skor: milik sendiri; staf lembaga boleh melihat untuk laporan.
create policy "lihat sesi sendiri" on game_sessions for select
  using (user_id = auth.uid() or (room_id is not null and is_room_member(room_id)));
create policy "lihat soal sesi" on game_questions for select
  using (served_at is not null and exists (select 1 from game_sessions s where s.id = session_id));
create policy "lihat jawaban" on player_answers for select
  using (user_id = auth.uid() or (is_staff() and exists (select 1 from profiles p where p.id = user_id and p.institution_id = my_institution())));
create policy "lihat skor selembaga" on scores for select
  using (user_id = auth.uid() or institution_id = my_institution());

create policy "lihat achievement pemain" on player_achievements for select
  using (user_id = auth.uid() or exists (select 1 from profiles p where p.id = user_id and p.institution_id = my_institution()));
create policy "lihat progres" on player_progress for select
  using (user_id = auth.uid() or (is_staff() and exists (select 1 from profiles p where p.id = user_id and p.institution_id = my_institution())));

create policy "lihat tantangan" on daily_challenges for select
  using (institution_id is null or institution_id = my_institution());
create policy "staf kelola tantangan" on daily_challenges for all
  using (is_staff() and institution_id = my_institution())
  with check (is_staff() and institution_id = my_institution());
create policy "lihat percobaan sendiri" on challenge_attempts for select
  using (user_id = auth.uid());

-- Catatan: tabel tanpa policy INSERT/UPDATE untuk santri (sessions, answers, scores, stats,
-- room_players) hanya bisa ditulis oleh fungsi security definer (lihat 0002_quick_play.sql).

-- Buat profil otomatis saat akun baru mendaftar.
create function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as
$$
begin
  -- Pendaftar selalu menjadi santri. Peran guru/admin diberikan oleh admin, bukan dipilih sendiri.
  -- Tahap awal: semua akun baru masuk lembaga Al-Azhar Center.
  insert into profiles (id, institution_id, full_name, nickname)
  values (new.id,
          (select id from institutions where slug = 'al-azhar-center'),
          coalesce(new.raw_user_meta_data ->> 'full_name', ''),
          coalesce(nullif(new.raw_user_meta_data ->> 'nickname', ''), split_part(new.email, '@', 1)));
  insert into player_stats (user_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Lembaga awal
insert into institutions (name, slug) values ('Al-Azhar Center', 'al-azhar-center');
