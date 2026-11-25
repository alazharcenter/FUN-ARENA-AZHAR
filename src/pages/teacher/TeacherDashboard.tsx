import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, ChevronRight, GraduationCap, Plus, Target, Users } from 'lucide-react'
import { api, type ChallengeRow, type ClassRow } from '../../lib/api'
import { DIFFICULTY_LABEL } from '../../lib/arenas'
import { useAuth } from '../../lib/useAuth'
import { ROLE_LABEL } from '../../lib/roles'

export default function TeacherDashboard() {
  const { profile } = useAuth()
  const [classes, setClasses] = useState<ClassRow[] | null>(null)
  const [mine, setMine] = useState<number | null>(null)
  const [challenges, setChallenges] = useState<ChallengeRow[]>([])

  useEffect(() => {
    api.myClasses().then((c) => setClasses(c.filter((x) => x.is_manager))).catch(() => setClasses([]))
    api.bankQuestions({ source: 'mine' }).then((r) => setMine(r.length)).catch(() => setMine(0))
    api.myChallenges(true).then(setChallenges).catch(() => {})
  }, [])

  const [today] = useState(() => new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10)) // tanggal WIB
  const active = challenges.filter((c) => c.starts_on <= today && c.ends_on >= today)
  const students = classes?.reduce((n, c) => n + c.members, 0) ?? 0

  const actions = [
    { to: '/guru/kelas', label: 'Buat kelas', icon: Users },
    { to: '/guru/bank-soal', label: 'Tambah soal', icon: BookOpen },
    { to: '/guru/tantangan', label: 'Buat tantangan', icon: Target },
    { to: '/app/lobby', label: 'Room Mode Kelas', icon: GraduationCap },
  ]

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-primary p-6 text-white sm:p-8">
        <p className="text-sm text-white/70">{profile ? ROLE_LABEL[profile.role] : 'Guru'}</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">Assalamu'alaikum, {profile?.full_name || profile?.nickname}</h1>
        <p className="mt-1 text-sm text-white/75">Kelola kelas, soal, dan tantangan — lalu pantau perkembangan santri.</p>
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ['Kelas', classes?.length ?? '–'],
          ['Santri di kelas Anda', classes ? students : '–'],
          ['Soal lembaga', mine ?? '–'],
          ['Tantangan aktif', active.length],
        ].map(([k, v]) => (
          <div key={k} className="card p-4">
            <p className="text-xs text-muted">{k}</p>
            <p className="text-2xl font-extrabold">{v}</p>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {actions.map(({ to, label, icon: Icon }) => (
          <Link key={label} to={to} className="card lift flex items-center gap-3 p-4 text-sm font-bold text-primary">
            <span className="grid size-10 place-items-center rounded-xl bg-primary/5">
              <Icon size={18} />
            </span>
            {label}
          </Link>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-bold">Kelas Anda</h2>
            <Link to="/guru/kelas" className="flex items-center text-xs font-semibold text-primary">
              Kelola <ChevronRight size={14} />
            </Link>
          </div>
          {classes?.length === 0 && (
            <Link to="/guru/kelas" className="card flex items-center gap-2 p-5 text-sm font-semibold text-primary">
              <Plus size={16} /> Buat kelas pertama
            </Link>
          )}
          <div className="space-y-2">
            {classes?.map((c) => (
              <Link key={c.id} to={`/guru/kelas/${c.id}`} className="card flex items-center gap-3 p-4 hover:bg-stone-50">
                <div className="min-w-0 flex-1">
                  <p className="font-bold">{c.name}</p>
                  <p className="text-xs text-muted">
                    {DIFFICULTY_LABEL[c.level]} · {c.members} santri · kode <b className="font-mono">{c.join_code}</b>
                  </p>
                </div>
                <span className="text-xs font-semibold text-primary">Statistik →</span>
              </Link>
            ))}
          </div>
        </section>
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-bold">Tantangan aktif</h2>
            <Link to="/guru/tantangan" className="flex items-center text-xs font-semibold text-primary">
              Semua <ChevronRight size={14} />
            </Link>
          </div>
          {active.length === 0 && <p className="card p-5 text-sm text-muted">Tidak ada tantangan aktif.</p>}
          <div className="space-y-2">
            {active.map((c) => (
              <div key={c.id} className="card p-4">
                <p className="font-bold">{c.title}</p>
                <p className="text-xs text-muted">
                  {c.class_name ?? 'Semua santri'} · {c.completions}/{c.audience} selesai · s.d. {c.ends_on}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
