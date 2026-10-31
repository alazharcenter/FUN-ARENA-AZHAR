import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Check, CheckCircle2, Home, Loader2, RotateCcw, Star, Target, Trophy, X } from 'lucide-react'
import { api, type SessionResult } from '../lib/api'
import { ARENA_BY_DB, DIFFICULTY_LABEL, GAME_TYPE_LABEL } from '../lib/arenas'
import { levelProgress } from '../lib/level'
import { errorMessage } from '../lib/supabase'
import { Arabic, ArabicMarked, ArenaIcon, ProgressBar, RichText } from '../components/ui'

function praise(accuracy: number) {
  if (accuracy >= 90) return { title: 'Mumtaz!', ar: 'مُمْتَازٌ' }
  if (accuracy >= 70) return { title: 'Jayyid jiddan!', ar: 'جَيِّدٌ جِدًّا' }
  if (accuracy >= 50) return { title: 'Jayyid!', ar: 'جَيِّدٌ' }
  return { title: 'Terus berlatih!', ar: 'وَاصِلِ التَّعَلُّمَ' }
}

export default function ResultPage() {
  const { sessionId = '' } = useParams()
  const [data, setData] = useState<SessionResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.result(sessionId).then(setData).catch((e) => setError(errorMessage(e)))
  }, [sessionId])

  if (error) return <p className="card p-6 text-center text-sm text-red-700">{error}</p>
  if (!data)
    return (
      <div className="flex justify-center py-24 text-primary">
        <Loader2 size={32} className="animate-spin" />
      </div>
    )

  const arena = ARENA_BY_DB[data.arena]
  if (data.status === 'abandoned')
    return (
      <div className="card mx-auto max-w-md p-8 text-center">
        <p className="font-semibold">Permainan diakhiri sebelum ada soal yang dijawab.</p>
        <Link to="/app/quick-play" className="mt-5 inline-block rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white">
          Main lagi
        </Link>
      </div>
    )

  const accuracy = data.answered_count ? Math.round((data.correct_count / data.answered_count) * 100) : 0
  const p = praise(accuracy)
  const lvl = levelProgress(data.total_xp)
  const replay = new URLSearchParams({ arena: arena.id })
  if (data.settings.difficulty) replay.set('tingkat', data.settings.difficulty)
  if (data.settings.game_type) replay.set('jenis', data.settings.game_type)

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Ringkasan */}
      <section className={`relative overflow-hidden rounded-3xl ${arena.color.bg} p-6 text-center text-white sm:p-8`}>
        <div className="absolute -top-16 -right-16 size-56 rounded-full bg-white/10" aria-hidden />
        <Trophy size={40} className="relative mx-auto text-gold" />
        <h1 className="relative mt-3 text-3xl font-extrabold tracking-tight">{p.title}</h1>
        <Arabic className="relative text-2xl text-white/90">{p.ar}</Arabic>
        <p className="relative mt-2 text-sm text-white/80">
          {data.settings.game_type ? GAME_TYPE_LABEL[data.settings.game_type] : arena.name} · {data.settings.category_name ?? 'Semua materi'}
          {data.settings.difficulty ? ` · ${DIFFICULTY_LABEL[data.settings.difficulty]}` : ''}
        </p>
        <p className="relative mt-5 text-5xl font-extrabold tabular-nums">{data.score.toLocaleString('id-ID')}</p>
        <p className="relative text-sm text-white/80">poin</p>
      </section>

      <section className="grid grid-cols-3 gap-3">
        <div className="card p-4 text-center">
          <Target size={20} className="mx-auto text-emerald-600" />
          <p className="mt-1 text-xl font-extrabold">{accuracy}%</p>
          <p className="text-xs text-muted">Akurasi</p>
        </div>
        <div className="card p-4 text-center">
          <Check size={20} className="mx-auto text-sky-600" />
          <p className="mt-1 text-xl font-extrabold">
            {data.correct_count}/{data.answered_count}
          </p>
          <p className="text-xs text-muted">Benar</p>
        </div>
        <div className="card p-4 text-center">
          <Star size={20} className="mx-auto text-amber-500" />
          <p className="mt-1 text-xl font-extrabold">+{data.xp_earned}</p>
          <p className="text-xs text-muted">XP</p>
        </div>
      </section>

      {data.challenge_completed && (
        <p className="card flex items-center gap-2 border-l-4 border-l-emerald-400 p-4 text-sm font-semibold text-emerald-700">
          <CheckCircle2 size={18} /> Tantangan dari guru selesai! Hasilmu sudah tercatat untuk kelas.
        </p>
      )}

      {data.new_badges && data.new_badges.length > 0 && (
        <section className="card p-5 text-center">
          <p className="text-sm font-bold text-primary">Badge baru!</p>
          <div className="mt-3 flex flex-wrap justify-center gap-4">
            {data.new_badges.map((b) => (
              <div key={b.code} className="w-28">
                <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-gold-soft text-3xl">{b.icon}</span>
                <p className="mt-1.5 text-sm font-bold">{b.name}</p>
                <p className="text-[11px] text-muted">{b.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="card p-4">
        {data.xp_halved && (
          <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Kamu sudah mengumpulkan lebih dari 600 XP hari ini, jadi XP permainan ini dihitung setengah. Istirahat dulu juga bagian dari belajar 🙂
          </p>
        )}
        <div className="mb-2 flex items-baseline justify-between text-sm">
          <span className="font-bold">Level {lvl.level}</span>
          <span className="text-xs text-muted">
            {lvl.current} / {lvl.needed} XP menuju level {lvl.level + 1}
          </span>
        </div>
        <ProgressBar value={lvl.current} max={lvl.needed} className="bg-gold" />
      </section>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Link
          to={`/app/quick-play?${replay}`}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl ${arena.color.bg} py-3 text-sm font-bold text-white hover:brightness-110`}
        >
          <RotateCcw size={18} /> Main lagi
        </Link>
        <Link to="/app" className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-line bg-white py-3 text-sm font-bold text-primary hover:bg-slate-50">
          <Home size={18} /> Beranda
        </Link>
      </div>

      {/* Ulasan jawaban */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-base font-bold">
          <ArenaIcon arena={arena.id} size={18} className={arena.color.text} /> Ulasan Jawaban
        </h2>
        <div className="space-y-3">
          {data.review.map((r) => (
            <article key={r.order_index} className={`card border-l-4 p-4 ${r.is_correct ? 'border-l-emerald-400' : 'border-l-red-400'}`}>
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium">
                  <span className="mr-1.5 text-muted">{r.order_index}.</span>
                  <RichText text={r.prompt} />
                </p>
                <span className={`flex shrink-0 items-center gap-1 text-xs font-bold ${r.is_correct ? 'text-emerald-600' : 'text-red-600'}`}>
                  {r.is_correct ? <Check size={14} /> : <X size={14} />} {r.points}
                </span>
              </div>
              {r.prompt_ar && (
                <p className="mt-1 text-right">
                  <ArabicMarked text={r.prompt_ar} className="text-2xl text-primary" />
                </p>
              )}
              <dl className="mt-2 grid gap-1 text-sm">
                <div className="flex flex-wrap gap-x-2">
                  <dt className="text-muted">Jawabanmu:</dt>
                  <dd className={r.is_correct ? 'text-emerald-700' : 'text-red-700'}>
                    {r.your_answer ? <RichText text={r.your_answer} /> : <i>tidak dijawab / waktu habis</i>}
                  </dd>
                </div>
                {!r.is_correct && r.correct_answer && (
                  <div className="flex flex-wrap gap-x-2">
                    <dt className="text-muted">Jawaban benar:</dt>
                    <dd className="text-emerald-700">
                      <RichText text={r.correct_answer} />
                    </dd>
                  </div>
                )}
              </dl>
              <p className="mt-2 rounded-xl bg-slate-50 p-3 text-sm leading-relaxed">
                <RichText text={r.explanation} />
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
