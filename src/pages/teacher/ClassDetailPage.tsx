import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Copy, Download, Loader2, RefreshCw, Trash2, UserMinus, X } from 'lucide-react'
import { api, type ChallengeRow, type ClassMember, type ClassOverview, type LeaderboardRow, type StudentProgress } from '../../lib/api'
import { ARENA_BY_DB, DIFFICULTY_LABEL } from '../../lib/arenas'
import { downloadCsv } from '../../lib/csv'
import { levelProgress } from '../../lib/level'
import { errorMessage } from '../../lib/supabase'
import { Arabic, ProgressBar } from '../../components/ui'
import { challengeSource } from '../../lib/challenges'

type Tab = 'santri' | 'materi' | 'peringkat' | 'tantangan'

const fmtDate = (d: string | null) => (d ? new Date(d + (d.length === 10 ? 'T00:00:00' : '')).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '–')

function accColor(a: number | null) {
  if (a === null) return 'text-muted'
  if (a >= 80) return 'text-emerald-600'
  if (a >= 60) return 'text-amber-600'
  return 'text-red-600'
}

function StudentDrawer({ student, onClose }: { student: ClassMember; onClose: () => void }) {
  const [data, setData] = useState<StudentProgress | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    api.studentProgress(student.user_id).then(setData).catch((e) => setError(errorMessage(e)))
  }, [student.user_id])
  const lvl = levelProgress(student.xp)
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-ink/40" onClick={onClose} role="dialog" aria-modal="true">
      <div className="h-full w-full max-w-md overflow-y-auto bg-bg p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xl font-extrabold text-primary">{student.nickname}</p>
            <p className="text-sm text-muted">{student.full_name}</p>
          </div>
          <button onClick={onClose} aria-label="Tutup" className="rounded-lg p-2 hover:bg-stone-100">
            <X size={18} />
          </button>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          {[
            ['Level', lvl.level],
            ['Akurasi', student.accuracy === null ? '–' : `${student.accuracy}%`],
            ['Streak', `${student.streak} hr`],
          ].map(([k, v]) => (
            <div key={k} className="card p-3">
              <p className="text-[11px] text-muted">{k}</p>
              <p className="font-extrabold">{v}</p>
            </div>
          ))}
        </div>
        {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
        {!data && !error && <Loader2 className="mx-auto mt-8 animate-spin text-primary" />}
        {data && (
          <>
            <h3 className="mt-6 mb-2 text-sm font-bold">Penguasaan per materi (terlemah di atas)</h3>
            {data.topics.length === 0 && <p className="text-sm text-muted">Belum ada data.</p>}
            <div className="space-y-2">
              {data.topics.map((t) => (
                <div key={t.name} className="card p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold">
                      {t.name} {t.name_ar && <Arabic className="text-xs text-muted">{t.name_ar}</Arabic>}
                    </span>
                    <span className={`font-bold ${accColor(t.accuracy)}`}>{t.accuracy}%</span>
                  </div>
                  <p className="text-[11px] text-muted">
                    {t.group_name} · {t.correct}/{t.answered} benar
                  </p>
                  <div className="mt-1.5">
                    <ProgressBar value={t.accuracy} max={100} className={t.accuracy >= 80 ? 'bg-emerald-500' : t.accuracy >= 60 ? 'bg-amber-400' : 'bg-red-500'} />
                  </div>
                </div>
              ))}
            </div>
            <h3 className="mt-6 mb-2 text-sm font-bold">Permainan terakhir</h3>
            <div className="card divide-y divide-line">
              {data.recent.length === 0 && <p className="p-3 text-sm text-muted">Belum ada permainan.</p>}
              {data.recent.map((r, i) => (
                <div key={i} className="flex items-center justify-between p-3 text-sm">
                  <span>
                    {r.category_name}
                    <span className="block text-[11px] text-muted">
                      {ARENA_BY_DB[r.arena].name} · {r.ended_at ? new Date(r.ended_at).toLocaleDateString('id-ID') : ''}
                    </span>
                  </span>
                  <span className="text-right font-semibold">
                    {r.score}
                    <span className="block text-[11px] font-normal text-muted">
                      {r.correct_count}/{r.answered_count} benar
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function ClassDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState<ClassOverview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('santri')
  const [selected, setSelected] = useState<ClassMember | null>(null)
  const [board, setBoard] = useState<LeaderboardRow[] | null>(null)
  const [period, setPeriod] = useState<'today' | 'week' | 'all'>('week')
  const [challenges, setChallenges] = useState<ChallengeRow[]>([])
  const [copied, setCopied] = useState(false)

  const load = useCallback(() => {
    api.classOverview(id).then(setData).catch((e) => setError(errorMessage(e)))
  }, [id])
  useEffect(load, [load])
  useEffect(() => {
    api.classLeaderboard(id, period).then(setBoard).catch(() => setBoard([]))
  }, [id, period])
  useEffect(() => {
    api.myChallenges(true).then((all) => setChallenges(all.filter((c) => c.class_id === id || c.class_id === null))).catch(() => {})
  }, [id])

  if (error) return <p className="card p-6 text-center text-sm text-red-700">{error}</p>
  if (!data) return <Loader2 className="mx-auto mt-16 animate-spin text-primary" />
  const c = data.class

  async function rename() {
    const name = prompt('Nama kelas baru:', c.name)
    if (!name) return
    await api.updateClass(c.id, name, c.level).catch((e) => alert(errorMessage(e)))
    load()
  }
  async function newCode() {
    if (!confirm('Buat kode kelas baru? Kode lama tidak bisa dipakai lagi.')) return
    await api.updateClass(c.id, c.name, c.level, true).catch((e) => alert(errorMessage(e)))
    load()
  }
  async function remove() {
    if (!confirm(`Hapus kelas ${c.name}? Santri tidak dihapus, hanya keanggotaan kelasnya.`)) return
    await api.deleteClass(c.id)
    navigate('/guru/kelas')
  }
  async function kick(m: ClassMember) {
    if (!confirm(`Keluarkan ${m.nickname} dari kelas?`)) return
    await api.removeMember(c.id, m.user_id).catch((e) => alert(errorMessage(e)))
    load()
  }
  function exportCsv() {
    downloadCsv(
      `kelas-${c.name.replace(/\s+/g, '-').toLowerCase()}.csv`,
      ['Nickname', 'Nama lengkap', 'Level', 'XP', 'Permainan', 'Dijawab', 'Benar', 'Akurasi (%)', 'Streak', 'Terakhir main', 'Skor minggu ini'],
      data!.members.map((m) => [m.nickname, m.full_name, levelProgress(m.xp).level, m.xp, m.games, m.answered, m.correct, m.accuracy ?? '', m.streak, m.last_played_on ?? '', m.week_score]),
    )
  }

  const avgAcc = (() => {
    const ans = data.members.reduce((n, m) => n + m.answered, 0)
    return ans ? Math.round((100 * data.members.reduce((n, m) => n + m.correct, 0)) / ans) : null
  })()
  const activeWeek = data.members.filter((m) => m.week_score > 0).length

  return (
    <div className="space-y-6">
      <Link to="/guru/kelas" className="inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-primary">
        <ArrowLeft size={16} /> Semua kelas
      </Link>

      <section className="card grid gap-5 p-5 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-primary">{c.name}</h1>
          <p className="text-sm text-muted">
            {DIFFICULTY_LABEL[c.level]} · Guru: {c.teacher_name}
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <button onClick={rename} className="rounded-lg border border-line px-3 py-1.5 font-semibold hover:bg-stone-50">Ubah nama</button>
            <button onClick={newCode} className="flex items-center gap-1 rounded-lg border border-line px-3 py-1.5 font-semibold hover:bg-stone-50">
              <RefreshCw size={12} /> Kode baru
            </button>
            <button onClick={remove} className="flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 font-semibold text-red-600 hover:bg-red-50">
              <Trash2 size={12} /> Hapus kelas
            </button>
          </div>
        </div>
        <div className="rounded-2xl bg-primary/5 p-4 text-center">
          <p className="text-xs font-semibold text-muted">Kode kelas untuk santri</p>
          <p className="font-mono text-4xl font-extrabold tracking-[0.2em] text-primary">{c.join_code}</p>
          <button
            onClick={async () => {
              await navigator.clipboard.writeText(c.join_code).catch(() => {})
              setCopied(true)
              setTimeout(() => setCopied(false), 1500)
            }}
            className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-primary"
          >
            <Copy size={12} /> {copied ? 'Disalin' : 'Salin'}
          </button>
          <p className="mt-1 text-[11px] text-muted">Santri: menu Kelas Saya → Gabung Kelas</p>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ['Santri', data.members.length],
          ['Aktif minggu ini', activeWeek],
          ['Rata-rata akurasi', avgAcc === null ? '–' : `${avgAcc}%`],
          ['Materi perlu diulang', data.weak_topics.filter((w) => w.accuracy < 60).length],
        ].map(([k, v]) => (
          <div key={k} className="card p-4">
            <p className="text-xs text-muted">{k}</p>
            <p className="text-xl font-extrabold">{v}</p>
          </div>
        ))}
      </section>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ['santri', 'Santri'],
            ['materi', 'Materi perlu diulang'],
            ['peringkat', 'Peringkat kelas'],
            ['tantangan', 'Tantangan'],
          ] as const
        ).map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)} className={`rounded-full px-4 py-2 text-sm font-semibold ${tab === k ? 'bg-primary text-white' : 'bg-white text-muted ring-1 ring-line hover:bg-stone-50'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'santri' && (
        <section className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="text-sm font-bold">{data.members.length} santri</p>
            <button onClick={exportCsv} disabled={!data.members.length} className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-semibold hover:bg-stone-50 disabled:opacity-40">
              <Download size={14} /> Ekspor CSV
            </button>
          </div>
          {data.members.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted">Belum ada santri. Bagikan kode kelas {c.join_code}.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="bg-stone-50 text-left text-xs text-muted">
                  <tr>
                    <th className="px-4 py-2">Santri</th>
                    <th className="px-2 py-2 text-right">Level</th>
                    <th className="px-2 py-2 text-right">Main</th>
                    <th className="px-2 py-2 text-right">Akurasi</th>
                    <th className="px-2 py-2 text-right">Streak</th>
                    <th className="px-2 py-2 text-right">Terakhir</th>
                    <th className="px-2 py-2 text-right">Skor minggu ini</th>
                    <th className="px-2 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {data.members.map((m) => (
                    <tr key={m.user_id} className="cursor-pointer hover:bg-stone-50" onClick={() => setSelected(m)}>
                      <td className="px-4 py-2.5">
                        <span className="font-semibold">{m.nickname}</span>
                        <span className="block text-[11px] text-muted">{m.full_name}</span>
                      </td>
                      <td className="px-2 text-right">{levelProgress(m.xp).level}</td>
                      <td className="px-2 text-right">{m.games}</td>
                      <td className={`px-2 text-right font-bold ${accColor(m.accuracy)}`}>{m.accuracy === null ? '–' : `${m.accuracy}%`}</td>
                      <td className="px-2 text-right">{m.streak}</td>
                      <td className="px-2 text-right text-muted">{fmtDate(m.last_played_on)}</td>
                      <td className="px-2 text-right font-semibold">{m.week_score}</td>
                      <td className="px-2 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            kick(m)
                          }}
                          aria-label={`Keluarkan ${m.nickname}`}
                          className="rounded-lg p-1.5 text-muted hover:bg-red-50 hover:text-red-600"
                        >
                          <UserMinus size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {tab === 'materi' && (
        <section className="space-y-3">
          <p className="text-sm text-muted">Materi dengan akurasi terendah di kelas ini (minimal 3 jawaban). Cocok untuk diulang di kelas atau dijadikan tantangan.</p>
          {data.weak_topics.length === 0 && <p className="card p-6 text-center text-sm text-muted">Belum cukup data. Minta santri bermain beberapa soal dulu.</p>}
          {data.weak_topics.map((w) => (
            <div key={w.slug} className="card p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-bold">
                    {w.name} {w.name_ar && <Arabic className="text-sm text-muted">{w.name_ar}</Arabic>}
                  </p>
                  <p className="text-xs text-muted">
                    {ARENA_BY_DB[w.arena].name} · {w.group_name} · {w.correct}/{w.answered} benar · {w.students} santri
                  </p>
                </div>
                <span className={`text-2xl font-extrabold ${accColor(w.accuracy)}`}>{w.accuracy}%</span>
              </div>
              <div className="mt-2">
                <ProgressBar value={w.accuracy} max={100} className={w.accuracy >= 80 ? 'bg-emerald-500' : w.accuracy >= 60 ? 'bg-amber-400' : 'bg-red-500'} />
              </div>
              <Link to={`/guru/tantangan?kelas=${c.id}&arena=${w.arena}&kategori=${w.slug}`} className="mt-2 inline-block text-xs font-semibold text-primary hover:underline">
                Buat tantangan untuk materi ini →
              </Link>
            </div>
          ))}
        </section>
      )}

      {tab === 'peringkat' && (
        <section className="space-y-3">
          <div className="flex gap-2">
            {(['today', 'week', 'all'] as const).map((p) => (
              <button key={p} onClick={() => setPeriod(p)} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${period === p ? 'bg-primary text-white' : 'bg-white ring-1 ring-line'}`}>
                {p === 'today' ? 'Hari ini' : p === 'week' ? 'Minggu ini' : 'Keseluruhan'}
              </button>
            ))}
          </div>
          <ol className="card divide-y divide-line">
            {board?.map((r) => (
              <li key={r.user_id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                <span className="w-6 text-right font-bold text-muted">{r.rank}</span>
                <span className="flex-1 font-semibold">{r.nickname}</span>
                <span className="text-xs text-muted">{r.games} permainan</span>
                <span className="w-16 text-right font-bold">{r.total_score}</span>
              </li>
            ))}
            {board?.length === 0 && <li className="p-4 text-sm text-muted">Belum ada santri.</li>}
          </ol>
        </section>
      )}

      {tab === 'tantangan' && (
        <section className="space-y-3">
          <Link to={`/guru/tantangan?kelas=${c.id}`} className="inline-block rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white">
            + Buat tantangan untuk kelas ini
          </Link>
          {challenges.length === 0 && <p className="card p-6 text-center text-sm text-muted">Belum ada tantangan.</p>}
          {challenges.map((ch) => (
            <div key={ch.id} className="card p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="font-bold">{ch.title}</p>
                <span className="text-xs text-muted">
                  {fmtDate(ch.starts_on)} – {fmtDate(ch.ends_on)}
                </span>
              </div>
              <p className="text-xs text-muted">
                {ch.target_count} soal · {challengeSource(ch)} · +{ch.xp_reward} XP · {ch.class_name ?? 'Semua santri lembaga'}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <ProgressBar value={ch.completions} max={Math.max(ch.audience, 1)} className="bg-emerald-500" />
                <span className="shrink-0 text-xs font-semibold">
                  {ch.completions}/{ch.audience} selesai
                </span>
              </div>
            </div>
          ))}
        </section>
      )}

      {selected && <StudentDrawer student={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
