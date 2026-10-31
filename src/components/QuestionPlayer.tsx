import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { ArrowRight, Check, Clock, X } from 'lucide-react'
import type { AnswerResult, QuestionOption, ServedQuestion } from '../lib/api'
import { ARENAS, ARENA_OF_GAME_TYPE, DIFFICULTY_LABEL, GAME_TYPE_LABEL } from '../lib/arenas'
import { errorMessage } from '../lib/supabase'
import { Arabic, ArabicMarked, RichText } from './ui'

// Tampilan soal tanpa logika: timer, kartu soal, pilihan / susun kalimat.
// Dipakai QuestionPlayer (Quick Play, ular tangga lokal) dan layar room multiplayer.
export function QuestionView({
  question: q,
  timeLeft,
  locked,
  chosen,
  correctOptionId,
  builderResult,
  onChoose,
  onSubmitText,
}: {
  question: ServedQuestion
  timeLeft: number
  locked: boolean
  chosen: string | null
  correctOptionId?: string | null // undefined = belum dibuka
  builderResult?: { is_correct: boolean; correct_text: string | null } | null
  onChoose: (optionId: string) => void
  onSubmitText: (text: string) => void
}) {
  const [built, setBuilt] = useState<QuestionOption[]>([]) // urutan kata (Sentence Builder)
  const revealed = correctOptionId !== undefined
  const limitMs = q.time_limit_sec * 1000
  const pct = Math.max(0, Math.min(100, (timeLeft / limitMs) * 100))
  const isBuilder = q.game_type === 'sentence_builder'
  const isTrueFalse = q.game_type === 'true_false'
  const arena = ARENAS[ARENA_OF_GAME_TYPE[q.game_type] ?? 'mufrodat']
  // 3 kolom hanya jika teks pilihan pendek (pilihan I'rab biasanya panjang)
  const short = q.options.every((o) => o.label.length <= 14)
  const optionCols = isTrueFalse ? 'grid-cols-2' : q.options.length === 3 && short ? 'sm:grid-cols-3' : 'sm:grid-cols-2'

  return (
    <div>
      {/* Timer */}
      <div className="flex items-center gap-3">
        <Clock size={18} className={timeLeft < 5000 && !locked ? 'text-red-500' : 'text-muted'} />
        <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-200">
          <div
            className={`h-full rounded-full transition-[width] duration-100 ${pct < 25 ? 'bg-red-500' : pct < 50 ? 'bg-amber-400' : 'bg-emerald-500'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="w-8 text-right text-sm font-bold tabular-nums">{Math.ceil(timeLeft / 1000)}</span>
      </div>

      {/* Soal */}
      <section className="card mt-5 p-5 text-center sm:p-8">
        <div className="flex flex-wrap items-center justify-center gap-1.5 text-[11px] font-semibold">
          <span className={`rounded-full px-2.5 py-1 ${arena.color.soft} ${arena.color.text}`}>{GAME_TYPE_LABEL[q.game_type] ?? q.game_type}</span>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-muted">{DIFFICULTY_LABEL[q.difficulty]}</span>
          <span className={`rounded-full px-2.5 py-1 ${q.variety === 'fusha' ? 'bg-sky-50 text-sky-700' : 'bg-amber-50 text-amber-700'}`}>
            {q.variety === 'fusha' ? 'Fusha' : 'Amiyah Mesir'}
          </span>
        </div>
        <p className="mt-4 text-base font-medium text-ink sm:text-lg">
          <RichText text={q.prompt} />
        </p>
        {q.image_url && <img src={q.image_url} alt="" className="mx-auto mt-4 max-h-48 rounded-xl" />}
        {q.audio_url && <audio controls src={q.audio_url} className="mx-auto mt-4 w-full max-w-sm" />}
        {q.prompt_ar && (
          <p className="mt-4">
            <ArabicMarked
              text={q.prompt_ar}
              className={`font-semibold text-primary ${q.prompt_ar.length > 14 ? 'text-3xl sm:text-4xl' : 'text-4xl sm:text-5xl'}`}
            />
          </p>
        )}
      </section>

      {/* Jawaban */}
      {isBuilder ? (
        <SentenceBuilder
          options={q.options}
          built={built}
          setBuilt={setBuilt}
          locked={locked}
          onSubmit={() => onSubmitText(built.map((o) => o.label).join(' '))}
          result={builderResult ?? null}
        />
      ) : (
        <div className={`mt-5 grid gap-3 ${optionCols}`}>
          {q.options.map((o, i) => {
            const isCorrect = revealed && correctOptionId === o.id
            const isChosen = chosen === o.id
            let style = 'border-line bg-white hover:border-primary/40 hover:bg-slate-50'
            if (locked && isChosen) style = 'border-primary bg-primary/5'
            if (revealed) {
              if (isCorrect) style = 'border-emerald-400 bg-emerald-50 text-emerald-800'
              else if (isChosen) style = 'border-red-400 bg-red-50 text-red-800'
              else style = 'border-line bg-white opacity-60'
            }
            return (
              <button
                key={o.id}
                disabled={locked}
                onClick={() => onChoose(o.id)}
                className={`flex min-h-16 items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left font-semibold transition ${style}`}
              >
                {!isTrueFalse && (
                  <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-slate-100 text-xs font-bold text-muted">
                    {String.fromCharCode(65 + i)}
                  </span>
                )}
                <span className={`flex-1 ${isTrueFalse ? 'text-center' : ''}`}>
                  {o.is_arabic ? <Arabic className="block text-right text-2xl">{o.label}</Arabic> : o.label}
                </span>
                {isCorrect && <Check size={20} className="shrink-0 text-emerald-600" />}
                {revealed && isChosen && !isCorrect && <X size={20} className="shrink-0 text-red-600" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// Kotak hasil + penjelasan setelah jawaban dibuka
export function FeedbackPanel({
  isCorrect,
  points,
  timedOut,
  explanation,
  children,
}: {
  isCorrect: boolean
  points: number
  timedOut?: boolean
  explanation: string
  children?: ReactNode
}) {
  return (
    <section
      className={`mt-5 rounded-2xl border-2 p-5 ${isCorrect ? 'border-emerald-300 bg-emerald-50' : 'border-red-300 bg-red-50'}`}
      aria-live="polite"
    >
      <div className="flex items-center justify-between gap-3">
        <p className={`text-lg font-extrabold ${isCorrect ? 'text-emerald-700' : 'text-red-700'}`}>
          {isCorrect ? 'Benar! ' : timedOut ? 'Waktu habis' : 'Belum tepat'}
          {isCorrect && <Arabic className="text-base">أَحْسَنْتَ</Arabic>}
        </p>
        <span className={`text-sm font-bold ${isCorrect ? 'text-emerald-700' : 'text-red-700'}`}>+{points} poin</span>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-ink">
        <RichText text={explanation} />
      </p>
      {children}
    </section>
  )
}

type Phase = 'answering' | 'submitting' | 'feedback' | 'error'

// Satu soal lengkap: timer (dari sisa waktu server), pilihan/susun kalimat, umpan balik.
// Dipakai Quick Play dan petak tantangan Ular Tangga. Pasang `key={question.game_question_id}`
// agar keadaan ter-reset untuk setiap soal baru.
export default function QuestionPlayer({
  question: q,
  onSubmit,
  onContinue,
  continueLabel,
  feedbackExtra,
}: {
  question: ServedQuestion
  onSubmit: (optionId: string | null, text: string | null) => Promise<AnswerResult>
  onContinue: (result: AnswerResult | null) => void
  continueLabel: string
  feedbackExtra?: (result: AnswerResult) => ReactNode
}) {
  const [phase, setPhase] = useState<Phase>('answering')
  const [result, setResult] = useState<AnswerResult | null>(null)
  const [chosen, setChosen] = useState<string | null>(null) // id opsi yang dipilih
  const [timeLeft, setTimeLeft] = useState(q.remaining_ms)
  const [error, setError] = useState<string | null>(null)
  // Hitung mundur dari sisa waktu versi server, bukan jam perangkat
  const deadline = useRef(0)
  const submitting = useRef(false)

  const submit = useCallback(
    async (optionId: string | null, text: string | null) => {
      if (submitting.current) return
      submitting.current = true
      setChosen(optionId)
      setPhase('submitting')
      try {
        setResult(await onSubmit(optionId, text))
        setPhase('feedback')
      } catch (e) {
        // Mis. jawaban sudah tercatat (halaman dibuka di dua tab)
        setError(errorMessage(e))
        setPhase('error')
      }
    },
    [onSubmit],
  )

  useEffect(() => {
    deadline.current = performance.now() + q.remaining_ms
  }, [q.remaining_ms])

  useEffect(() => {
    if (phase !== 'answering') return
    const id = setInterval(() => {
      const left = Math.max(0, deadline.current - performance.now())
      setTimeLeft(left)
      if (left <= 0) submit(null, null) // waktu habis: server mencatat salah & memberi penjelasan
    }, 100)
    return () => clearInterval(id)
  }, [phase, submit])

  const isBuilder = q.game_type === 'sentence_builder'
  const timedOut = phase === 'feedback' && !chosen && !isBuilder && result && !result.is_correct

  return (
    <div>
      <QuestionView
        question={q}
        timeLeft={timeLeft}
        locked={phase !== 'answering'}
        chosen={chosen}
        correctOptionId={phase === 'feedback' && result ? result.correct_option_id : undefined}
        builderResult={result}
        onChoose={(id) => submit(id, null)}
        onSubmitText={(text) => submit(null, text)}
      />

      {phase === 'error' && (
        <section className="mt-5 rounded-2xl border-2 border-red-300 bg-red-50 p-5">
          <p className="text-sm text-red-700">{error}</p>
          <button onClick={() => onContinue(null)} className="mt-4 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-white">
            {continueLabel}
          </button>
        </section>
      )}

      {/* Umpan balik */}
      {phase === 'feedback' && result && (
        <FeedbackPanel isCorrect={result.is_correct} points={result.points} timedOut={!!timedOut} explanation={result.explanation}>
          {feedbackExtra?.(result)}
          <button
            onClick={() => onContinue(result)}
            autoFocus
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-white hover:bg-primary-light sm:w-auto sm:px-8"
          >
            {continueLabel} <ArrowRight size={18} />
          </button>
        </FeedbackPanel>
      )}
    </div>
  )
}

function SentenceBuilder({
  options,
  built,
  setBuilt,
  locked,
  onSubmit,
  result,
}: {
  options: QuestionOption[]
  built: QuestionOption[]
  setBuilt: (b: QuestionOption[]) => void
  locked: boolean
  onSubmit: () => void
  result: { is_correct: boolean; correct_text: string | null } | null
}) {
  const remaining = options.filter((o) => !built.some((b) => b.id === o.id))
  return (
    <div className="mt-5 space-y-4">
      {/* Kalimat yang disusun (kanan ke kiri) */}
      <div
        dir="rtl"
        className={`flex min-h-20 flex-wrap items-center gap-2 rounded-2xl border-2 border-dashed p-3 ${
          result ? (result.is_correct ? 'border-emerald-400 bg-emerald-50' : 'border-red-400 bg-red-50') : 'border-primary/30 bg-white'
        }`}
      >
        {built.length === 0 && <span className="w-full text-center text-sm text-muted" dir="ltr">Ketuk kata di bawah sesuai urutan</span>}
        {built.map((o) => (
          <button
            key={o.id}
            disabled={locked}
            onClick={() => setBuilt(built.filter((b) => b.id !== o.id))}
            className="rounded-xl bg-primary px-3 py-1.5 text-white"
          >
            <Arabic className="text-xl">{o.label}</Arabic>
          </button>
        ))}
      </div>
      {result && !result.is_correct && result.correct_text && (
        <p className="text-center text-sm text-muted">
          Jawaban benar: <Arabic className="text-lg text-emerald-700">{result.correct_text}</Arabic>
        </p>
      )}
      {/* Bank kata */}
      <div dir="rtl" className="flex flex-wrap justify-center gap-2">
        {remaining.map((o) => (
          <button
            key={o.id}
            disabled={locked}
            onClick={() => setBuilt([...built, o])}
            className="rounded-xl border-2 border-line bg-white px-3 py-1.5 transition hover:border-primary/40"
          >
            <Arabic className="text-xl">{o.label}</Arabic>
          </button>
        ))}
      </div>
      {!locked && (
        <button
          onClick={onSubmit}
          disabled={remaining.length > 0}
          className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-white transition hover:bg-primary-light disabled:opacity-40"
        >
          Periksa jawaban
        </button>
      )}
    </div>
  )
}
