// Aturan papan Arabic Snake & Ladder (سُلَّمُ الْعَرَبِيَّةِ).
// Modul ini murni logika (tanpa React) agar mudah diuji. Soal & penilaian tetap di server.
import type { TileKind } from './arenas'

export type SnakeMode = 'casual' | 'mixed' | 'qowaid'
export type ChallengeKind = 'mufrodat' | 'terjemah' | 'muhadatsah' | 'qowaid' | 'nahwu' | 'shorof'
export type BoardSize = 50 | 100

export const COLS = 10

export interface Board {
  size: BoardSize
  ladders: Record<number, number> // kaki → puncak
  snakes: Record<number, number> // kepala → ekor
}

export const BOARDS: Record<BoardSize, Board> = {
  100: {
    size: 100,
    ladders: { 4: 25, 13: 46, 33: 49, 42: 63, 50: 69, 62: 81, 74: 92 },
    snakes: { 27: 5, 40: 3, 43: 18, 54: 31, 66: 45, 89: 53, 95: 76, 99: 41 },
  },
  50: {
    size: 50,
    ladders: { 3: 22, 11: 28, 20: 39, 32: 48 },
    snakes: { 17: 4, 29: 9, 37: 19, 47: 26 },
  },
}

export const MODES: Record<SnakeMode, { name: string; description: string; tiles: ChallengeKind[] }> = {
  casual: { name: 'Casual', description: 'Santai: mufrodat & percakapan, jawaban salah tidak dihukum.', tiles: ['mufrodat', 'terjemah', 'muhadatsah'] },
  mixed: { name: 'Mixed', description: 'Gabungan mufrodat, muhadatsah, dan qowaid.', tiles: ['mufrodat', 'terjemah', 'qowaid', 'muhadatsah', 'nahwu', 'shorof'] },
  qowaid: { name: 'Qowaid', description: 'Semua petak tantangan berisi soal Nahwu, Shorof, dan I\'rab.', tiles: ['qowaid', 'nahwu', 'shorof'] },
}

export interface Rules {
  wrongSkips: boolean // jawaban salah → tertahan 1 giliran
  snakeRescue: boolean // berhenti di kepala ular → soal penyelamat
}

export const DEFAULT_RULES: Record<SnakeMode, Rules> = {
  casual: { wrongSkips: false, snakeRescue: true },
  mixed: { wrongSkips: true, snakeRescue: true },
  qowaid: { wrongSkips: true, snakeRescue: true },
}

// Langkah petak tantangan khusus
export const SPECIAL_FORWARD = 5
export const SPECIAL_BACK = 3

export function tileKind(n: number, board: Board, mode: SnakeMode): TileKind {
  if (board.ladders[n]) return 'tangga'
  if (board.snakes[n]) return 'ular'
  if (n <= 1 || n >= board.size) return 'normal'
  if (n % 15 === 0) return 'bonus'
  if (n % 23 === 0) return 'khusus'
  if (n % 3 === 0) {
    const tiles = MODES[mode].tiles
    return tiles[(n / 3) % tiles.length]
  }
  return 'normal'
}

export function isChallenge(kind: TileKind): kind is ChallengeKind {
  return ['mufrodat', 'terjemah', 'muhadatsah', 'qowaid', 'nahwu', 'shorof'].includes(kind)
}

// Petak yang dilalui satu per satu. Posisi 0 = belum masuk papan.
// Jika angka dadu melebihi petak terakhir, bidak memantul mundur.
export function stepPath(from: number, steps: number, size: number): number[] {
  const path: number[] = []
  let pos = from
  let dir = steps >= 0 ? 1 : -1
  for (let i = 0; i < Math.abs(steps); i++) {
    if (dir === 1 && pos >= size) dir = -1
    pos = Math.max(1, pos + dir)
    path.push(pos)
  }
  return path
}

// Petak 1 di kiri bawah, arah baris berbelok (zig-zag). Hasil dalam persen (0–100).
export function cellCenter(n: number, size: number) {
  const rows = size / COLS
  const row = Math.floor((n - 1) / COLS)
  const col = row % 2 === 0 ? (n - 1) % COLS : COLS - 1 - ((n - 1) % COLS)
  return { x: ((col + 0.5) / COLS) * 100, y: ((rows - 1 - row + 0.5) / rows) * 100 }
}

// Urutan petak untuk dirender baris demi baris dari atas
export function boardRows(size: number): number[][] {
  const rows = size / COLS
  return Array.from({ length: rows }, (_, r) => {
    const fromBottom = rows - 1 - r
    const nums = Array.from({ length: COLS }, (_, c) => fromBottom * COLS + c + 1)
    return fromBottom % 2 === 0 ? nums : nums.reverse()
  })
}

export const PIECE_COLORS = [
  { name: 'Biru', className: 'bg-sky-500', ring: 'ring-sky-500', text: 'text-sky-600' },
  { name: 'Merah', className: 'bg-rose-500', ring: 'ring-rose-500', text: 'text-rose-600' },
  { name: 'Hijau', className: 'bg-emerald-500', ring: 'ring-emerald-500', text: 'text-emerald-600' },
  { name: 'Kuning', className: 'bg-amber-400', ring: 'ring-amber-400', text: 'text-amber-600' },
  { name: 'Ungu', className: 'bg-violet-500', ring: 'ring-violet-500', text: 'text-violet-600' },
  { name: 'Hitam', className: 'bg-slate-700', ring: 'ring-slate-700', text: 'text-slate-700' },
  // Warna tambahan untuk room online (hingga 30 pemain; warna berulang setelah 12)
  { name: 'Oranye', className: 'bg-orange-500', ring: 'ring-orange-500', text: 'text-orange-600' },
  { name: 'Toska', className: 'bg-teal-500', ring: 'ring-teal-500', text: 'text-teal-600' },
  { name: 'Merah muda', className: 'bg-pink-400', ring: 'ring-pink-400', text: 'text-pink-600' },
  { name: 'Hijau muda', className: 'bg-lime-500', ring: 'ring-lime-500', text: 'text-lime-700' },
  { name: 'Nila', className: 'bg-indigo-500', ring: 'ring-indigo-500', text: 'text-indigo-600' },
  { name: 'Coklat', className: 'bg-amber-800', ring: 'ring-amber-800', text: 'text-amber-800' },
]

export const pieceColor = (i: number) => PIECE_COLORS[((i % PIECE_COLORS.length) + PIECE_COLORS.length) % PIECE_COLORS.length]

// ---------------------------------------------------------------------
// Status permainan lokal (disimpan di perangkat)

export interface SnakePlayer {
  name: string
  color: number // indeks PIECE_COLORS
  pos: number
  points: number // dari server (submit_answer), bukan dihitung perangkat
  correct: number
  answered: number
  skip: number // giliran yang harus dilewati
}

type Pending = { tile: ChallengeKind; harder: boolean; reason: 'challenge' | 'snake' | 'special'; at: number }

export interface SnakeState {
  sessionId: string
  mode: SnakeMode
  size: BoardSize
  rules: Rules
  players: SnakePlayer[]
  turn: number
  dice: number
  pending: Pending | null
  winner: number | null
  finished: boolean // sudah dicatat ke server
  log: string[]
}

const STORAGE = (id: string) => `fun-arena:snake:${id}`

// Status permainan disimpan di perangkat agar bisa dilanjutkan setelah refresh
export function saveSnake(state: SnakeState) {
  try {
    localStorage.setItem(STORAGE(state.sessionId), JSON.stringify(state))
  } catch {
    /* penyimpanan perangkat tidak tersedia: permainan tetap berjalan */
  }
}

export function loadSnake(id: string): SnakeState | null {
  try {
    const raw = localStorage.getItem(STORAGE(id))
    return raw ? (JSON.parse(raw) as SnakeState) : null
  } catch {
    return null
  }
}

