import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Loader2, RotateCcw, X } from 'lucide-react'
import { api, type ServedQuestion } from '../lib/api'
import { errorMessage } from '../lib/supabase'
import QuestionPlayer from '../components/QuestionPlayer'

type Phase = 'loading' | 'playing' | 'finishing' | 'error'

export default function GamePage() {
  const { sessionId = '' } = useParams()
  const navigate = useNavigate()

  const [phase, setPhase] = useState<Phase>('loading')
  const [question, setQuestion] = useState<ServedQuestion | null>(null)
  const [score, setScore] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const finish = useCallback(async () => {
    setPhase('finishing')
    try {
      await api.finish(sessionId)
      navigate(`/app/hasil/${sessionId}`, { replace: true })
    } catch (e) {
      setError(errorMessage(e))
      setPhase('error')
    }
  }, [sessionId, navigate])

  const loadNext = useCallback(async () => {
    try {
      const q = await api.nextQuestion(sessionId)
      if (!q) return finish()
      setQuestion(q)
      setPhase('playing')
    } catch (e) {
      setError(errorMessage(e))
      setPhase('error')
    }
  }, [sessionId, finish])

  useEffect(() => {
    loadNext()
  }, [loadNext])

  const submit = useCallback(
    async (optionId: string | null, text: string | null) => {
      const r = await api.submitAnswer(question!.game_question_id, optionId, text)
      setScore((s) => s + r.points)
      return r
    },
    [question],
  )

  function next() {
    setPhase('loading')
    loadNext()
  }

  function quit() {
    if (confirm('Akhiri permainan sekarang? Soal yang sudah dijawab tetap dihitung.')) finish()
  }

  if (phase === 'error') {
    return (
      <Shell onQuit={() => navigate('/app')}>
        <div className="card mx-auto mt-10 max-w-md p-6 text-center">
          <p className="text-sm text-red-700">{error}</p>
          <div className="mt-5 flex justify-center gap-2">
            <button onClick={next} className="flex items-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-primary">
              <RotateCcw size={16} /> Coba lagi
            </button>
            <button onClick={finish} className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white">
              Lihat hasil
            </button>
          </div>
        </div>
      </Shell>
    )
  }

  if (!question || phase !== 'playing') {
    return (
      <Shell onQuit={quit}>
        <div className="flex flex-col items-center gap-3 py-24 text-muted">
          <Loader2 size={32} className="animate-spin text-primary" />
          <p className="text-sm">{phase === 'finishing' ? 'Menghitung hasil…' : 'Memuat soal…'}</p>
        </div>
      </Shell>
    )
  }

  const q = question
  return (
    <Shell onQuit={quit}>
      {/* Progres & skor */}
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold text-muted">
          Soal <b className="text-ink">{q.order_index}</b> / {q.total}
        </span>
        <span className="rounded-full bg-gold-soft px-3 py-1 font-bold text-amber-700">{score} poin</span>
      </div>
      <div className="mt-2 mb-5 flex gap-1">
        {Array.from({ length: q.total }, (_, i) => (
          <span key={i} className={`h-1.5 flex-1 rounded-full ${i < q.order_index - 1 ? 'bg-primary' : i === q.order_index - 1 ? 'bg-primary/50' : 'bg-stone-200'}`} />
        ))}
      </div>

      <QuestionPlayer
        key={q.game_question_id}
        question={q}
        onSubmit={submit}
        onContinue={next}
        continueLabel={q.order_index < q.total ? 'Soal berikutnya' : 'Lihat hasil'}
      />
    </Shell>
  )
}

function Shell({ children, onQuit }: { children: ReactNode; onQuit: () => void }) {
  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-10 border-b border-line bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <span className="text-sm font-bold text-primary">Quick Play</span>
          <button onClick={onQuit} className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-muted hover:bg-stone-100">
            <X size={18} /> Akhiri
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-5 pb-16">{children}</main>
    </div>
  )
}
