import { useState } from 'react'
import { CheckCircle2, Gift, Loader2 } from 'lucide-react'
import { api, type Mission } from '../lib/api'
import { errorMessage } from '../lib/supabase'
import { ProgressBar } from './ui'

// Misi harian/mingguan otomatis. Progres dihitung server; klaim XP juga diperiksa server.
export default function MissionCard({ m, onClaimed }: { m: Mission; onClaimed: () => void }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const done = m.progress >= m.target

  async function claim() {
    setBusy(true)
    setError(null)
    try {
      await api.claimMission(m.code)
      onClaimed()
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={`card p-4 ${m.claimed ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-bold">{m.title}</p>
          <p className="text-xs text-muted">{m.description}</p>
        </div>
        <span className="shrink-0 rounded-full bg-gold-soft px-2 py-0.5 text-xs font-bold text-amber-700">+{m.xp} XP</span>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <div className="flex-1">
          <ProgressBar value={m.progress} max={m.target} className={done ? 'bg-emerald-500' : 'bg-primary'} />
        </div>
        <span className="text-xs font-semibold tabular-nums text-muted">
          {m.progress}/{m.target}
        </span>
        {m.claimed ? (
          <span className="flex items-center gap-1 text-xs font-bold text-emerald-600">
            <CheckCircle2 size={14} /> Diklaim
          </span>
        ) : (
          <button
            onClick={claim}
            disabled={!done || busy}
            className="flex items-center gap-1 rounded-lg bg-gold px-3 py-1.5 text-xs font-bold text-primary-dark disabled:bg-slate-100 disabled:text-muted"
          >
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Gift size={14} />} Klaim
          </button>
        )}
      </div>
      {error && <p className="mt-2 text-xs text-red-700">{error}</p>}
    </div>
  )
}
