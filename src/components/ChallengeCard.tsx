import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, Loader2, Play } from 'lucide-react'
import { api, type ChallengeRow } from '../lib/api'
import { ARENA_BY_DB } from '../lib/arenas'
import { challengeSource } from '../lib/challenges'
import { errorMessage } from '../lib/supabase'
import { ArenaIcon } from './ui'

const fmt = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })

// Tantangan untuk santri: tombol mulai langsung membuka Quick Play dari pengaturan tantangan
export default function ChallengeCard({ c }: { c: ChallengeRow }) {
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const arena = ARENA_BY_DB[c.arena ?? 'mufrodat']

  async function start() {
    setBusy(true)
    setError(null)
    try {
      navigate(`/app/main/${await api.startChallenge(c.id)}`)
    } catch (e) {
      setError(errorMessage(e))
      setBusy(false)
    }
  }

  return (
    <div className={`card flex items-center gap-4 p-4 ${c.completed ? 'opacity-75' : ''}`}>
      <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${arena.color.soft} ${arena.color.text}`}>
        <ArenaIcon arena={arena.id} size={20} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-bold">{c.title}</p>
          <span className="shrink-0 text-xs font-semibold text-amber-600">+{c.xp_reward} XP</span>
        </div>
        <p className="truncate text-xs text-muted">
          {c.target_count} soal · {challengeSource(c)} · {c.class_name ?? 'Semua santri'} · s.d. {fmt(c.ends_on)}
        </p>
        {c.description && <p className="mt-0.5 line-clamp-2 text-xs text-ink">{c.description}</p>}
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
      {c.completed ? (
        <span className="flex shrink-0 items-center gap-1 text-xs font-bold text-emerald-600">
          <CheckCircle2 size={16} /> Selesai
        </span>
      ) : (
        <button onClick={start} disabled={busy} className={`flex shrink-0 items-center gap-1.5 rounded-xl ${arena.color.bg} px-3.5 py-2 text-xs font-bold text-white disabled:opacity-60`}>
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />} Mulai
        </button>
      )}
    </div>
  )
}
