import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Dices, Loader2, Plus, Users, X } from 'lucide-react'
import { api } from '../lib/api'
import { DIFFICULTIES, TILE_KINDS, type Difficulty, type TileKind } from '../lib/arenas'
import {
  DEFAULT_RULES, MODES, PIECE_COLORS, SPECIAL_BACK, SPECIAL_FORWARD, saveSnake,
  type BoardSize, type Rules, type SnakeMode,
} from '../lib/snake'
import { errorMessage } from '../lib/supabase'
import { useAuth } from '../lib/useAuth'
import SnakeBoard from '../components/SnakeBoard'
import { Choice, Toggle } from '../components/form'
import { ArenaHeader } from './ArenaPage'

const MAX_PLAYERS = 6
const DURATIONS: { label: string; value: number | null }[] = [
  { label: 'Sesuai soal', value: null },
  { label: '20 dtk', value: 20 },
  { label: '30 dtk', value: 30 },
  { label: '45 dtk', value: 45 },
]

export default function SnakeLadderPage() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [mode, setMode] = useState<SnakeMode>('mixed')
  const [rules, setRules] = useState<Rules>(DEFAULT_RULES.mixed)
  const [size, setSize] = useState<BoardSize>(50)
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null)
  const [duration, setDuration] = useState<number | null>(30)
  const [names, setNames] = useState<string[]>(() => [profile?.nickname || 'Pemain 1', 'Pemain 2'])
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function chooseMode(m: SnakeMode) {
    setMode(m)
    setRules(DEFAULT_RULES[m])
  }

  async function start() {
    const players = names.map((n, i) => n.trim() || `Pemain ${i + 1}`)
    setStarting(true)
    setError(null)
    try {
      const sessionId = await api.startSnake(mode, difficulty, players.length, duration)
      saveSnake({
        sessionId,
        mode,
        size,
        rules,
        players: players.map((name, i) => ({ name, color: i, pos: 0, points: 0, correct: 0, answered: 0, skip: 0 })),
        turn: 0,
        dice: 1,
        pending: null,
        winner: null,
        finished: false,
        log: [],
      })
      navigate(`/app/ular-tangga/main/${sessionId}`)
    } catch (e) {
      setError(errorMessage(e))
      setStarting(false)
    }
  }

  const legend: TileKind[] = [...MODES[mode].tiles, 'bonus', 'khusus', 'tangga', 'ular']

  return (
    <div className="space-y-6">
      <ArenaHeader id="snake" />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        {/* Pratinjau papan sesuai pengaturan */}
        <section className="card p-3 sm:p-5">
          <h2 className="mb-3 px-1 text-base font-bold">Pratinjau Papan</h2>
          <SnakeBoard size={size} mode={mode} />
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 px-1">
            {legend.map((k) => (
              <span key={k} className="flex items-center gap-1.5 text-xs text-muted">
                <span className={`arabic grid size-5 place-items-center rounded text-[11px] font-bold ${TILE_KINDS[k].className}`}>{TILE_KINDS[k].symbol}</span>
                {TILE_KINDS[k].label}
              </span>
            ))}
          </div>
        </section>

        {/* Pengaturan */}
        <section className="card space-y-5 p-5">
          <div>
            <h2 className="text-sm font-bold">Mode permainan</h2>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {(Object.keys(MODES) as SnakeMode[]).map((m) => (
                <Choice accent="border-snake bg-snake-soft text-snake" key={m} active={mode === m} onClick={() => chooseMode(m)}>
                  {MODES[m].name}
                </Choice>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted">{MODES[mode].description}</p>
            <p className="mt-2 text-xs text-muted">
              Competition & Classroom Mode (online, 2–30 pemain):{' '}
              <Link to="/app/lobby" className="font-semibold text-snake hover:underline">
                buka Main Bareng →
              </Link>
            </p>
          </div>

          <div>
            <h2 className="text-sm font-bold">
              Pemain <span className="font-normal text-muted">(bergiliran di perangkat ini)</span>
            </h2>
            <div className="mt-2 space-y-2">
              {names.map((n, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className={`size-5 shrink-0 rounded-full ${PIECE_COLORS[i].className}`} title={PIECE_COLORS[i].name} />
                  <input
                    value={n}
                    maxLength={20}
                    onChange={(e) => setNames(names.map((x, j) => (j === i ? e.target.value : x)))}
                    aria-label={`Nama pemain ${i + 1}`}
                    className="min-w-0 flex-1 rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-snake focus:ring-2 focus:ring-snake/15"
                  />
                  {names.length > 1 && (
                    <button onClick={() => setNames(names.filter((_, j) => j !== i))} aria-label={`Hapus pemain ${i + 1}`} className="rounded-lg p-2 text-muted hover:bg-slate-100">
                      <X size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {names.length < MAX_PLAYERS && (
              <button
                onClick={() => setNames([...names, `Pemain ${names.length + 1}`])}
                className="mt-2 flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-semibold text-snake hover:bg-snake-soft"
              >
                <Plus size={16} /> Tambah pemain
              </button>
            )}
            <p className="mt-1 text-xs text-muted">
              {names.length === 1 ? 'Main sendiri: XP masuk ke akunmu.' : 'Main bergiliran: skor tercatat, XP hanya untuk main sendiri.'}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <h2 className="text-sm font-bold">Tingkat soal</h2>
              <div className="mt-2 flex flex-wrap gap-2">
                <Choice accent="border-snake bg-snake-soft text-snake" active={difficulty === null} onClick={() => setDifficulty(null)}>Semua</Choice>
                {DIFFICULTIES.map((d) => (
                  <Choice accent="border-snake bg-snake-soft text-snake" key={d.id} active={difficulty === d.id} onClick={() => setDifficulty(d.id)}>
                    {d.label}
                  </Choice>
                ))}
              </div>
            </div>
            <div>
              <h2 className="text-sm font-bold">Jumlah petak</h2>
              <div className="mt-2 flex gap-2">
                {([50, 100] as BoardSize[]).map((n) => (
                  <Choice accent="border-snake bg-snake-soft text-snake" key={n} active={size === n} onClick={() => setSize(n)}>
                    {n} petak
                  </Choice>
                ))}
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-sm font-bold">Durasi menjawab</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {DURATIONS.map((d) => (
                <Choice accent="border-snake bg-snake-soft text-snake" key={d.label} active={duration === d.value} onClick={() => setDuration(d.value)}>
                  {d.label}
                </Choice>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-bold">Aturan bonus & konsekuensi</h2>
            <Toggle
              checked={rules.wrongSkips}
              onChange={(v) => setRules({ ...rules, wrongSkips: v })}
              label="Jawaban salah = tertahan 1 giliran"
              hint="Berlaku di petak tantangan biasa."
            />
            <Toggle
              checked={rules.snakeRescue}
              onChange={(v) => setRules({ ...rules, snakeRescue: v })}
              label="Soal penyelamat di kepala ular"
              hint="Jawab benar agar tidak turun. Jika dimatikan, langsung turun."
            />
          </div>

          {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <button
            onClick={start}
            disabled={starting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-snake py-3.5 text-base font-extrabold text-white shadow-sm transition hover:brightness-110 disabled:opacity-60"
          >
            {starting ? <Loader2 size={20} className="animate-spin" /> : <Dices size={20} />} Mulai Permainan
          </button>
          <Link to="/app/lobby" className="flex items-center justify-center gap-1.5 text-xs font-semibold text-snake hover:underline">
            <Users size={14} /> Main online satu kelas (2–30 pemain) di Main Bareng
          </Link>
        </section>
      </div>

      {/* Aturan */}
      <section className="card p-5 sm:p-6">
        <h2 className="text-base font-bold">Cara Bermain</h2>
        <ol className="mt-3 grid gap-x-8 gap-y-2 text-sm text-muted md:grid-cols-2">
          {[
            'Pemain melempar dadu bergiliran; bidak bergerak sesuai angka.',
            'Berhenti di petak tantangan → jawab soal sesuai jenis petak sebelum waktu habis.',
            'Jawaban benar menambah poin. Jawaban salah bisa membuat pemain tertahan 1 giliran.',
            'Tangga ▲ langsung membawa naik. Kepala ular ▼: jawab soal penyelamat agar tidak turun.',
            `Bonus ★: lempar dadu lagi. Tantangan khusus !: soal lebih sulit — benar maju ${SPECIAL_FORWARD}, salah mundur ${SPECIAL_BACK}.`,
            'Pemenang: pemain pertama yang mencapai petak terakhir. Kelebihan langkah memantul mundur.',
          ].map((r, i) => (
            <li key={r} className="flex gap-2.5">
              <span className="grid size-5 shrink-0 place-items-center rounded-full bg-snake-soft text-[11px] font-bold text-snake">{i + 1}</span>
              {r}
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}
