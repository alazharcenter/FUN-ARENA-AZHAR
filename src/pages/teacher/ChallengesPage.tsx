import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Loader2, Target, Trash2 } from 'lucide-react'
import { api, type ChallengeRow, type ClassRow, type DbArena, type PackageRow } from '../../lib/api'
import { ARENA_BY_DB, DIFFICULTIES, type Difficulty } from '../../lib/arenas'
import { useCategoryTree } from '../../lib/catalog'
import { errorMessage } from '../../lib/supabase'
import { ProgressBar } from '../../components/ui'
import { Choice, Field } from '../../components/form'
import { challengeSource } from '../../lib/challenges'

const todayWib = () => new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10)
const addDays = (d: string, n: number) => new Date(new Date(d + 'T00:00:00Z').getTime() + n * 864e5).toISOString().slice(0, 10)
const inputClass = 'w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-primary'

export default function ChallengesPage() {
  const [params] = useSearchParams()
  const tree = useCategoryTree()
  const [list, setList] = useState<ChallengeRow[] | null>(null)
  const [classes, setClasses] = useState<ClassRow[]>([])
  const [packages, setPackages] = useState<PackageRow[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [classId, setClassId] = useState(params.get('kelas') ?? '')
  const [sourceKind, setSourceKind] = useState<'materi' | 'paket'>('materi')
  const [arena, setArena] = useState<DbArena>((params.get('arena') as DbArena) || 'mufrodat')
  const [category, setCategory] = useState(params.get('kategori') ?? '')
  const [difficulty, setDifficulty] = useState<Difficulty | ''>('')
  const [packageId, setPackageId] = useState('')
  const [target, setTarget] = useState(10)
  const [xp, setXp] = useState(50)
  const [start, setStart] = useState(todayWib())
  const [end, setEnd] = useState(addDays(todayWib(), 6))
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const load = useCallback(() => {
    api.myChallenges(true).then(setList).catch((e) => setMsg({ ok: false, text: errorMessage(e) }))
  }, [])
  useEffect(() => {
    load()
    api.myClasses().then((c) => setClasses(c.filter((x) => x.is_manager))).catch(() => {})
    api.myPackages().then(setPackages).catch(() => {})
  }, [load])

  async function save() {
    setBusy(true)
    setMsg(null)
    try {
      await api.saveChallenge(null, {
        title,
        description,
        class_id: classId || null,
        arena: sourceKind === 'materi' ? arena : null,
        category_slug: sourceKind === 'materi' ? category || null : null,
        difficulty: sourceKind === 'materi' ? difficulty || null : null,
        package_id: sourceKind === 'paket' ? packageId || null : null,
        target_count: target,
        xp_reward: xp,
        starts_on: start,
        ends_on: end,
      })
      setMsg({ ok: true, text: 'Tantangan dibuat dan langsung tampil di dashboard santri.' })
      setTitle('')
      setDescription('')
      load()
    } catch (e) {
      setMsg({ ok: false, text: errorMessage(e) })
    }
    setBusy(false)
  }

  const today = todayWib()
  return (
    <div className="space-y-6">
      <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-primary">
        <Target /> Manajemen Tantangan
      </h1>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <section className="card space-y-4 p-5">
          <h2 className="font-bold">Tantangan baru</h2>
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} placeholder="Judul, mis. 10 soal I'rab sebelum Jumat" className={inputClass} />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Pesan untuk santri (opsional)" className={inputClass} />
          <Field label="Untuk">
            <select value={classId} onChange={(e) => setClassId(e.target.value)} className={inputClass}>
              <option value="">Semua santri di lembaga</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.members} santri)
                </option>
              ))}
            </select>
          </Field>
          <Field label="Sumber soal">
            <div className="flex gap-2">
              <Choice active={sourceKind === 'materi'} onClick={() => setSourceKind('materi')}>Materi</Choice>
              <Choice active={sourceKind === 'paket'} onClick={() => setSourceKind('paket')}>Paket soal</Choice>
            </div>
          </Field>
          {sourceKind === 'materi' ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <select value={arena} onChange={(e) => (setArena(e.target.value as DbArena), setCategory(''))} className={inputClass} aria-label="Arena">
                <option value="mufrodat">{ARENA_BY_DB.mufrodat.name}</option>
                <option value="qowaid">{ARENA_BY_DB.qowaid.name}</option>
              </select>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass} aria-label="Materi">
                <option value="">Semua materi</option>
                {tree
                  ?.filter((c) => c.arena === arena)
                  .map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.group_name} · {c.name}
                    </option>
                  ))}
              </select>
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty | '')} className={inputClass} aria-label="Tingkat">
                <option value="">Semua tingkat</option>
                {DIFFICULTIES.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <select value={packageId} onChange={(e) => setPackageId(e.target.value)} className={inputClass} aria-label="Paket soal">
              <option value="">— pilih paket —</option>
              {packages.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.question_count} soal)
                </option>
              ))}
            </select>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={<>Jumlah soal: <span className="text-primary">{target}</span></>}>
              <input type="range" min={3} max={30} value={target} onChange={(e) => setTarget(+e.target.value)} className="w-full accent-primary" aria-label="Jumlah soal" />
            </Field>
            <Field label={<>Bonus XP: <span className="text-primary">{xp}</span></>}>
              <input type="range" min={0} max={300} step={10} value={xp} onChange={(e) => setXp(+e.target.value)} className="w-full accent-primary" aria-label="Bonus XP" />
            </Field>
            <Field label="Mulai">
              <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className={inputClass} />
            </Field>
            <Field label="Selesai">
              <input type="date" value={end} min={start} onChange={(e) => setEnd(e.target.value)} className={inputClass} />
            </Field>
          </div>
          {msg && <p className={`rounded-xl p-3 text-sm ${msg.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{msg.text}</p>}
          <button onClick={save} disabled={busy || title.trim().length < 3} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 font-bold text-white disabled:opacity-40">
            {busy && <Loader2 size={16} className="animate-spin" />} Buat Tantangan
          </button>
          <p className="text-xs text-muted">Santri menyelesaikan tantangan dengan menjawab semua soalnya. Bonus XP diberikan sekali per santri.</p>
        </section>

        <section className="space-y-3">
          <h2 className="font-bold">Semua tantangan</h2>
          {!list && <Loader2 className="mx-auto animate-spin text-primary" />}
          {list?.length === 0 && <p className="card p-6 text-center text-sm text-muted">Belum ada tantangan.</p>}
          {list?.map((c) => {
            const status = c.ends_on < today ? 'Selesai' : c.starts_on > today ? 'Terjadwal' : 'Aktif'
            return (
              <div key={c.id} className="card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-bold">{c.title}</p>
                    <p className="text-xs text-muted">
                      {c.class_name ?? 'Semua santri'} · {c.target_count} soal · {challengeSource(c)} · +{c.xp_reward} XP
                    </p>
                    <p className="text-xs text-muted">
                      {c.starts_on} s.d. {c.ends_on}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${status === 'Aktif' ? 'bg-emerald-50 text-emerald-700' : status === 'Terjadwal' ? 'bg-sky-50 text-sky-700' : 'bg-stone-100 text-muted'}`}>{status}</span>
                    <button
                      onClick={async () => {
                        if (confirm(`Hapus tantangan "${c.title}"?`)) {
                          await api.deleteChallenge(c.id).catch((e) => alert(errorMessage(e)))
                          load()
                        }
                      }}
                      aria-label="Hapus tantangan"
                      className="rounded-lg p-1.5 text-muted hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <ProgressBar value={c.completions} max={Math.max(c.audience, 1)} className="bg-emerald-500" />
                  <span className="shrink-0 text-xs font-semibold">
                    {c.completions}/{c.audience} santri selesai
                  </span>
                </div>
              </div>
            )
          })}
        </section>
      </div>
    </div>
  )
}
