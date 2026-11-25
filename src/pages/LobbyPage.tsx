import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, DoorOpen, Loader2, Plus, Users } from 'lucide-react'
import { api, type RoomSettings } from '../lib/api'
import { ARENAS, DIFFICULTIES, GAME_TYPE_LABEL, type Difficulty } from '../lib/arenas'
import { countFor, useCatalog, useGameTypeCounts } from '../lib/catalog'
import { MODES, type SnakeMode } from '../lib/snake'
import { errorMessage } from '../lib/supabase'
import { ArenaIcon } from '../components/ui'
import { Choice, Field, Toggle } from '../components/form'

type Game = 'quiz' | 'snake'
type QuizArena = 'mufrodat' | 'qowaid'

function JoinCard() {
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const valid = /^[A-Z0-9]{6}$/.test(code)
  function submit(e: FormEvent) {
    e.preventDefault()
    if (valid) navigate(`/app/room/${code}`)
  }
  return (
    <form onSubmit={submit} className="card p-5">
      <h2 className="flex items-center gap-2 font-bold">
        <DoorOpen size={18} /> Gabung Room
      </h2>
      <p className="mt-1 text-sm text-muted">Masukkan 6 karakter kode dari host.</p>
      <div className="mt-3 flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
          placeholder="KODE"
          aria-label="Kode room"
          inputMode="text"
          autoCapitalize="characters"
          className="min-w-0 flex-1 rounded-xl border border-line px-4 py-3 text-center font-mono text-2xl font-bold tracking-[0.3em] uppercase outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
        />
        <button disabled={!valid} className="flex items-center gap-1 rounded-xl bg-primary px-5 font-bold text-white disabled:opacity-40">
          Gabung <ArrowRight size={18} />
        </button>
      </div>
    </form>
  )
}

function ActiveRooms() {
  const [rooms, setRooms] = useState<{ code: string; status: string; game: string; players: number }[]>([])
  useEffect(() => {
    api.myActiveRooms().then(setRooms).catch(() => setRooms([]))
  }, [])
  if (rooms.length === 0) return null
  return (
    <div className="card p-5">
      <h2 className="font-bold">Room yang sedang kamu ikuti</h2>
      <div className="mt-3 space-y-2">
        {rooms.map((r) => (
          <Link key={r.code} to={`/app/room/${r.code}`} className="flex items-center gap-3 rounded-xl border border-line p-3 hover:bg-stone-50">
            <span className="font-mono text-lg font-bold tracking-widest text-primary">{r.code}</span>
            <span className="flex-1 text-sm text-muted">
              {r.game === 'snake' ? 'Ular Tangga' : 'Quiz Battle'} · {r.players} orang · {r.status === 'lobby' ? 'menunggu' : 'sedang bermain'}
            </span>
            <ArrowRight size={16} className="text-primary" />
          </Link>
        ))}
      </div>
    </div>
  )
}

export default function LobbyPage() {
  const navigate = useNavigate()
  const [game, setGame] = useState<Game>('quiz')
  const [arena, setArena] = useState<QuizArena>('mufrodat')
  const [gameType, setGameType] = useState<string | null>(null)
  const [category, setCategory] = useState<string | null>(null)
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null)
  const [count, setCount] = useState(10)
  const [mode, setMode] = useState<SnakeMode>('mixed')
  const [size, setSize] = useState<50 | 100>(50)
  const [time, setTime] = useState<number | null>(null)
  const [wrongSkips, setWrongSkips] = useState(true)
  const [snakeRescue, setSnakeRescue] = useState(true)
  const [maxPlayers, setMaxPlayers] = useState(30)
  const [hostPlays, setHostPlays] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { catalog } = useCatalog(arena, gameType)
  const typeCounts = useGameTypeCounts(arena)
  const available = catalog
    ? (category ? catalog.filter((c) => c.category_slug === category) : catalog).reduce((n, c) => n + countFor(c, difficulty), 0)
    : null

  async function create() {
    setBusy(true)
    setError(null)
    const settings: Partial<RoomSettings> =
      game === 'quiz'
        ? { game, arena, game_type: gameType, category_slug: category, difficulty, count, time_limit: time, max_players: maxPlayers, host_plays: hostPlays }
        : { game, mode, size, difficulty, time_limit: time ?? 30, wrong_skips: wrongSkips, snake_rescue: snakeRescue, max_players: maxPlayers, host_plays: hostPlays }
    try {
      const code = await api.createRoom(settings)
      navigate(`/app/room/${code}`)
    } catch (e) {
      setError(errorMessage(e))
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-primary">Main Bareng</h1>
        <p className="mt-1 text-sm text-muted">Buat room dan bagikan kodenya, atau gabung ke room teman/guru. 2–30 pemain, realtime.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        {/* Buat room */}
        <section className="card space-y-5 p-5">
          <h2 className="flex items-center gap-2 font-bold">
            <Plus size={18} /> Buat Room
          </h2>

          <div className="grid grid-cols-2 gap-3">
            {(
              [
                ['quiz', 'Quiz Battle', 'Semua menjawab soal yang sama', 'qowaid'],
                ['snake', 'Ular Tangga', 'Bergiliran melempar dadu', 'snake'],
              ] as const
            ).map(([id, name, desc, icon]) => (
              <button
                key={id}
                onClick={() => {
                  setGame(id)
                  setTime(id === 'snake' ? 30 : null)
                }}
                className={`flex items-center gap-3 rounded-2xl border-2 p-3 text-left transition ${game === id ? 'border-primary bg-primary/5' : 'border-line hover:bg-stone-50'}`}
              >
                <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${ARENAS[icon].color.bg} text-white`}>
                  <ArenaIcon arena={icon} size={20} />
                </span>
                <span>
                  <span className="block text-sm font-bold">{name}</span>
                  <span className="block text-xs text-muted">{desc}</span>
                </span>
              </button>
            ))}
          </div>

          {game === 'quiz' ? (
            <>
              <Field label="Arena">
                <div className="flex flex-wrap gap-2">
                  {(['mufrodat', 'qowaid'] as const).map((a) => (
                    <Choice key={a} active={arena === a} onClick={() => (setArena(a), setGameType(null), setCategory(null))}>
                      {ARENAS[a].name}
                    </Choice>
                  ))}
                </div>
              </Field>
              <Field label="Jenis permainan">
                <div className="flex flex-wrap gap-2">
                  <Choice active={gameType === null} onClick={() => (setGameType(null), setCategory(null))}>
                    Campuran
                  </Choice>
                  {ARENAS[arena].games
                    .filter((g) => g.type && (typeCounts?.[g.type] ?? 0) > 0)
                    .map((g) => (
                      <Choice key={g.type} active={gameType === g.type} onClick={() => (setGameType(g.type!), setCategory(null))}>
                        {GAME_TYPE_LABEL[g.type!]} <span className="font-normal text-muted">({typeCounts?.[g.type!]})</span>
                      </Choice>
                    ))}
                </div>
              </Field>
              <Field label="Materi">
                <select
                  value={category ?? ''}
                  onChange={(e) => setCategory(e.target.value || null)}
                  className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-primary"
                >
                  <option value="">Semua materi</option>
                  {catalog
                    ?.filter((c) => countFor(c, difficulty) > 0)
                    .map((c) => (
                      <option key={c.category_slug} value={c.category_slug}>
                        {c.group_name} · {c.category_name} ({countFor(c, difficulty)})
                      </option>
                    ))}
                </select>
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Jumlah soal">
                  <div className="flex gap-2">
                    {[5, 10, 15, 20].map((n) => (
                      <Choice key={n} active={count === n} onClick={() => setCount(n)}>
                        {n}
                      </Choice>
                    ))}
                  </div>
                </Field>
                <Field label="Durasi menjawab">
                  <div className="flex flex-wrap gap-2">
                    {[null, 15, 20, 30].map((t) => (
                      <Choice key={String(t)} active={time === t} onClick={() => setTime(t)}>
                        {t ? `${t} dtk` : 'Sesuai soal'}
                      </Choice>
                    ))}
                  </div>
                </Field>
              </div>
            </>
          ) : (
            <>
              <Field label="Mode">
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(MODES) as SnakeMode[]).map((m) => (
                    <Choice key={m} active={mode === m} onClick={() => (setMode(m), setWrongSkips(m !== 'casual'))}>
                      {MODES[m].name}
                    </Choice>
                  ))}
                </div>
                <p className="mt-1.5 text-xs text-muted">{MODES[mode].description}</p>
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Jumlah petak">
                  <div className="flex gap-2">
                    {([50, 100] as const).map((n) => (
                      <Choice key={n} active={size === n} onClick={() => setSize(n)}>
                        {n} petak
                      </Choice>
                    ))}
                  </div>
                </Field>
                <Field label="Durasi menjawab">
                  <div className="flex gap-2">
                    {[20, 30, 45].map((t) => (
                      <Choice key={t} active={time === t} onClick={() => setTime(t)}>
                        {t} dtk
                      </Choice>
                    ))}
                  </div>
                </Field>
              </div>
              <div className="space-y-3">
                <Toggle checked={wrongSkips} onChange={setWrongSkips} label="Jawaban salah = tertahan 1 giliran" />
                <Toggle checked={snakeRescue} onChange={setSnakeRescue} label="Soal penyelamat di kepala ular" />
              </div>
            </>
          )}

          <Field label="Tingkat soal">
            <div className="flex flex-wrap gap-2">
              <Choice active={difficulty === null} onClick={() => setDifficulty(null)}>
                Semua
              </Choice>
              {DIFFICULTIES.map((d) => (
                <Choice key={d.id} active={difficulty === d.id} onClick={() => setDifficulty(d.id)}>
                  {d.label}
                </Choice>
              ))}
            </div>
          </Field>

          <Field label={<>Maksimal pemain: <span className="text-primary">{maxPlayers}</span></>}>
            <input type="range" min={2} max={30} value={maxPlayers} onChange={(e) => setMaxPlayers(+e.target.value)} className="w-full accent-primary" aria-label="Maksimal pemain" />
          </Field>

          <Toggle
            checked={!hostPlays}
            onChange={(v) => setHostPlays(!v)}
            label="Mode Kelas: saya hanya memandu (tidak ikut bermain)"
            hint="Cocok untuk guru yang menampilkan permainan di proyektor."
          />

          {game === 'quiz' && available === 0 && <p className="text-sm text-amber-700">Belum ada soal untuk pilihan ini.</p>}
          {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <button
            onClick={create}
            disabled={busy || (game === 'quiz' && available === 0)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 font-bold text-white transition hover:bg-primary-light disabled:opacity-50"
          >
            {busy ? <Loader2 size={18} className="animate-spin" /> : <Users size={18} />} Buat Room
          </button>
        </section>

        <div className="space-y-6">
          <JoinCard />
          <ActiveRooms />
          <div className="card p-5 text-sm text-muted">
            <p className="font-bold text-ink">Cara main bareng</p>
            <ol className="mt-2 list-decimal space-y-1 pl-5">
              <li>Host membuat room dan membagikan kode.</li>
              <li>Pemain bergabung dan menekan tombol <b>Siap</b>.</li>
              <li>Host menekan <b>Mulai</b>. Soal, timer, dan skor tersinkron untuk semua.</li>
              <li>Koneksi terputus? Buka lagi room yang sama — kamu otomatis bergabung kembali.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
