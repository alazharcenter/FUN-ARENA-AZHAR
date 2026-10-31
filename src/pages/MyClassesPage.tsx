import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { LogOut, School, Users } from 'lucide-react'
import { api, type ChallengeRow, type ClassRow, type LeaderboardRow } from '../lib/api'
import { DIFFICULTY_LABEL } from '../lib/arenas'
import { errorMessage } from '../lib/supabase'
import ChallengeCard from '../components/ChallengeCard'

function ClassBoard({ cls }: { cls: ClassRow }) {
  const [rows, setRows] = useState<LeaderboardRow[] | null>(null)
  useEffect(() => {
    api.classLeaderboard(cls.id, 'week').then(setRows).catch(() => setRows([]))
  }, [cls.id])
  return (
    <ol className="mt-3 space-y-1">
      {rows?.slice(0, 5).map((r) => (
        <li key={r.user_id} className={`flex items-center gap-2 rounded-lg px-2 py-1 text-sm ${r.is_me ? 'bg-primary/5 font-bold' : ''}`}>
          <span className="w-5 text-right text-xs text-muted">{r.rank}</span>
          <span className="flex-1 truncate">{r.nickname}</span>
          <span className="tabular-nums">{r.total_score}</span>
        </li>
      ))}
      {rows?.length === 0 && <li className="text-xs text-muted">Belum ada skor minggu ini.</li>}
    </ol>
  )
}

export default function MyClassesPage() {
  const [classes, setClasses] = useState<ClassRow[] | null>(null)
  const [challenges, setChallenges] = useState<ChallengeRow[]>([])
  const [code, setCode] = useState('')
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const load = useCallback(() => {
    api.myClasses().then(setClasses).catch(() => setClasses([]))
    api.myChallenges().then(setChallenges).catch(() => setChallenges([]))
  }, [])
  useEffect(load, [load])

  async function join(e: FormEvent) {
    e.preventDefault()
    try {
      const c = await api.joinClass(code)
      setMsg({ ok: true, text: `Berhasil bergabung ke ${c.name}.` })
      setCode('')
      load()
    } catch (err) {
      setMsg({ ok: false, text: errorMessage(err) })
    }
  }

  async function leave(c: ClassRow) {
    if (!confirm(`Keluar dari kelas ${c.name}?`)) return
    await api.leaveClass(c.id).catch(() => {})
    load()
  }

  const joined = classes?.filter((c) => !c.is_manager) ?? []
  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-primary">
          <School /> Kelas Saya
        </h1>
        <p className="mt-1 text-sm text-muted">Gabung kelas dengan kode dari ustadz/ustadzah untuk mendapat tantangan kelas & peringkat kelas.</p>
      </div>

      <form onSubmit={join} className="card flex flex-col gap-3 p-5 sm:flex-row sm:items-end">
        <label className="flex-1">
          <span className="mb-1.5 block text-sm font-bold">Kode kelas</span>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
            placeholder="Contoh: K7A2XY"
            className="w-full rounded-xl border border-line px-4 py-3 font-mono text-lg font-bold tracking-widest uppercase outline-none focus:border-primary"
          />
        </label>
        <button disabled={code.length !== 6} className="rounded-xl bg-primary px-6 py-3 font-bold text-white disabled:opacity-40">
          Gabung Kelas
        </button>
      </form>
      {msg && <p className={`rounded-xl p-3 text-sm ${msg.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{msg.text}</p>}

      <section>
        <h2 className="mb-3 text-base font-bold">Tantangan Aktif</h2>
        <div className="space-y-3">
          {challenges.length === 0 && <p className="card p-5 text-sm text-muted">Belum ada tantangan aktif.</p>}
          {challenges.map((c) => (
            <ChallengeCard key={c.id} c={c} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-base font-bold">Kelas yang Kamu Ikuti</h2>
        {classes && joined.length === 0 && <p className="card p-5 text-sm text-muted">Kamu belum bergabung ke kelas mana pun.</p>}
        <div className="grid gap-4 md:grid-cols-2">
          {joined.map((c) => (
            <div key={c.id} className="card p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold">{c.name}</p>
                  <p className="text-xs text-muted">
                    {c.teacher_name} · {DIFFICULTY_LABEL[c.level]} · <Users size={12} className="inline" /> {c.members} santri
                  </p>
                </div>
                <button onClick={() => leave(c)} className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted hover:bg-slate-100">
                  <LogOut size={14} /> Keluar
                </button>
              </div>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-muted">Peringkat minggu ini</p>
              <ClassBoard cls={c} />
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
