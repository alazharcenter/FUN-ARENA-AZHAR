import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, History, Loader2 } from 'lucide-react'
import { api, type DbArena, type HistoryRow } from '../lib/api'
import { ARENA_BY_DB } from '../lib/arenas'
import { errorMessage } from '../lib/supabase'
import { ArenaIcon } from '../components/ui'

const PAGE = 15

export default function HistoryPage() {
  const [arena, setArena] = useState<DbArena | null>(null)
  const [page, setPage] = useState(0)
  const [rows, setRows] = useState<{ key: string; data: HistoryRow[] } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const key = `${arena}:${page}`

  useEffect(() => {
    let alive = true
    api
      .myHistory(PAGE, page * PAGE, arena)
      .then((data) => alive && setRows({ key, data }))
      .catch((e) => alive && setError(errorMessage(e)))
    return () => {
      alive = false
    }
  }, [arena, page, key])

  const data = rows?.key === key ? rows.data : null
  const total = data?.[0]?.total ?? 0
  const pages = Math.max(1, Math.ceil(total / PAGE))

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-primary">
        <History /> Riwayat Permainan
      </h1>
      <div className="flex flex-wrap gap-2">
        {([null, 'mufrodat', 'qowaid', 'snake_ladder'] as const).map((a) => (
          <button
            key={a ?? 'all'}
            onClick={() => (setArena(a), setPage(0))}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${arena === a ? 'bg-primary text-white' : 'bg-white text-muted ring-1 ring-line hover:bg-slate-50'}`}
          >
            {a ? ARENA_BY_DB[a].name : 'Semua'}
          </button>
        ))}
      </div>
      {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <section className="card divide-y divide-line">
        {!data && !error && <Loader2 className="mx-auto my-10 animate-spin text-primary" />}
        {data?.length === 0 && <p className="p-8 text-center text-sm text-muted">Belum ada permainan.</p>}
        {data?.map((h) => {
          const a = ARENA_BY_DB[h.arena]
          // Hasil detail hanya tersedia untuk permainan sendiri (Quick Play, tantangan, ular tangga lokal)
          const linkable = h.mode !== 'Quiz Battle' && h.mode !== 'Ular Tangga online'
          const body = (
            <>
              <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${a.color.soft} ${a.color.text}`}>
                <ArenaIcon arena={a.id} size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{h.category_name ?? a.name}</p>
                <p className="text-xs text-muted">
                  {h.mode} · {h.ended_at ? new Date(h.ended_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                </p>
              </div>
              <div className="text-right text-sm">
                <p className="font-bold tabular-nums">{h.score}</p>
                <p className="text-xs text-muted">
                  {h.correct_count}/{h.answered_count} benar · +{h.xp_earned} XP
                </p>
              </div>
              {linkable && <ChevronRight size={16} className="shrink-0 text-muted" />}
            </>
          )
          return linkable ? (
            <Link key={h.session_id} to={`/app/hasil/${h.session_id}`} className="flex items-center gap-3 p-4 hover:bg-slate-50">
              {body}
            </Link>
          ) : (
            <div key={h.session_id} className="flex items-center gap-3 p-4">
              {body}
            </div>
          )
        })}
      </section>
      {total > PAGE && (
        <div className="flex items-center justify-center gap-3 text-sm">
          <button disabled={page === 0} onClick={() => setPage(page - 1)} className="flex items-center gap-1 rounded-lg px-3 py-2 font-semibold disabled:opacity-30">
            <ChevronLeft size={16} /> Sebelumnya
          </button>
          <span className="text-muted">
            {page + 1} / {pages}
          </span>
          <button disabled={page + 1 >= pages} onClick={() => setPage(page + 1)} className="flex items-center gap-1 rounded-lg px-3 py-2 font-semibold disabled:opacity-30">
            Berikutnya <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  )
}
