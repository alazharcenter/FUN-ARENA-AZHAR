import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ChevronRight, Loader2, Play, Users } from 'lucide-react'
import { ARENAS, CURRENT_STAGE, DIFFICULTIES, type ArenaId, type Difficulty } from '../lib/arenas'
import type { CatalogItem } from '../lib/api'
import { countFor, useCatalog, useGameTypeCounts } from '../lib/catalog'
import { Arabic, ArenaIcon, StageBadge } from '../components/ui'

export function ArenaHeader({ id }: { id: ArenaId }) {
  const a = ARENAS[id]
  return (
    <section className={`relative overflow-hidden rounded-3xl ${a.color.bg} p-6 text-white sm:p-8`}>
      <div className="absolute -top-20 -right-16 size-64 rounded-full bg-white/10" aria-hidden />
      <div className="absolute -bottom-24 right-24 size-48 rounded-full bg-black/5" aria-hidden />
      <div className="relative">
        <Link to="/app" className="inline-flex items-center gap-1 text-sm font-medium text-white/80 hover:text-white">
          <ArrowLeft size={16} /> Beranda
        </Link>
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-white/15 ring-1 ring-white/20">
              <ArenaIcon arena={id} size={28} />
            </span>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{a.name}</h1>
              <p className="mt-0.5 max-w-xl text-sm text-white/80">{a.tagline}</p>
            </div>
          </div>
          <Arabic className="text-3xl font-semibold text-white/95 sm:text-4xl">{a.ar}</Arabic>
        </div>
      </div>
    </section>
  )
}

export default function ArenaPage({ id }: { id: Exclude<ArenaId, 'snake'> }) {
  const a = ARENAS[id]
  const [difficulty, setDifficulty] = useState<Difficulty>('beginner')
  const [topic, setTopic] = useState<CatalogItem | null>(null)
  const { catalog, error } = useCatalog(id)
  const typeCounts = useGameTypeCounts(id)

  const groups = useMemo(() => {
    const map = new Map<string, { name: string; ar: string | null; items: CatalogItem[] }>()
    for (const item of catalog ?? []) {
      if (!map.has(item.group_name)) map.set(item.group_name, { name: item.group_name, ar: item.group_name_ar, items: [] })
      map.get(item.group_name)!.items.push(item)
    }
    return [...map.values()]
  }, [catalog])

  const play = new URLSearchParams({ arena: id, tingkat: difficulty })
  if (topic) play.set('kategori', topic.category_slug)

  return (
    <div className="space-y-8">
      <ArenaHeader id={id} />

      {/* Pengaturan permainan */}
      <section className="card p-5 sm:p-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <h2 className="text-sm font-bold">Tingkat kesulitan</h2>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setDifficulty(d.id)}
                  className={`rounded-xl border px-3 py-2.5 text-left transition ${
                    difficulty === d.id ? `${a.color.border} ${a.color.soft}` : 'border-line hover:bg-stone-50'
                  }`}
                >
                  <span className={`block text-sm font-bold ${difficulty === d.id ? a.color.text : ''}`}>{d.label}</span>
                  <span className="hidden text-xs text-muted sm:block">{d.hint}</span>
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted">
              Materi: <b className="text-ink">{topic?.category_name ?? 'Semua materi'}</b> · Pilih materi di bawah untuk fokus latihan.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              to={`/app/quick-play?${play}`}
              className={`inline-flex items-center justify-center gap-2 rounded-xl ${a.color.bg} px-6 py-3 text-sm font-bold text-white shadow-sm hover:brightness-110`}
            >
              <Play size={18} /> Quick Play
            </Link>
            <Link
              to="/app/lobby"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-line px-6 py-3 text-sm font-bold text-primary hover:bg-stone-50"
            >
              <Users size={18} /> Main Bareng
            </Link>
          </div>
        </div>
      </section>

      {/* Jenis permainan */}
      <section>
        <h2 className="mb-3 text-base font-bold">Jenis Permainan</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {a.games.map((g, i) => {
            const n = (g.type && typeCounts?.[g.type]) || 0
            const body = (
              <>
                <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${a.color.soft} text-sm font-extrabold ${a.color.text}`}>
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold">{g.name}</p>
                  <p className="mt-0.5 text-xs text-muted">{g.description}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {n > 0 ? (
                      <span className={`rounded-full ${a.color.soft} px-2 py-0.5 text-[11px] font-semibold ${a.color.text}`}>{n} soal</span>
                    ) : g.stage > CURRENT_STAGE ? (
                      <StageBadge stage={g.stage} />
                    ) : (
                      <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-semibold text-muted">
                        {typeCounts ? 'Belum ada soal' : '…'}
                      </span>
                    )}
                    {g.multiplayer && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/5 px-2 py-0.5 text-[11px] font-semibold text-primary">
                        <Users size={11} /> Multiplayer
                      </span>
                    )}
                  </div>
                </div>
              </>
            )
            // Bisa langsung dimainkan jika jenis ini sudah punya soal
            return n > 0 ? (
              <Link
                key={g.name}
                to={`/app/quick-play?${new URLSearchParams({ arena: id, jenis: g.type!, tingkat: difficulty })}`}
                className="card lift group flex items-center gap-3 p-4"
              >
                {body}
                <ChevronRight size={18} className={`shrink-0 ${a.color.text} transition group-hover:translate-x-0.5`} />
              </Link>
            ) : (
              <div key={g.name} className="card flex gap-3 p-4 opacity-70">
                {body}
              </div>
            )
          })}
        </div>
      </section>

      {/* Materi — dari database */}
      {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {!catalog && !error && (
        <div className="flex justify-center py-10 text-muted">
          <Loader2 className="animate-spin" />
        </div>
      )}
      {groups.map((g) => (
        <section key={g.name}>
          <div className="mb-3 flex items-center gap-3">
            <h2 className="text-base font-bold">{g.name}</h2>
            {g.ar && <Arabic className={`text-lg font-semibold ${a.color.text}`}>{g.ar}</Arabic>}
          </div>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
            {g.items.map((t) => {
              const active = topic?.category_slug === t.category_slug
              const n = countFor(t, difficulty)
              return (
                <button
                  key={t.category_slug}
                  onClick={() => setTopic(active ? null : t)}
                  aria-pressed={active}
                  className={`card lift flex flex-col items-start gap-1 p-3.5 text-left ${active ? `ring-2 ${a.color.ring}` : ''}`}
                >
                  {t.category_name_ar && <Arabic className="w-full text-right text-lg font-semibold text-primary">{t.category_name_ar}</Arabic>}
                  <span className="text-xs font-medium text-muted">{t.category_name}</span>
                  <span className={`text-[11px] font-semibold ${n ? a.color.text : 'text-muted/70'}`}>
                    {n ? `${n} soal ${DIFFICULTIES.find((d) => d.id === difficulty)?.label}` : 'Belum ada soal'}
                  </span>
                </button>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
