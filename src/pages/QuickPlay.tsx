import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AlertCircle, Loader2, Play, X } from 'lucide-react'
import { api, type CatalogItem } from '../lib/api'
import { countFor, useCatalog } from '../lib/catalog'
import { ARENAS, ARENA_OF_GAME_TYPE, DIFFICULTIES, GAME_TYPE_LABEL, type ArenaId, type Difficulty } from '../lib/arenas'
import { errorMessage } from '../lib/supabase'
import { Arabic, ArenaIcon } from '../components/ui'

const PLAYABLE: ArenaId[] = ['mufrodat', 'qowaid']
const COUNTS = [5, 10, 15]

export default function QuickPlay() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const initialArena = (PLAYABLE as string[]).includes(params.get('arena') ?? '') ? (params.get('arena') as ArenaId) : 'mufrodat'
  // ?jenis=irab_challenge → hanya soal dari satu jenis permainan
  const initialType = params.get('jenis')
  const validType = initialType && ARENA_OF_GAME_TYPE[initialType] === initialArena ? initialType : null

  const [arena, setArena] = useState<ArenaId>(initialArena)
  const [gameType, setGameType] = useState<string | null>(validType)
  const [category, setCategory] = useState<string | null>(params.get('kategori'))
  const [difficulty, setDifficulty] = useState<Difficulty | null>((params.get('tingkat') as Difficulty) || null)
  const [count, setCount] = useState(10)
  const [starting, setStarting] = useState(false)
  const [startError, setStartError] = useState<string | null>(null)
  const { catalog, error } = useCatalog(arena, gameType)
  const a = ARENAS[arena]

  const groups = useMemo(() => {
    const map = new Map<string, { name: string; ar: string | null; items: CatalogItem[] }>()
    for (const item of catalog ?? []) {
      if (!map.has(item.group_name)) map.set(item.group_name, { name: item.group_name, ar: item.group_name_ar, items: [] })
      map.get(item.group_name)!.items.push(item)
    }
    return [...map.values()]
  }, [catalog])

  const available = useMemo(() => {
    if (!catalog) return 0
    const items = category ? catalog.filter((c) => c.category_slug === category) : catalog
    return items.reduce((n, c) => n + countFor(c, difficulty), 0)
  }, [catalog, category, difficulty])

  async function start() {
    setStarting(true)
    setStartError(null)
    try {
      const sessionId = await api.startQuickPlay(a.db, category, difficulty, count, gameType)
      navigate(`/app/main/${sessionId}`)
    } catch (e) {
      setStartError(errorMessage(e))
      setStarting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-primary">Quick Play</h1>
        <p className="mt-1 text-sm text-muted">Main sendiri. Setiap jawaban dinilai server dan disertai penjelasan.</p>
        {gameType && (
          <span className={`mt-3 inline-flex items-center gap-2 rounded-full ${a.color.soft} py-1 pr-1.5 pl-3 text-sm font-semibold ${a.color.text}`}>
            Jenis: {GAME_TYPE_LABEL[gameType] ?? gameType}
            <button onClick={() => setGameType(null)} aria-label="Hapus filter jenis" className="rounded-full p-0.5 hover:bg-white/60">
              <X size={14} />
            </button>
          </span>
        )}
      </div>

      {/* Arena */}
      <section className="grid grid-cols-2 gap-3">
        {PLAYABLE.map((id) => {
          const x = ARENAS[id]
          const active = id === arena
          return (
            <button
              key={id}
              onClick={() => {
                setArena(id)
                setCategory(null)
                setGameType(null)
              }}
              className={`card flex items-center gap-3 p-4 text-left transition ${active ? `ring-2 ${x.color.ring}` : 'hover:bg-stone-50'}`}
            >
              <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${active ? `${x.color.bg} text-white` : `${x.color.soft} ${x.color.text}`}`}>
                <ArenaIcon arena={id} size={22} />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold">{x.name}</span>
                <Arabic className={`text-sm ${x.color.text}`}>{x.ar}</Arabic>
              </span>
            </button>
          )
        })}
      </section>

      {/* Tingkat & jumlah */}
      <section className="card grid gap-5 p-5 md:grid-cols-[1fr_auto]">
        <div>
          <h2 className="text-sm font-bold">Tingkat kesulitan</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {[{ id: null, label: 'Semua' }, ...DIFFICULTIES].map((d) => (
              <button
                key={d.label}
                onClick={() => setDifficulty(d.id as Difficulty | null)}
                className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                  difficulty === d.id ? `${a.color.border} ${a.color.soft} ${a.color.text}` : 'border-line hover:bg-stone-50'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <h2 className="text-sm font-bold">Jumlah soal</h2>
          <div className="mt-2 flex gap-2">
            {COUNTS.map((n) => (
              <button
                key={n}
                onClick={() => setCount(n)}
                className={`w-14 rounded-xl border py-2 text-sm font-semibold transition ${
                  count === n ? `${a.color.border} ${a.color.soft} ${a.color.text}` : 'border-line hover:bg-stone-50'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Materi */}
      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold">Materi</h2>
          <button
            onClick={() => setCategory(null)}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${category === null ? `${a.color.bg} text-white` : 'bg-stone-100 text-muted'}`}
          >
            Semua materi
          </button>
        </div>

        {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {!catalog && !error && (
          <div className="flex justify-center py-10 text-muted">
            <Loader2 className="animate-spin" />
          </div>
        )}

        {groups.map((g) => (
          <div key={g.name}>
            <div className="mb-2 flex items-center gap-2">
              <h3 className="text-sm font-semibold text-muted">{g.name}</h3>
              {g.ar && <Arabic className={`text-base ${a.color.text}`}>{g.ar}</Arabic>}
            </div>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
              {g.items.map((item) => {
                const n = countFor(item, difficulty)
                const active = category === item.category_slug
                return (
                  <button
                    key={item.category_slug}
                    disabled={n === 0}
                    onClick={() => setCategory(active ? null : item.category_slug)}
                    aria-pressed={active}
                    className={`card flex flex-col items-start gap-1 p-3.5 text-left transition disabled:cursor-not-allowed disabled:opacity-45 ${
                      active ? `ring-2 ${a.color.ring}` : 'enabled:hover:bg-stone-50'
                    }`}
                  >
                    {item.category_name_ar && (
                      <Arabic className="w-full text-right text-lg font-semibold text-primary">{item.category_name_ar}</Arabic>
                    )}
                    <span className="text-xs font-medium text-muted">{item.category_name}</span>
                    <span className="text-[11px] font-semibold text-muted/80">{n > 0 ? `${n} soal` : 'Belum ada soal'}</span>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </section>

      {/* Tombol mulai: menempel di bawah agar mudah dijangkau di HP */}
      <div className="sticky bottom-20 z-10 lg:bottom-4">
        <div className="card flex flex-col gap-3 p-4 shadow-lg sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm">
            {catalog && available === 0 ? (
              <span className="flex items-center gap-2 font-medium text-amber-700">
                <AlertCircle size={16} />
                Belum ada soal untuk pilihan ini. Coba ubah tingkat atau materi.
              </span>
            ) : (
              <span className="text-muted">
                <b className="text-ink">{Math.min(count, available)}</b> soal acak dari {available} soal tersedia
              </span>
            )}
            {startError && <p className="mt-1 text-red-600">{startError}</p>}
          </div>
          <button
            onClick={start}
            disabled={starting || !catalog || available === 0}
            className={`flex items-center justify-center gap-2 rounded-xl ${a.color.bg} px-8 py-3 text-sm font-bold text-white shadow-sm transition hover:brightness-110 disabled:opacity-50`}
          >
            {starting ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} />} Mulai
          </button>
        </div>
      </div>
    </div>
  )
}
