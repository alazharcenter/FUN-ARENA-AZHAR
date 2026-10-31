// Konfigurasi tampilan arena: nama, warna, dan jenis permainan.
// Daftar materi/kategori dan soal TIDAK ada di sini — dibaca dari Supabase
// (fungsi quick_play_catalog). Sumber kategori: supabase/seed/data.mjs.

// Tahap roadmap yang sedang berjalan (fitur dengan stage > ini ditandai "Tahap N")
export const CURRENT_STAGE = 7

export type ArenaId = 'mufrodat' | 'qowaid' | 'snake'
export type Difficulty = 'beginner' | 'intermediate' | 'advanced'

export interface GameMode {
  type?: string // nilai enum game_type di database (kosong untuk mode ular tangga)
  name: string
  description: string
  stage: number // tahap roadmap saat permainan ini aktif
  multiplayer?: boolean
}

export interface Arena {
  id: ArenaId
  db: 'mufrodat' | 'qowaid' | 'snake_ladder' // nama arena di database
  path: string
  name: string
  ar: string
  tagline: string
  // Kelas Tailwind ditulis lengkap agar terdeteksi saat build
  color: { text: string; bg: string; soft: string; border: string; ring: string }
  games: GameMode[]
}

export const DIFFICULTIES: { id: Difficulty; label: string; hint: string }[] = [
  { id: 'beginner', label: 'Beginner', hint: 'Dasar, banyak bantuan' },
  { id: 'intermediate', label: 'Intermediate', hint: 'Kalimat & konteks' },
  { id: 'advanced', label: 'Advanced', hint: 'Analisis mendalam' },
]

export const ARENAS: Record<ArenaId, Arena> = {
  mufrodat: {
    id: 'mufrodat',
    db: 'mufrodat',
    path: '/app/arena/mufrodat',
    name: 'Mufrodat & Muhadatsah',
    ar: 'الْمُفْرَدَاتُ وَالْمُحَادَثَةُ',
    tagline: 'Kosakata, ungkapan, dan percakapan sehari-hari — Fusha & Amiyah Mesir.',
    color: {
      text: 'text-mufrodat',
      bg: 'bg-mufrodat',
      soft: 'bg-mufrodat-soft',
      border: 'border-mufrodat',
      ring: 'ring-mufrodat',
    },
    games: [
      { type: 'vocabulary_challenge', name: 'Vocabulary Challenge', description: 'Tebak arti kosakata Arab.', stage: 2, multiplayer: true },
      { type: 'arabic_translation', name: 'Arabic Translation', description: 'Terjemahkan Indonesia ⇄ Arab.', stage: 2 },
      { type: 'complete_expression', name: 'Complete the Expression', description: 'Lengkapi ungkapan bahasa Arab.', stage: 2 },
      { type: 'sentence_builder', name: 'Sentence Builder', description: 'Susun kata menjadi kalimat yang benar.', stage: 2 },
      { type: 'picture_vocabulary', name: 'Picture Vocabulary', description: 'Tebak kosakata dari gambar.', stage: 2 },
      { type: 'daily_conversation', name: 'Daily Conversation', description: 'Pilih respons yang tepat dalam dialog.', stage: 2, multiplayer: true },
      { type: 'listening_challenge', name: 'Listening Challenge', description: 'Jawab pertanyaan dari audio.', stage: 6 },
      { type: 'true_false', name: 'True or False', description: 'Benar atau salah terjemahan ini?', stage: 2, multiplayer: true },
      { type: 'context_challenge', name: 'Context Challenge', description: 'Pilih kosakata sesuai situasi.', stage: 2 },
      { type: 'amiyah_challenge', name: 'Amiyah Challenge', description: 'Kenali bahasa Arab Amiyah Mesir.', stage: 2 },
    ],
  },
  qowaid: {
    id: 'qowaid',
    db: 'qowaid',
    path: '/app/arena/qowaid',
    name: 'Qowaid Arena',
    ar: 'الْقَوَاعِدُ',
    tagline: 'Uji analisis Nahwu, Shorof, dan I\'rab — setiap jawaban disertai penjelasan kaidah.',
    color: {
      text: 'text-qowaid',
      bg: 'bg-qowaid',
      soft: 'bg-qowaid-soft',
      border: 'border-qowaid',
      ring: 'ring-qowaid',
    },
    games: [
      { type: 'irab_challenge', name: "I'rab Challenge", description: "Tentukan kedudukan, tanda i'rab, dan alasannya.", stage: 3 },
      { type: 'nahwu_battle', name: 'Nahwu Battle', description: 'Adu cepat & tepat soal Nahwu.', stage: 3, multiplayer: true },
      { type: 'tashrif_battle', name: 'Tashrif Battle', description: "Ubah bentuk fi'il sesuai instruksi.", stage: 3, multiplayer: true },
      { type: 'sentence_builder', name: 'Sentence Builder', description: 'Susun kalimat sesuai kaidah.', stage: 3 },
      { type: 'grammar_detective', name: 'Grammar Detective', description: 'Temukan kesalahan Nahwu/Shorof.', stage: 3 },
      { type: 'complete_rule', name: 'Complete the Rule', description: 'Lengkapi kaidah yang rumpang.', stage: 3 },
      { type: 'sentence_analysis', name: 'Sentence Analysis', description: 'Analisis kedudukan setiap kata.', stage: 3 },
      { type: 'fiil_challenge', name: "Fi'il Challenge", description: "Identifikasi bentuk dan jenis fi'il.", stage: 3 },
      { type: 'identify_word', name: 'Identify the Word', description: "Isim, fi'il, atau huruf?", stage: 3 },
      { type: 'grammar_duel', name: 'Grammar Duel', description: 'Duel satu lawan satu soal kaidah.', stage: 5, multiplayer: true },
    ],
  },
  snake: {
    id: 'snake',
    db: 'snake_ladder',
    path: '/app/arena/ular-tangga',
    name: 'Arabic Snake & Ladder',
    ar: 'سُلَّمُ الْعَرَبِيَّةِ',
    tagline: 'Ular tangga edukatif: lempar dadu, jawab tantangan, naik tangga — bisa satu kelas sekaligus.',
    color: {
      text: 'text-snake',
      bg: 'bg-snake',
      soft: 'bg-snake-soft',
      border: 'border-snake',
      ring: 'ring-snake',
    },
    games: [
      { name: 'Casual Mode', description: 'Santai, fokus belajar.', stage: 4 },
      { name: 'Competition Mode', description: 'Skor dan batas waktu.', stage: 5, multiplayer: true },
      { name: 'Classroom Mode', description: 'Guru jadi host, satu kelas bermain.', stage: 5, multiplayer: true },
      { name: 'Qowaid Mode', description: 'Semua petak berisi soal Nahwu & Shorof.', stage: 4 },
      { name: 'Mixed Mode', description: 'Mufrodat, muhadatsah, dan qowaid.', stage: 4 },
    ],
  },
}

export const ARENA_LIST = [ARENAS.mufrodat, ARENAS.qowaid, ARENAS.snake]

// Jenis petak papan ular tangga
export type TileKind =
  | 'normal' | 'mufrodat' | 'terjemah' | 'muhadatsah' | 'qowaid'
  | 'nahwu' | 'shorof' | 'bonus' | 'khusus' | 'tangga' | 'ular'

export const TILE_KINDS: Record<TileKind, { label: string; className: string; symbol: string }> = {
  normal: { label: 'Biasa', className: 'bg-white text-muted', symbol: '' },
  mufrodat: { label: 'Mufrodat', className: 'bg-mufrodat-soft text-mufrodat', symbol: 'م' },
  terjemah: { label: 'Terjemahan', className: 'bg-sky-50 text-sky-700', symbol: 'ت' },
  muhadatsah: { label: 'Muhadatsah', className: 'bg-teal-50 text-teal-700', symbol: 'ح' },
  qowaid: { label: 'Qowaid', className: 'bg-qowaid-soft text-qowaid', symbol: 'ق' },
  nahwu: { label: 'Nahwu', className: 'bg-violet-50 text-violet-700', symbol: 'ن' },
  shorof: { label: 'Shorof', className: 'bg-fuchsia-50 text-fuchsia-700', symbol: 'ص' },
  bonus: { label: 'Bonus', className: 'bg-gold-soft text-amber-700', symbol: '★' },
  khusus: { label: 'Tantangan khusus', className: 'bg-rose-50 text-rose-700', symbol: '!' },
  tangga: { label: 'Tangga (naik)', className: 'bg-emerald-50 text-emerald-700', symbol: '▲' },
  ular: { label: 'Ular (turun)', className: 'bg-red-50 text-red-700', symbol: '▼' },
}

export const ARENA_BY_DB: Record<Arena['db'], Arena> = {
  mufrodat: ARENAS.mufrodat,
  qowaid: ARENAS.qowaid,
  snake_ladder: ARENAS.snake,
}

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
}

// Nama tampilan setiap jenis permainan, diambil dari daftar di atas
export const GAME_TYPE_LABEL: Record<string, string> = Object.fromEntries(
  [ARENAS.mufrodat, ARENAS.qowaid].flatMap((a) => a.games.filter((g) => g.type).map((g) => [g.type, g.name])),
)

// Arena asal sebuah jenis permainan (untuk warna label di layar bermain)
export const ARENA_OF_GAME_TYPE: Record<string, ArenaId> = Object.fromEntries(
  [ARENAS.mufrodat, ARENAS.qowaid].flatMap((a) => a.games.filter((g) => g.type).map((g) => [g.type, a.id])),
)
