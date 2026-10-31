import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDownRight, ArrowUpRight, BarChart3, Loader2, Minus } from 'lucide-react'
import { api, type MyProgress } from '../lib/api'
import { ARENA_BY_DB } from '../lib/arenas'
import { errorMessage } from '../lib/supabase'
import { Arabic, ProgressBar, RichText } from '../components/ui'

const pct = (c: number, a: number) => (a ? Math.round((100 * c) / a) : null)
const dayLabel = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' })

function Delta({ now, before, unit = '' }: { now: number; before: number; unit?: string }) {
  const diff = now - before
  if (diff === 0) return <span className="flex items-center gap-0.5 text-xs text-muted"><Minus size={12} /> sama</span>
  const up = diff > 0
  return (
    <span className={`flex items-center gap-0.5 text-xs font-semibold ${up ? 'text-emerald-600' : 'text-muted'}`}>
      {up ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
      {up ? '+' : ''}
      {diff}
      {unit} dari minggu lalu
    </span>
  )
}

// Aktivitas 14 hari: satu seri (soal dijawab per hari), tooltip per batang, tabel untuk pembaca layar
function ActivityChart({ data }: { data: MyProgress['activity'] }) {
  const [hover, setHover] = useState<number | null>(null)
  const max = Math.max(5, ...data.map((d) => d.answered))
  const active = data.filter((d) => d.answered > 0).length
  return (
    <section className="card p-5">
      <div className="flex items-baseline justify-between">
        <h2 className="font-bold">Soal dijawab per hari (14 hari)</h2>
        <span className="text-xs text-muted">{active} hari aktif</span>
      </div>
      <div className="relative mt-4 flex h-40 items-end gap-[2px] border-b border-line" onMouseLeave={() => setHover(null)}>
        {data.map((d, i) => (
          <button
            key={d.date}
            type="button"
            onMouseEnter={() => setHover(i)}
            onFocus={() => setHover(i)}
            onClick={() => setHover(i)}
            aria-label={`${dayLabel(d.date)}: ${d.answered} soal, ${d.correct} benar`}
            className="group relative flex h-full flex-1 items-end"
          >
            <span
              className={`w-full rounded-t-[4px] transition-colors ${hover === i ? 'bg-primary' : 'bg-primary/70'} ${d.answered === 0 ? 'bg-transparent' : ''}`}
              style={{ height: `${(d.answered / max) * 100}%`, minHeight: d.answered ? 3 : 0 }}
            />
          </button>
        ))}
        {hover !== null && (
          <div
            className="pointer-events-none absolute -top-2 z-10 -translate-x-1/2 -translate-y-full rounded-lg bg-ink px-2.5 py-1.5 text-xs whitespace-nowrap text-white shadow-lg"
            style={{ left: `${((hover + 0.5) / data.length) * 100}%` }}
          >
            <b>{dayLabel(data[hover].date)}</b>
            <br />
            {data[hover].answered} soal · {data[hover].correct} benar
          </div>
        )}
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] text-muted">
        <span>{dayLabel(data[0].date)}</span>
        <span>Hari ini</span>
      </div>
      <details className="mt-3 text-xs text-muted">
        <summary className="cursor-pointer">Lihat sebagai tabel</summary>
        <table className="mt-2 w-full">
          <tbody>
            {data.map((d) => (
              <tr key={d.date} className="border-t border-line">
                <td className="py-1">{dayLabel(d.date)}</td>
                <td className="text-right">{d.answered} soal</td>
                <td className="text-right">{d.correct} benar</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </section>
  )
}

export default function ProgressPage() {
  const [data, setData] = useState<MyProgress | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    api.myProgress().then(setData).catch((e) => setError(errorMessage(e)))
  }, [])

  if (error) return <p className="card p-6 text-sm text-red-700">{error}</p>
  if (!data) return <Loader2 className="mx-auto mt-16 animate-spin text-primary" />

  const { compare: c } = data
  const accThis = pct(c.this.correct, c.this.answered)
  const accLast = pct(c.last.correct, c.last.answered)
  const empty = data.skills.every((s) => s.answered === 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-primary">
          <BarChart3 /> Progres Belajar
        </h1>
        <p className="mt-1 text-sm text-muted">Yang penting bukan banyaknya bermain, tetapi rutin dan paham. Pantau kemampuanmu di sini.</p>
      </div>

      {empty && (
        <p className="card p-6 text-center text-sm text-muted">
          Belum ada data. <Link to="/app/quick-play" className="font-semibold text-primary">Main Quick Play</Link> dulu, progresmu akan muncul di sini.
        </p>
      )}

      {/* Minggu ini vs minggu lalu */}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="card p-4">
          <p className="text-xs text-muted">Hari aktif minggu ini</p>
          <p className="text-2xl font-extrabold">{c.this.days}</p>
          <Delta now={c.this.days} before={c.last.days} unit=" hari" />
        </div>
        <div className="card p-4">
          <p className="text-xs text-muted">Soal dijawab</p>
          <p className="text-2xl font-extrabold">{c.this.answered}</p>
          <Delta now={c.this.answered} before={c.last.answered} />
        </div>
        <div className="card p-4">
          <p className="text-xs text-muted">Akurasi</p>
          <p className="text-2xl font-extrabold">{accThis === null ? '–' : `${accThis}%`}</p>
          {accThis !== null && accLast !== null ? <Delta now={accThis} before={accLast} unit="%" /> : <span className="text-xs text-muted">minggu lalu: {accLast === null ? '–' : `${accLast}%`}</span>}
        </div>
        <div className="card p-4">
          <p className="text-xs text-muted">XP minggu ini</p>
          <p className="text-2xl font-extrabold">{c.xp_this}</p>
          <Delta now={c.xp_this} before={c.xp_last} />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Kemampuan */}
        <section className="card p-5">
          <h2 className="font-bold">Kemampuan</h2>
          <div className="mt-4 space-y-4">
            {data.skills.map((s) => (
              <div key={s.group_slug}>
                <div className="flex items-baseline justify-between text-sm">
                  <span className="font-semibold">
                    {s.name} {s.name_ar && <Arabic className="text-base text-muted">{s.name_ar}</Arabic>}
                    <span className="ml-1 text-[11px] font-normal text-muted">{ARENA_BY_DB[s.arena].name}</span>
                  </span>
                  <span className="font-bold tabular-nums">{s.accuracy === null ? '–' : `${s.accuracy}%`}</span>
                </div>
                <div className="mt-1">
                  <ProgressBar value={s.accuracy ?? 0} max={100} className={ARENA_BY_DB[s.arena].color.bg} />
                </div>
                <p className="mt-0.5 text-[11px] text-muted">{s.answered ? `${s.correct}/${s.answered} benar` : 'Belum dilatih'}</p>
              </div>
            ))}
          </div>
        </section>

        <ActivityChart data={data.activity} />
      </div>

      {/* Kosakata */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="font-bold">Kosakata yang sudah dikuasai</h2>
          <p className="text-xs text-muted">Dijawab benar minimal 2 kali dengan ketepatan ≥ 75% · {data.vocab.mastered.length} dari {data.vocab.seen} kata yang pernah muncul</p>
          {data.vocab.mastered.length === 0 && <p className="mt-3 text-sm text-muted">Belum ada. Ulangi Quick Play Mufrodat beberapa kali.</p>}
          <div className="mt-3 flex flex-wrap gap-2" dir="rtl">
            {data.vocab.mastered.map((v) => (
              <span key={v.word} className="rounded-xl bg-emerald-50 px-3 py-1" title={`${v.correct}/${v.answered} benar`}>
                <Arabic className="text-lg text-emerald-800">{v.word}</Arabic>
              </span>
            ))}
          </div>
        </section>
        <section className="card p-5">
          <h2 className="font-bold">Kosakata yang masih sulit</h2>
          <p className="text-xs text-muted">Ketepatan di bawah 50% — pelajari penjelasannya lalu coba lagi.</p>
          <div className="mt-3 space-y-2">
            {data.vocab.difficult.length === 0 && <p className="text-sm text-muted">Tidak ada. Bagus!</p>}
            {data.vocab.difficult.slice(0, 8).map((v) => (
              <div key={v.word} className="rounded-xl bg-red-50/60 p-3">
                <div className="flex items-center justify-between">
                  <Arabic className="text-xl text-primary">{v.word}</Arabic>
                  <span className="text-xs text-muted">
                    {v.correct}/{v.answered} benar
                  </span>
                </div>
                <p className="mt-1 text-xs text-ink">
                  <RichText text={v.explanation} />
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Per materi */}
      {data.topics.length > 0 && (
        <section className="card p-5">
          <h2 className="font-bold">Per materi</h2>
          <div className="mt-3 grid gap-x-8 gap-y-3 md:grid-cols-2">
            {data.topics.map((t) => (
              <div key={t.name}>
                <div className="flex items-baseline justify-between text-sm">
                  <span>
                    {t.name} {t.name_ar && <Arabic className="text-sm text-muted">{t.name_ar}</Arabic>}
                  </span>
                  <span className={`font-bold tabular-nums ${t.accuracy < 50 ? 'text-red-600' : t.accuracy < 75 ? 'text-amber-600' : 'text-emerald-600'}`}>{t.accuracy}%</span>
                </div>
                <div className="mt-1">
                  <ProgressBar value={t.accuracy} max={100} className={t.accuracy < 50 ? 'bg-red-400' : t.accuracy < 75 ? 'bg-amber-400' : 'bg-emerald-500'} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
