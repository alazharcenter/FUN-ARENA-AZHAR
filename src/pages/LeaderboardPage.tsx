import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Loader2, Trophy } from 'lucide-react'
import { api, type LeaderboardRow } from '../lib/api'
import { errorMessage } from '../lib/supabase'

const PERIODS = [
  { id: 'today', label: 'Hari ini' },
  { id: 'week', label: 'Minggu ini' },
  { id: 'all', label: 'Keseluruhan' },
] as const

export default function LeaderboardPage() {
  const [period, setPeriod] = useState<'today' | 'week' | 'all'>('week')
  const [rows, setRows] = useState<{ period: string; data: LeaderboardRow[] } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    api
      .leaderboard(period)
      .then((data) => alive && (setRows({ period, data }), setError(null)))
      .catch((e) => alive && setError(errorMessage(e)))
    return () => {
      alive = false
    }
  }, [period])

  const data = rows?.period === period ? rows.data : null
  const top = data?.filter((r) => r.rank <= 50) ?? []
  const meOutside = data?.find((r) => r.is_me && r.rank > 50)

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-primary">
          <Trophy className="text-gold" /> Leaderboard
        </h1>
        <p className="mt-1 text-sm text-muted">Total skor dari semua permainan di lembagamu (waktu WIB).</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {PERIODS.map((p) => (
          <button
            key={p.id}
            onClick={() => setPeriod(p.id)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${period === p.id ? 'bg-primary text-white' : 'bg-white text-muted ring-1 ring-line hover:bg-stone-50'}`}
          >
            {p.label}
          </button>
        ))}
        <Link to="/app/kelas" className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-primary ring-1 ring-line hover:bg-stone-50">
          Peringkat kelas →
        </Link>
      </div>

      {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {!data && !error && (
        <div className="flex justify-center py-16 text-primary">
          <Loader2 className="animate-spin" />
        </div>
      )}
      {data && top.length === 0 && <p className="card p-8 text-center text-sm text-muted">Belum ada skor pada periode ini. Ayo main!</p>}

      {top.length > 0 && (
        <ol className="card divide-y divide-line">
          {top.map((r) => (
            <li key={r.user_id} className={`flex items-center gap-3 px-4 py-3 ${r.is_me ? 'bg-primary/5' : ''}`}>
              <span
                className={`grid size-8 shrink-0 place-items-center rounded-full text-sm font-extrabold ${
                  r.rank === 1 ? 'bg-gold text-white' : r.rank === 2 ? 'bg-stone-300 text-white' : r.rank === 3 ? 'bg-orange-300 text-white' : 'bg-stone-100 text-muted'
                }`}
              >
                {r.rank}
              </span>
              <span className={`min-w-0 flex-1 truncate ${r.is_me ? 'font-bold text-primary' : 'font-medium'}`}>
                {r.nickname} {r.is_me && '(kamu)'}
              </span>
              <span className="text-xs text-muted">{r.games} permainan</span>
              <span className="w-20 text-right font-bold tabular-nums">{r.total_score.toLocaleString('id-ID')}</span>
            </li>
          ))}
        </ol>
      )}
      {meOutside && (
        <p className="card p-4 text-sm">
          Posisimu: <b>#{meOutside.rank}</b> dengan {meOutside.total_score.toLocaleString('id-ID')} poin.
        </p>
      )}
    </div>
  )
}
