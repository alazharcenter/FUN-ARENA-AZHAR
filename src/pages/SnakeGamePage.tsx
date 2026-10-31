import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Crown, Loader2, RotateCcw, SkipForward, Trophy, X } from 'lucide-react'
import { api, type AnswerResult, type ServedQuestion } from '../lib/api'
import { TILE_KINDS } from '../lib/arenas'
import {
  BOARDS, MODES, PIECE_COLORS, SPECIAL_BACK, SPECIAL_FORWARD, isChallenge, loadSnake, saveSnake, stepPath, tileKind,
  type SnakeState,
} from '../lib/snake'
import { errorMessage } from '../lib/supabase'
import { Arabic } from '../components/ui'
import Dice from '../components/Dice'
import QuestionPlayer from '../components/QuestionPlayer'
import SnakeBoard from '../components/SnakeBoard'

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))
const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)]

export default function SnakeGamePage() {
  const { sessionId = '' } = useParams()
  const navigate = useNavigate()
  const [state, setStateRaw] = useState<SnakeState | null>(() => loadSnake(sessionId))
  const stateRef = useRef(state)
  const [busy, setBusy] = useState(false) // dadu/animasi sedang berjalan
  const [rolling, setRolling] = useState(false)
  const [question, setQuestion] = useState<ServedQuestion | null>(null)
  const [qError, setQError] = useState<string | null>(null)
  const [finishError, setFinishError] = useState<string | null>(null)

  const update = useCallback((fn: (s: SnakeState) => SnakeState) => {
    const next = fn(stateRef.current!)
    stateRef.current = next
    setStateRaw(next)
    saveSnake(next)
  }, [])

  const log = useCallback(
    (msg: string) => update((s) => ({ ...s, log: [msg, ...s.log].slice(0, 30) })),
    [update],
  )

  const setPos = useCallback(
    (i: number, pos: number) => update((s) => ({ ...s, players: s.players.map((p, j) => (j === i ? { ...p, pos } : p)) })),
    [update],
  )

  const walk = useCallback(
    async (i: number, steps: number) => {
      const s = stateRef.current!
      const path = stepPath(s.players[i].pos, steps, s.size)
      for (const pos of path) {
        setPos(i, pos)
        await wait(200)
      }
      return path.at(-1) ?? s.players[i].pos
    },
    [setPos],
  )

  const nextTurn = useCallback(() => {
    update((s) => ({ ...s, turn: (s.turn + 1) % s.players.length }))
  }, [update])

  // Catat ke server saat ada pemenang (sekali saja)
  const finishOnServer = useCallback(async () => {
    try {
      await api.finishSnake(sessionId)
      update((s) => ({ ...s, finished: true }))
      setFinishError(null)
    } catch (e) {
      setFinishError(errorMessage(e))
    }
  }, [sessionId, update])

  const declareWinner = useCallback(
    async (i: number) => {
      const name = stateRef.current!.players[i].name
      update((s) => ({ ...s, winner: i, log: [`🏆 ${name} mencapai garis akhir!`, ...s.log] }))
      await finishOnServer()
    },
    [update, finishOnServer],
  )

  // Ular/tangga otomatis (dipakai setelah tantangan khusus atau jika soal penyelamat dimatikan)
  const resolveJump = useCallback(
    async (i: number, pos: number) => {
      const s = stateRef.current!
      const board = BOARDS[s.size]
      const name = s.players[i].name
      if (board.ladders[pos]) {
        await wait(250)
        setPos(i, board.ladders[pos])
        log(`🪜 ${name} naik tangga ke petak ${board.ladders[pos]}`)
        return board.ladders[pos]
      }
      if (board.snakes[pos]) {
        await wait(250)
        setPos(i, board.snakes[pos])
        log(`🐍 ${name} turun ke petak ${board.snakes[pos]}`)
        return board.snakes[pos]
      }
      return pos
    },
    [setPos, log],
  )

  // Apa yang terjadi saat bidak berhenti di sebuah petak
  const land = useCallback(
    async (i: number, pos: number) => {
      const s = stateRef.current!
      const name = s.players[i].name
      if (pos === s.size) return declareWinner(i)
      const kind = tileKind(pos, BOARDS[s.size], s.mode)
      const randomTile = () => pick(MODES[s.mode].tiles)

      if (kind === 'tangga') {
        await resolveJump(i, pos)
        return nextTurn()
      }
      if (kind === 'ular') {
        if (s.rules.snakeRescue) {
          log(`🐍 ${name} berhenti di kepala ular — soal penyelamat!`)
          return update((x) => ({ ...x, pending: { tile: randomTile(), harder: false, reason: 'snake', at: pos } }))
        }
        await resolveJump(i, pos)
        return nextTurn()
      }
      if (kind === 'bonus') {
        log(`⭐ Bonus! ${name} melempar dadu lagi`)
        return // giliran tetap
      }
      if (kind === 'khusus') {
        log(`❗ ${name} mendapat tantangan khusus`)
        return update((x) => ({ ...x, pending: { tile: randomTile(), harder: true, reason: 'special', at: pos } }))
      }
      if (isChallenge(kind)) {
        return update((x) => ({ ...x, pending: { tile: kind, harder: false, reason: 'challenge', at: pos } }))
      }
      nextTurn()
    },
    [declareWinner, resolveJump, nextTurn, log, update],
  )

  async function roll() {
    const s = stateRef.current
    if (!s || busy || s.pending || s.winner !== null) return
    setBusy(true)
    setRolling(true)
    for (let k = 0; k < 7; k++) {
      update((x) => ({ ...x, dice: 1 + Math.floor(Math.random() * 6) }))
      await wait(80)
    }
    const value = 1 + Math.floor(Math.random() * 6)
    update((x) => ({ ...x, dice: value }))
    setRolling(false)
    const i = s.turn
    log(`🎲 ${s.players[i].name} mendapat ${value}`)
    await wait(250)
    const pos = await walk(i, value)
    await land(i, pos)
    setBusy(false)
  }

  function skipTurn() {
    const s = stateRef.current!
    const p = s.players[s.turn]
    log(`⏸️ ${p.name} tertahan, giliran dilewati`)
    update((x) => ({ ...x, players: x.players.map((q, j) => (j === x.turn ? { ...q, skip: q.skip - 1 } : q)) }))
    nextTurn()
  }

  // Ambil soal dari server setiap ada petak tantangan yang tertunda
  const pending = state?.pending
  useEffect(() => {
    if (!pending) return
    let alive = true
    api
      .snakeQuestion(sessionId, pending.tile, pending.harder)
      .then((q) => alive && (setQuestion(q), setQError(null)))
      .catch((e) => alive && setQError(errorMessage(e)))
    return () => {
      alive = false
    }
  }, [pending, sessionId])

  const submit = useCallback(
    (optionId: string | null, text: string | null) => api.submitAnswer(question!.game_question_id, optionId, text),
    [question],
  )

  async function afterAnswer(result: AnswerResult | null) {
    const s = stateRef.current!
    const p = s.pending!
    const i = s.turn
    const ok = !!result?.is_correct
    const name = s.players[i].name
    setQuestion(null)
    update((x) => ({
      ...x,
      pending: null,
      players: x.players.map((q, j) =>
        j === i
          ? {
              ...q,
              points: q.points + (result?.points ?? 0),
              correct: q.correct + (ok ? 1 : 0),
              answered: q.answered + 1,
              skip: p.reason === 'challenge' && !ok && x.rules.wrongSkips ? 1 : q.skip,
            }
          : q,
      ),
    }))
    log(ok ? `✅ ${name} menjawab benar (+${result?.points})` : `❌ ${name} belum tepat`)

    setBusy(true)
    if (p.reason === 'snake') {
      if (ok) log(`🛡️ ${name} selamat dari ular`)
      else {
        await wait(300)
        const tail = BOARDS[s.size].snakes[p.at]
        setPos(i, tail)
        log(`🐍 ${name} turun ke petak ${tail}`)
      }
    } else if (p.reason === 'special') {
      const pos = await walk(i, ok ? SPECIAL_FORWARD : -SPECIAL_BACK)
      log(ok ? `🚀 ${name} maju ${SPECIAL_FORWARD} petak` : `↩️ ${name} mundur ${SPECIAL_BACK} petak`)
      if (pos === s.size) {
        setBusy(false)
        return declareWinner(i)
      }
      await resolveJump(i, pos)
    }
    setBusy(false)
    nextTurn()
  }

  function outcomeText(result: AnswerResult) {
    const s = stateRef.current!
    const p = s.pending
    if (!p) return null
    const ok = result.is_correct
    let text = ''
    if (p.reason === 'snake') text = ok ? 'Selamat dari ular! Bidak tetap di tempat.' : `Bidak turun ke petak ${BOARDS[s.size].snakes[p.at]}.`
    if (p.reason === 'special') text = ok ? `Bidak maju ${SPECIAL_FORWARD} petak.` : `Bidak mundur ${SPECIAL_BACK} petak.`
    if (p.reason === 'challenge') text = ok ? 'Poin bertambah.' : s.rules.wrongSkips ? 'Tertahan 1 giliran.' : 'Tidak ada hukuman di mode santai.'
    return <p className="mt-2 text-sm font-semibold text-ink">➜ {text}</p>
  }

  async function quit() {
    if (!confirm('Akhiri permainan sekarang? Jawaban yang sudah masuk tetap tercatat.')) return
    await finishOnServer()
    navigate(`/app/hasil/${sessionId}`)
  }

  if (!state) {
    return (
      <Shell>
        <div className="card mx-auto mt-10 max-w-md p-6 text-center">
          <p className="text-sm text-muted">Data permainan ini tidak ditemukan di perangkat ini (mungkin dimulai di perangkat lain).</p>
          <Link to="/app/arena/ular-tangga" className="mt-5 inline-block rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white">
            Mulai permainan baru
          </Link>
        </div>
      </Shell>
    )
  }

  const current = state.players[state.turn]
  const color = PIECE_COLORS[current.color]
  const ranking = state.players
    .map((p, i) => ({ ...p, i }))
    .sort((a, b) => (a.i === state.winner ? -1 : b.i === state.winner ? 1 : b.pos - a.pos || b.points - a.points))

  return (
    <Shell onQuit={state.winner === null ? quit : undefined}>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(300px,1fr)]">
        <div>
          <SnakeBoard
            size={state.size}
            mode={state.mode}
            highlight={current.pos || undefined}
            pieces={state.players.map((p, i) => ({ id: String(i), pos: p.pos, colorClass: PIECE_COLORS[p.color].className, active: i === state.turn }))}
          />
          <p className="mt-2 text-center text-xs text-muted">
            Mode {MODES[state.mode].name} · {state.size} petak
          </p>
        </div>

        <div className="space-y-4">
          {/* Giliran */}
          {state.winner === null && (
            <section className={`card p-5 ring-2 ${color.ring}`}>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">Giliran</p>
              <p className={`mt-0.5 flex items-center gap-2 text-xl font-extrabold ${color.text}`}>
                <span className={`size-4 rounded-full ${color.className}`} /> {current.name}
              </p>
              <div className="mt-4 flex items-center gap-4">
                <Dice value={state.dice} rolling={rolling} />
                <div className="flex-1">
                  {current.skip > 0 && !busy ? (
                    <button onClick={skipTurn} className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-amber-300 bg-amber-50 py-3 text-sm font-bold text-amber-800">
                      <SkipForward size={18} /> Tertahan — lewati giliran
                    </button>
                  ) : (
                    <button
                      onClick={roll}
                      disabled={busy || !!state.pending}
                      className="w-full rounded-xl bg-snake py-3.5 text-base font-extrabold text-white shadow-sm transition hover:brightness-110 disabled:opacity-50"
                    >
                      {busy ? 'Bergerak…' : 'Lempar Dadu'}
                    </button>
                  )}
                  <p className="mt-1.5 text-center text-xs text-muted">{current.pos ? `Di petak ${current.pos}` : 'Belum masuk papan'}</p>
                </div>
              </div>
            </section>
          )}

          {/* Pemain */}
          <section className="card divide-y divide-line">
            {state.players.map((p, i) => (
              <div key={i} className={`flex items-center gap-3 px-4 py-3 ${i === state.turn && state.winner === null ? 'bg-slate-50' : ''}`}>
                <span className={`size-4 shrink-0 rounded-full ${PIECE_COLORS[p.color].className}`} />
                <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                  {p.name} {state.winner === i && <Crown size={14} className="inline text-gold" />}
                  {p.skip > 0 && <span className="ml-1.5 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">tertahan</span>}
                </span>
                <span className="text-xs text-muted">petak {p.pos}</span>
                <span className="w-16 text-right text-sm font-bold">{p.points}</span>
              </div>
            ))}
          </section>

          {/* Catatan permainan */}
          <section className="card max-h-48 overflow-y-auto p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Catatan</p>
            {state.log.length === 0 && <p className="text-sm text-muted">Lempar dadu untuk memulai.</p>}
            <ul className="space-y-1 text-sm">
              {state.log.slice(0, 12).map((l, i) => (
                <li key={i} className={i === 0 ? 'font-semibold text-ink' : 'text-muted'}>
                  {l}
                </li>
              ))}
            </ul>
          </section>

          {/* Legenda singkat */}
          <section className="flex flex-wrap gap-x-3 gap-y-1.5 px-1 text-[11px] text-muted">
            {(['bonus', 'khusus', 'tangga', 'ular', ...MODES[state.mode].tiles] as const).map((k) => (
              <span key={k} className="flex items-center gap-1">
                <span className={`arabic grid size-4 place-items-center rounded text-[10px] font-bold ${TILE_KINDS[k].className}`}>{TILE_KINDS[k].symbol}</span>
                {TILE_KINDS[k].label}
              </span>
            ))}
          </section>
        </div>
      </div>

      {/* Jendela soal */}
      {state.pending && (
        <Modal>
          <div className="mb-4 flex items-start gap-3">
            <span className={`mt-1 size-4 shrink-0 rounded-full ${color.className}`} />
            <div>
              <p className="font-extrabold">
                {current.name} · {TILE_KINDS[state.pending.reason === 'challenge' ? state.pending.tile : state.pending.reason === 'snake' ? 'ular' : 'khusus'].label}
              </p>
              <p className="text-sm text-muted">
                {state.pending.reason === 'snake' && 'Jawab benar agar tidak turun.'}
                {state.pending.reason === 'special' && `Soal lebih sulit. Benar: maju ${SPECIAL_FORWARD} petak · Salah: mundur ${SPECIAL_BACK} petak.`}
                {state.pending.reason === 'challenge' && (state.rules.wrongSkips ? 'Benar: tambah poin · Salah: tertahan 1 giliran.' : 'Benar: tambah poin.')}
              </p>
            </div>
          </div>
          {qError ? (
            <div className="card p-5 text-center">
              <p className="text-sm text-red-700">{qError}</p>
              <div className="mt-4 flex justify-center gap-2">
                <button
                  onClick={() => update((x) => ({ ...x, pending: x.pending && { ...x.pending } }))}
                  className="flex items-center gap-2 rounded-xl border border-line px-4 py-2 text-sm font-semibold text-primary"
                >
                  <RotateCcw size={16} /> Coba lagi
                </button>
                <button onClick={() => afterAnswer(null)} className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white">
                  Lewati soal
                </button>
              </div>
            </div>
          ) : question ? (
            <QuestionPlayer
              key={question.game_question_id}
              question={question}
              onSubmit={submit}
              onContinue={afterAnswer}
              continueLabel="Lanjutkan"
              feedbackExtra={outcomeText}
            />
          ) : (
            <div className="flex justify-center py-16 text-primary">
              <Loader2 className="animate-spin" size={28} />
            </div>
          )}
        </Modal>
      )}

      {/* Podium */}
      {state.winner !== null && (
        <Modal>
          <div className="text-center">
            <Trophy size={44} className="mx-auto text-gold" />
            <h2 className="mt-2 text-2xl font-extrabold text-primary">{state.players[state.winner].name} menang!</h2>
            <Arabic className="text-xl text-snake">مَبْرُوكٌ</Arabic>
          </div>
          <ol className="mt-5 space-y-2">
            {ranking.map((p, r) => (
              <li key={p.i} className={`card flex items-center gap-3 p-3 ${r === 0 ? 'ring-2 ring-gold' : ''}`}>
                <span className="grid size-8 place-items-center rounded-full bg-slate-100 text-sm font-extrabold">{r + 1}</span>
                <span className={`size-4 rounded-full ${PIECE_COLORS[p.color].className}`} />
                <span className="flex-1 font-semibold">{p.name}</span>
                <span className="text-xs text-muted">
                  {p.correct}/{p.answered} benar
                </span>
                <span className="w-16 text-right font-bold">{p.points}</span>
              </li>
            ))}
          </ol>
          {state.players.length > 1 && (
            <p className="mt-3 text-center text-xs text-muted">Mode bergiliran: skor tercatat, XP hanya diberikan pada permainan 1 pemain.</p>
          )}
          {finishError && (
            <p className="mt-3 text-center text-sm text-red-700">
              Gagal mencatat hasil: {finishError}{' '}
              <button onClick={finishOnServer} className="font-semibold underline">
                Coba lagi
              </button>
            </p>
          )}
          <div className="mt-5 grid gap-2 sm:grid-cols-3">
            <Link to={`/app/hasil/${sessionId}`} className="rounded-xl border border-line bg-white py-3 text-center text-sm font-bold text-primary hover:bg-slate-50">
              Ulasan jawaban
            </Link>
            <Link to="/app/arena/ular-tangga" className="rounded-xl bg-snake py-3 text-center text-sm font-bold text-white hover:brightness-110">
              Main lagi
            </Link>
            <Link to="/app" className="rounded-xl border border-line bg-white py-3 text-center text-sm font-bold text-primary hover:bg-slate-50">
              Beranda
            </Link>
          </div>
        </Modal>
      )}
    </Shell>
  )
}

function Modal({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-ink/50 px-3 py-6 backdrop-blur-[2px]" role="dialog" aria-modal="true">
      <div className="mx-auto max-w-2xl rounded-3xl bg-bg p-4 shadow-2xl sm:p-6">{children}</div>
    </div>
  )
}

function Shell({ children, onQuit }: { children: ReactNode; onQuit?: () => void }) {
  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-10 border-b border-line bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <span className="flex items-center gap-2 text-sm font-bold text-primary">
            Arabic Snake & Ladder <Arabic className="text-base text-snake">سُلَّمُ الْعَرَبِيَّةِ</Arabic>
          </span>
          {onQuit && (
            <button onClick={onQuit} className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-muted hover:bg-slate-100">
              <X size={18} /> Akhiri
            </button>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-5 pb-16">{children}</main>
    </div>
  )
}
