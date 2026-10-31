import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, Target } from 'lucide-react'
import { api, type ChallengeRow, type Mission } from '../lib/api'
import { errorMessage } from '../lib/supabase'
import ChallengeCard from '../components/ChallengeCard'
import MissionCard from '../components/MissionCard'

export default function MissionsPage() {
  const [missions, setMissions] = useState<Mission[] | null>(null)
  const [challenges, setChallenges] = useState<ChallengeRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    api.myMissions().then(setMissions).catch((e) => setError(errorMessage(e)))
  }, [])
  useEffect(() => {
    load()
    api.myChallenges().then(setChallenges).catch(() => setChallenges([]))
  }, [load])

  const group = (p: Mission['period']) => missions?.filter((m) => m.period === p) ?? []

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-primary">
          <Target /> Misi & Tantangan
        </h1>
        <p className="mt-1 text-sm text-muted">Misi harian berganti setiap pukul 00.00 WIB, misi mingguan setiap Senin. Selesaikan lalu klaim XP-nya.</p>
      </div>
      {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {!missions && !error && <Loader2 className="mx-auto animate-spin text-primary" />}
      {missions &&
        (['daily', 'weekly'] as const).map((p) => (
          <section key={p}>
            <h2 className="mb-3 font-bold">{p === 'daily' ? 'Misi Harian' : 'Misi Mingguan'}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {group(p).map((m) => (
                <MissionCard key={m.code} m={m} onClaimed={load} />
              ))}
            </div>
          </section>
        ))}
      <section>
        <h2 className="mb-3 font-bold">Tantangan dari Guru</h2>
        <div className="space-y-3">
          {challenges === null && <p className="card p-4 text-sm text-muted">Memuat…</p>}
          {challenges?.length === 0 && (
            <p className="card p-4 text-sm text-muted">
              Belum ada. Gabung kelas di{' '}
              <Link to="/app/kelas" className="font-semibold text-primary">
                Kelas Saya
              </Link>{' '}
              agar tantangan dari ustadz/ustadzah muncul di sini.
            </p>
          )}
          {challenges
            ?.slice()
            .sort((x, y) => Number(x.completed) - Number(y.completed))
            .map((c) => <ChallengeCard key={c.id} c={c} />)}
        </div>
      </section>
    </div>
  )
}
