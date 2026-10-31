import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Loader2, Plus, School, Users } from 'lucide-react'
import { api, type ClassRow } from '../../lib/api'
import { DIFFICULTIES, DIFFICULTY_LABEL, type Difficulty } from '../../lib/arenas'
import { errorMessage } from '../../lib/supabase'
import { Choice } from '../../components/form'

export default function ClassesPage() {
  const [classes, setClasses] = useState<ClassRow[] | null>(null)
  const [name, setName] = useState('')
  const [level, setLevel] = useState<Difficulty>('beginner')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = () => api.myClasses().then((c) => setClasses(c.filter((x) => x.is_manager))).catch((e) => setError(errorMessage(e)))
  useEffect(() => {
    load()
  }, [])

  async function create(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await api.createClass(name, level)
      setName('')
      await load()
    } catch (err) {
      setError(errorMessage(err))
    }
    setBusy(false)
  }

  return (
    <div className="space-y-6">
      <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-primary">
        <School /> Manajemen Kelas
      </h1>

      <form onSubmit={create} className="card grid gap-4 p-5 md:grid-cols-[1fr_auto_auto] md:items-end">
        <label>
          <span className="mb-1.5 block text-sm font-bold">Nama kelas baru</span>
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder="Contoh: Kelas 7A Putra" className="w-full rounded-xl border border-line px-4 py-2.5 outline-none focus:border-primary" />
        </label>
        <div>
          <span className="mb-1.5 block text-sm font-bold">Tingkat</span>
          <div className="flex gap-2">
            {DIFFICULTIES.map((d) => (
              <Choice key={d.id} active={level === d.id} onClick={() => setLevel(d.id)}>
                {d.label}
              </Choice>
            ))}
          </div>
        </div>
        <button disabled={busy || name.trim().length < 2} className="flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 font-bold text-white disabled:opacity-40">
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Buat Kelas
        </button>
      </form>
      {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {!classes && !error && <Loader2 className="mx-auto animate-spin text-primary" />}
      {classes?.length === 0 && <p className="card p-6 text-center text-sm text-muted">Belum ada kelas. Buat kelas pertama di atas.</p>}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {classes?.map((c) => (
          <Link key={c.id} to={`/guru/kelas/${c.id}`} className="card lift group p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-bold">{c.name}</p>
                <p className="text-xs text-muted">
                  {DIFFICULTY_LABEL[c.level]} · {c.teacher_name}
                </p>
              </div>
              <ChevronRight size={18} className="text-primary transition group-hover:translate-x-0.5" />
            </div>
            <div className="mt-4 flex items-end justify-between">
              <span className="flex items-center gap-1.5 text-sm text-muted">
                <Users size={16} /> {c.members} santri
              </span>
              <span className="text-right">
                <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted">Kode kelas</span>
                <span className="font-mono text-xl font-extrabold tracking-widest text-primary">{c.join_code}</span>
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
