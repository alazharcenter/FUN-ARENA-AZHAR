import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Check, Copy, Crown, Eye, Loader2, LogOut, Trophy, Wifi, WifiOff } from 'lucide-react'
import { api, type RoomPlayer, type RoomState } from '../lib/api'
import { ARENAS, DIFFICULTY_LABEL, GAME_TYPE_LABEL, TILE_KINDS, type TileKind } from '../lib/arenas'
import { MODES, pieceColor } from '../lib/snake'
import { useAdvanceRetry, useCountdown, useRoom } from '../lib/useRoom'
import { Arabic } from '../components/ui'
import Dice from '../components/Dice'
import SnakeBoard from '../components/SnakeBoard'
import { FeedbackPanel, QuestionView } from '../components/QuestionPlayer'

type Room = ReturnType<typeof useRoom>

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

export default function RoomPage() {
  const { code = '' } = useParams()
  const room = useRoom(code.toUpperCase())
  const { data, error } = room

  if (!data) {
    return (
      <Shell room={room}>
        {error ? (
          <div className="card mx-auto mt-10 max-w-md p-6 text-center">
            <p className="text-sm text-red-700">{error}</p>
            <Link to="/app/lobby" className="mt-5 inline-block rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white">
              Kembali ke Main Bareng
            </Link>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-24 text-muted">
            <Loader2 size={32} className="animate-spin text-primary" />
            <p className="text-sm">Bergabung ke room {code.toUpperCase()}…</p>
          </div>
        )}
      </Shell>
    )
  }

  const status = data.room.status
  return (
    <Shell room={room}>
      {status === 'cancelled' && (
        <div className="card mx-auto mt-10 max-w-md p-6 text-center">
          <p className="text-sm text-muted">Room ini sudah ditutup.</p>
          <Link to="/app/lobby" className="mt-5 inline-block rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white">
            Buat atau gabung room lain
          </Link>
        </div>
      )}
      {status === 'lobby' && <RoomLobby room={room} data={data} />}
      {(status === 'playing' || status === 'finished') &&
        (data.room.settings.game === 'quiz' ? <QuizRoom room={room} data={data} /> : <SnakeRoom room={room} data={data} />)}
    </Shell>
  )
}

// ---------------------------------------------------------------------
function Shell({ room, children }: { room: Room; children: ReactNode }) {
  const navigate = useNavigate()
  const { data, roomId, live } = room
  async function leave() {
    const playing = data?.room.status === 'playing'
    if (playing && !confirm('Keluar dari permainan? Kamu bisa bergabung lagi dengan kode yang sama.')) return
    if (roomId) await api.leaveRoom(roomId).catch(() => {})
    navigate('/app/lobby')
  }
  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-20 border-b border-line bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <span className="text-sm font-bold text-primary">Room</span>
          {data && <span className="font-mono text-lg font-extrabold tracking-widest text-primary">{data.room.code}</span>}
          <span
            title={live ? 'Tersambung realtime' : 'Sinkron berkala (realtime belum tersambung)'}
            className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${live ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}
          >
            {live ? <Wifi size={12} /> : <WifiOff size={12} />} {live ? 'Live' : 'Sinkron'}
          </span>
          <button onClick={leave} className="ml-auto flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-muted hover:bg-slate-100">
            <LogOut size={16} /> Keluar
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-5 pb-16">{children}</main>
    </div>
  )
}

function PlayerDot({ p }: { p: RoomPlayer }) {
  return <span className={`size-3.5 shrink-0 rounded-full ${pieceColor(p.color).className} ${p.online ? '' : 'opacity-35'}`} />
}

function settingsSummary(d: RoomState) {
  const s = d.room.settings
  const parts: string[] = []
  if (s.game === 'quiz') {
    parts.push(`Quiz Battle · ${ARENAS[s.arena ?? 'mufrodat'].name}`)
    parts.push(s.game_type ? GAME_TYPE_LABEL[s.game_type] : 'Campuran')
    parts.push(s.category_name ?? 'Semua materi')
    parts.push(`${s.count} soal`)
  } else {
    parts.push(`Ular Tangga · ${MODES[s.mode ?? 'mixed'].name}`)
    parts.push(`${s.size} petak`)
    if (s.wrong_skips) parts.push('salah = tertahan')
    if (s.snake_rescue) parts.push('soal penyelamat ular')
  }
  parts.push(s.difficulty ? DIFFICULTY_LABEL[s.difficulty] : 'Semua tingkat')
  parts.push(s.time_limit ? `${s.time_limit} dtk/soal` : 'waktu sesuai soal')
  return parts
}

// ---------------------------------------------------------------------
// LOBBY
function RoomLobby({ room, data }: { room: Room; data: RoomState }) {
  const [msg, setMsg] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const isHost = data.room.host_id === data.me
  const me = data.players.find((p) => p.user_id === data.me)
  const players = data.players.filter((p) => p.is_player)
  const notReady = players.filter((p) => !p.is_ready)
  const canStart = isHost && data.players.length >= 2 && notReady.length === 0
  const link = `${window.location.origin}/app/room/${data.room.code}`

  async function copy() {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setMsg('Tidak bisa menyalin otomatis. Bagikan kode room secara manual.')
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <section className="space-y-4">
        <div className="card p-6 text-center">
          <p className="text-sm font-semibold text-muted">Kode room</p>
          <p className="mt-1 font-mono text-5xl font-extrabold tracking-[0.25em] text-primary sm:text-6xl">{data.room.code}</p>
          <button onClick={copy} className="mt-4 inline-flex items-center gap-2 rounded-xl border border-line px-4 py-2 text-sm font-semibold text-primary hover:bg-slate-50">
            {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? 'Tautan disalin' : 'Salin tautan undangan'}
          </button>
          <p className="mt-3 text-xs text-muted">Pemain membuka menu Main Bareng → Gabung Room, lalu memasukkan kode ini.</p>
        </div>
        <div className="card p-5">
          <p className="text-sm font-bold">Pengaturan</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {settingsSummary(data).map((t) => (
              <span key={t} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-ink">
                {t}
              </span>
            ))}
          </div>
          {!data.room.settings.host_plays && <p className="mt-3 flex items-center gap-1.5 text-xs text-muted"><Eye size={14} /> Mode Kelas: host memandu tanpa ikut bermain.</p>}
        </div>
      </section>

      <section className="card p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">
            Pemain <span className="text-muted">({players.length}/{data.room.settings.max_players})</span>
          </h2>
          <span className="text-xs text-muted">{notReady.length ? `${notReady.length} belum siap` : 'Semua siap'}</span>
        </div>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {data.players.map((p) => (
            <li key={p.user_id} className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 ${p.user_id === data.me ? 'border-primary/30 bg-primary/5' : 'border-line'}`}>
              <PlayerDot p={p} />
              <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                {p.nickname}
                {p.user_id === data.room.host_id && <Crown size={13} className="ml-1 inline text-gold" />}
              </span>
              {!p.is_player ? (
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-muted">PEMANDU</span>
              ) : p.is_ready ? (
                <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">SIAP</span>
              ) : (
                <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">BELUM</span>
              )}
            </li>
          ))}
        </ul>

        {msg && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{msg}</p>}

        <div className="mt-5">
          {isHost ? (
            <>
              <button
                disabled={!canStart}
                onClick={async () => setMsg(await room.act(() => api.startRoom(room.roomId!)))}
                className="w-full rounded-xl bg-primary py-3.5 font-bold text-white transition hover:bg-primary-light disabled:opacity-40"
              >
                Mulai Permainan
              </button>
              <p className="mt-2 text-center text-xs text-muted">
                {data.players.length < 2 ? 'Menunggu pemain lain bergabung…' : notReady.length ? `Menunggu ${notReady.map((p) => p.nickname).join(', ')} siap…` : 'Semua siap!'}
              </p>
            </>
          ) : (
            me && (
              <button
                onClick={async () => setMsg(await room.act(() => api.setReady(room.roomId!, !me.is_ready)))}
                className={`w-full rounded-xl py-3.5 font-bold transition ${me.is_ready ? 'border-2 border-emerald-400 bg-emerald-50 text-emerald-700' : 'bg-primary text-white hover:bg-primary-light'}`}
              >
                {me.is_ready ? '✓ Siap — menunggu host memulai' : 'Saya Siap'}
              </button>
            )
          )}
        </div>
      </section>
    </div>
  )
}

// ---------------------------------------------------------------------
// QUIZ BATTLE
function QuizRoom({ room, data }: { room: Room; data: RoomState }) {
  const st = data.state
  const q = data.question
  const me = data.players.find((p) => p.user_id === data.me)
  const isPlayer = !!me?.is_player
  const [chosen, setChosen] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const tryAdvance = useAdvanceRetry()
  const gqId = q?.game_question_id ?? ''
  const questionLeft = useCountdown(q?.remaining_ms, room.fetchedAt, `${gqId}:${data.room.version}`)
  const revealLeft = useCountdown(st.reveal_remaining_ms, room.fetchedAt, `${gqId}:r:${data.room.version}`)

  // Reset pilihan saat soal berganti
  const [lastGq, setLastGq] = useState(gqId)
  if (lastGq !== gqId) {
    setLastGq(gqId)
    setChosen(null)
  }

  // Waktu habis (soal / pembahasan) → minta server maju. Siapa pun boleh; server yang memutuskan.
  useEffect(() => {
    if (data.room.status !== 'playing' || !q) return
    const left = st.phase === 'question' ? questionLeft : st.phase === 'reveal' ? revealLeft : null
    if (left !== null && left <= 0) tryAdvance(`${gqId}:${st.phase}`, () => room.act(() => api.roomAdvance(room.roomId!)))
  }, [questionLeft, revealLeft, st.phase, gqId, q, data.room.status, room, tryAdvance])

  async function answer(optionId: string | null, text: string | null) {
    if (!q) return
    setChosen(optionId)
    const err = await room.act(async () => {
      await api.submitAnswer(q.game_question_id, optionId, text)
      await api.roomAdvance(room.roomId!) // maju ke pembahasan jika semua sudah menjawab
    })
    setMsg(err)
  }

  if (data.room.status === 'finished') return <Results data={data} />
  if (!q) return null

  const players = data.players.filter((p) => p.is_player)
  const answeredCount = players.filter((p) => p.answered_current).length
  const myAnswer = data.reveal?.answer
  const revealed = st.phase === 'reveal'
  const ranking = [...players].sort((a, b) => b.score - a.score)

  return (
    <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(260px,1fr)]">
      <div>
        <div className="mb-4 flex items-center justify-between text-sm">
          <span className="font-semibold text-muted">
            Soal <b className="text-ink">{st.index}</b> / {st.total}
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-muted">
            {answeredCount}/{players.length} sudah menjawab
          </span>
        </div>
        <QuestionView
          key={gqId}
          question={q}
          timeLeft={revealed ? 0 : (questionLeft ?? q.remaining_ms)}
          locked={!isPlayer || !!myAnswer || revealed || questionLeft === 0}
          chosen={myAnswer?.option_id ?? chosen}
          correctOptionId={revealed ? (data.reveal?.correct_option_id ?? null) : undefined}
          builderResult={revealed && myAnswer ? { is_correct: !!myAnswer.is_correct, correct_text: data.reveal?.correct_text ?? null } : null}
          onChoose={(id) => answer(id, null)}
          onSubmitText={(t) => answer(null, t)}
        />
        {msg && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{msg}</p>}

        {!revealed && myAnswer && (
          <p className="mt-5 rounded-2xl border-2 border-primary/20 bg-primary/5 p-4 text-center text-sm font-semibold text-primary">
            Jawaban terkirim! Menunggu pemain lain… Hasil dibuka setelah semua menjawab atau waktu habis.
          </p>
        )}
        {!isPlayer && !revealed && (
          <p className="mt-5 rounded-2xl bg-slate-100 p-4 text-center text-sm text-muted">Kamu memandu permainan ini. Pembahasan terbuka otomatis.</p>
        )}

        {revealed && data.reveal?.explanation && (
          isPlayer ? (
            <FeedbackPanel
              isCorrect={!!myAnswer?.is_correct}
              points={myAnswer?.points ?? 0}
              timedOut={!myAnswer}
              explanation={data.reveal.explanation}
            >
              <p className="mt-3 text-xs font-semibold text-muted">Soal berikutnya dalam {Math.ceil((revealLeft ?? st.reveal_remaining_ms ?? 0) / 1000)} detik…</p>
            </FeedbackPanel>
          ) : (
            <section className="mt-5 rounded-2xl border-2 border-line bg-white p-5 text-sm">
              <p className="font-bold">Pembahasan</p>
              <p className="mt-1">{data.reveal.explanation}</p>
              <p className="mt-3 text-xs font-semibold text-muted">Soal berikutnya dalam {Math.ceil((revealLeft ?? st.reveal_remaining_ms ?? 0) / 1000)} detik…</p>
            </section>
          )
        )}
      </div>

      {/* Papan skor langsung */}
      <aside className="card h-fit p-4 lg:sticky lg:top-20">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Papan skor</p>
        <ol className="space-y-1.5">
          {ranking.map((p, i) => (
            <li key={p.user_id} className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm ${p.user_id === data.me ? 'bg-primary/5 font-bold' : ''}`}>
              <span className="w-5 text-right text-xs text-muted">{i + 1}</span>
              <PlayerDot p={p} />
              <span className="min-w-0 flex-1 truncate">{p.nickname}</span>
              {st.phase === 'question' && (p.answered_current ? <Check size={14} className="text-emerald-600" /> : <span className="size-3.5" />)}
              <span className="w-12 text-right font-semibold tabular-nums">{p.score}</span>
            </li>
          ))}
        </ol>
      </aside>
    </div>
  )
}

// ---------------------------------------------------------------------
// ULAR TANGGA ONLINE
function SnakeRoom({ room, data }: { room: Room; data: RoomState }) {
  const s = data.room.settings
  const st = data.state
  const q = data.question
  const size = s.size ?? 50
  const mode = s.mode ?? 'mixed'
  const players = data.players.filter((p) => p.is_player).sort((a, b) => (a.turn_order ?? 0) - (b.turn_order ?? 0))
  const turnPlayer = players.find((p) => p.user_id === st.turn_user)
  const pendingPlayer = players.find((p) => p.user_id === st.pending?.user)
  const myTurn = st.phase === 'turn' && st.turn_user === data.me
  const myQuestion = st.phase === 'question' && st.pending?.user === data.me
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState<{ gq: string; option: string | null } | null>(null) // kunci tombol segera setelah diklik
  const [rolling, setRolling] = useState(false)
  const [display, setDisplay] = useState<Record<string, number>>({})
  const lastMove = useRef<number | null>(null)
  const animating = useRef(false)
  const latest = useRef(data)
  latest.current = data
  const tryAdvance = useAdvanceRetry()
  const resolvedFor = useRef('')

  const turnLeft = useCountdown(st.turn_remaining_ms, room.fetchedAt, `${st.turn_user}:${data.room.version}`)
  const questionLeft = useCountdown(q?.remaining_ms, room.fetchedAt, `${q?.game_question_id}:${data.room.version}`)
  const answered = data.reveal?.answer ?? null
  const revealed = !!data.reveal?.explanation

  // Animasikan gerakan bidak dari server (path petak demi petak) di semua perangkat
  useEffect(() => {
    const mv = st.move
    const sync = () => setDisplay(Object.fromEntries(latest.current.players.map((p) => [p.user_id, p.board_pos])))
    if (lastMove.current === null || !mv || mv.id === lastMove.current) {
      lastMove.current = mv?.id ?? 0
      if (!animating.current) sync()
      return
    }
    lastMove.current = mv.id
    animating.current = true
    ;(async () => {
      setRolling(true)
      await wait(450)
      setRolling(false)
      for (const pos of mv.path) {
        setDisplay((d) => ({ ...d, [mv.user]: pos }))
        await wait(220)
      }
      animating.current = false
      sync()
    })()
  }, [st.move, data])

  // Waktu habis → minta server maju (giliran dilewati / soal dianggap salah)
  useEffect(() => {
    if (data.room.status !== 'playing') return
    if (st.phase === 'turn' && turnLeft !== null && turnLeft <= 0) {
      tryAdvance(`turn:${st.turn_user}:${data.room.version}`, () => room.act(() => api.roomAdvance(room.roomId!)))
    }
    if (st.phase === 'question' && q && questionLeft !== null && questionLeft <= 0) {
      // Server memberi pemain yang menjawab 8 dtk ekstra untuk membaca pembahasan
      const t = setTimeout(() => tryAdvance(`q:${q.game_question_id}:${data.room.version}`, () => room.act(() => api.roomAdvance(room.roomId!))), 9000)
      return () => clearTimeout(t)
    }
  }, [turnLeft, questionLeft, st.phase, st.turn_user, q, data.room.status, data.room.version, room, tryAdvance])

  // Pemain yang menjawab: lanjut otomatis 6 dtk setelah hasil tampil
  useEffect(() => {
    if (!myQuestion || !revealed || !q) return
    const t = setTimeout(() => resolve(), 6000)
    return () => clearTimeout(t)
  }, [myQuestion, revealed, q?.game_question_id])

  async function resolve() {
    if (!q || resolvedFor.current === q.game_question_id) return
    resolvedFor.current = q.game_question_id
    setMsg(await room.act(() => api.roomSnakeResolve(room.roomId!)))
  }

  async function roll() {
    setBusy(true)
    setMsg(await room.act(() => api.roomRoll(room.roomId!)))
    setBusy(false)
  }

  async function answer(optionId: string | null, text: string | null) {
    if (!q || sent?.gq === q.game_question_id) return
    setSent({ gq: q.game_question_id, option: optionId })
    setMsg(await room.act(() => api.submitAnswer(q.game_question_id, optionId, text)))
  }

  if (data.room.status === 'finished') return <Results data={data} />

  const pieces = players.map((p) => ({
    id: p.user_id,
    pos: display[p.user_id] ?? p.board_pos,
    colorClass: pieceColor(p.color).className,
    active: p.user_id === (st.pending?.user ?? st.turn_user),
  }))
  const reasonText =
    st.pending?.reason === 'snake' ? 'Soal penyelamat: jawab benar agar tidak turun.'
    : st.pending?.reason === 'special' ? 'Tantangan khusus: benar maju 5, salah mundur 3.'
    : s.wrong_skips ? 'Benar: tambah poin · Salah: tertahan 1 giliran.' : 'Benar: tambah poin.'

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(300px,1fr)]">
      <div>
        <SnakeBoard size={size} mode={mode} pieces={pieces} />
        <p className="mt-2 text-center text-xs text-muted">
          Mode {MODES[mode].name} · {size} petak · dadu diacak oleh server
        </p>
      </div>

      <div className="space-y-4">
        <section className={`card p-5 ring-2 ${turnPlayer ? pieceColor(turnPlayer.color).ring : 'ring-line'}`}>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">Giliran</p>
          <p className={`mt-0.5 flex items-center gap-2 text-xl font-extrabold ${turnPlayer ? pieceColor(turnPlayer.color).text : ''}`}>
            {turnPlayer && <PlayerDot p={turnPlayer} />} {turnPlayer?.nickname ?? '—'} {st.turn_user === data.me && <span className="text-sm text-muted">(kamu)</span>}
          </p>
          <div className="mt-4 flex items-center gap-4">
            <Dice value={st.dice ?? 1} rolling={rolling} />
            <div className="flex-1">
              {myTurn ? (
                <button onClick={roll} disabled={busy || animating.current} className="w-full rounded-xl bg-snake py-3.5 text-base font-extrabold text-white shadow-sm transition hover:brightness-110 disabled:opacity-50">
                  {busy ? 'Melempar…' : 'Lempar Dadu'}
                </button>
              ) : (
                <p className="rounded-xl bg-slate-50 px-3 py-3 text-center text-sm text-muted">
                  {st.phase === 'question' ? `${pendingPlayer?.nickname ?? 'Pemain'} sedang menjawab…` : `Menunggu ${turnPlayer?.nickname ?? 'pemain'}…`}
                </p>
              )}
              {st.phase === 'turn' && <p className="mt-1.5 text-center text-xs text-muted">Sisa waktu giliran {Math.ceil((turnLeft ?? st.turn_remaining_ms ?? 0) / 1000)} dtk</p>}
            </div>
          </div>
          {msg && <p className="mt-3 rounded-lg bg-red-50 p-2 text-xs text-red-700">{msg}</p>}
        </section>

        <section className="card divide-y divide-line">
          {players.map((p) => (
            <div key={p.user_id} className={`flex items-center gap-3 px-4 py-2.5 ${p.user_id === data.me ? 'bg-primary/5' : ''}`}>
              <PlayerDot p={p} />
              <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                {p.nickname}
                {!p.online && <span className="ml-1.5 text-[10px] font-bold text-muted">terputus</span>}
                {p.skip > 0 && <span className="ml-1.5 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">tertahan</span>}
              </span>
              <span className="text-xs text-muted">petak {p.board_pos}</span>
              <span className="w-12 text-right text-sm font-bold tabular-nums">{p.score}</span>
            </div>
          ))}
        </section>

        <section className="card max-h-48 overflow-y-auto p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Catatan</p>
          <ul className="space-y-1 text-sm">
            {(st.log ?? []).slice(0, 12).map((l, i) => (
              <li key={i} className={i === 0 ? 'font-semibold text-ink' : 'text-muted'}>
                {l}
              </li>
            ))}
          </ul>
        </section>

        <section className="flex flex-wrap gap-x-3 gap-y-1.5 px-1 text-[11px] text-muted">
          {(['bonus', 'khusus', 'tangga', 'ular', ...MODES[mode].tiles] as TileKind[]).map((k) => (
            <span key={k} className="flex items-center gap-1">
              <span className={`arabic grid size-4 place-items-center rounded text-[10px] font-bold ${TILE_KINDS[k].className}`}>{TILE_KINDS[k].symbol}</span>
              {TILE_KINDS[k].label}
            </span>
          ))}
        </section>
      </div>

      {/* Jendela soal untuk semua pemain; hanya yang giliran yang bisa menjawab */}
      {st.phase === 'question' && q && !animating.current && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-ink/50 px-3 py-6 backdrop-blur-[2px]" role="dialog" aria-modal="true">
          <div className="mx-auto max-w-2xl rounded-3xl bg-bg p-4 shadow-2xl sm:p-6">
            <div className="mb-4 flex items-start gap-3">
              {pendingPlayer && <span className="mt-1.5"><PlayerDot p={pendingPlayer} /></span>}
              <div>
                <p className="font-extrabold">
                  {myQuestion ? 'Giliranmu menjawab!' : `${pendingPlayer?.nickname ?? 'Pemain'} sedang menjawab`}
                  {st.pending && <span className="font-semibold text-muted"> · {TILE_KINDS[(st.pending.reason === 'snake' ? 'ular' : st.pending.reason === 'special' ? 'khusus' : st.pending.tile) as TileKind]?.label}</span>}
                </p>
                <p className="text-sm text-muted">{reasonText}</p>
              </div>
            </div>
            <QuestionView
              key={q.game_question_id}
              question={q}
              timeLeft={revealed ? 0 : (questionLeft ?? q.remaining_ms)}
              locked={!myQuestion || !!answered || revealed || questionLeft === 0 || sent?.gq === q.game_question_id}
              chosen={answered?.option_id ?? (sent?.gq === q.game_question_id ? sent.option : null)}
              correctOptionId={revealed ? (data.reveal?.correct_option_id ?? null) : undefined}
              builderResult={revealed && answered ? { is_correct: !!answered.is_correct, correct_text: data.reveal?.correct_text ?? null } : null}
              onChoose={(id) => answer(id, null)}
              onSubmitText={(t) => answer(null, t)}
            />
            {revealed && (
              <FeedbackPanel isCorrect={!!answered?.is_correct} points={answered?.points ?? 0} timedOut={!answered} explanation={data.reveal?.explanation ?? ''}>
                {myQuestion ? (
                  <button onClick={resolve} autoFocus className="mt-4 rounded-xl bg-primary px-8 py-3 text-sm font-bold text-white hover:bg-primary-light">
                    Lanjutkan
                  </button>
                ) : (
                  <p className="mt-3 text-xs font-semibold text-muted">Menunggu {pendingPlayer?.nickname ?? 'pemain'} melanjutkan…</p>
                )}
              </FeedbackPanel>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------
// HASIL AKHIR
function Results({ data }: { data: RoomState }) {
  const isSnake = data.room.settings.game === 'snake'
  const winner = data.state.winner
  const players = data.players
    .filter((p) => p.is_player)
    .sort((a, b) =>
      isSnake
        ? (a.user_id === winner ? -1 : b.user_id === winner ? 1 : b.board_pos - a.board_pos || b.score - a.score)
        : b.score - a.score || b.correct - a.correct,
    )
  const top = players[0]
  return (
    <div className="mx-auto max-w-2xl">
      <div className="text-center">
        <Trophy size={48} className="mx-auto text-gold" />
        <h1 className="mt-2 text-3xl font-extrabold text-primary">{top ? `${top.nickname} juara!` : 'Permainan selesai'}</h1>
        <Arabic className="text-2xl text-snake">مَبْرُوكٌ</Arabic>
        <p className="mt-1 text-sm text-muted">{settingsSummary(data).slice(0, 2).join(' · ')}</p>
      </div>
      <ol className="mt-6 space-y-2">
        {players.map((p, i) => (
          <li key={p.user_id} className={`card flex items-center gap-3 p-3 ${i === 0 ? 'ring-2 ring-gold' : ''} ${p.user_id === data.me ? 'bg-primary/5' : ''}`}>
            <span className={`grid size-9 place-items-center rounded-full text-sm font-extrabold ${i === 0 ? 'bg-gold text-white' : i === 1 ? 'bg-slate-300 text-white' : i === 2 ? 'bg-orange-300 text-white' : 'bg-slate-100'}`}>
              {i + 1}
            </span>
            <PlayerDot p={p} />
            <span className="min-w-0 flex-1 truncate font-semibold">
              {p.nickname} {p.user_id === data.me && <span className="text-sm text-muted">(kamu)</span>}
            </span>
            <span className="text-xs text-muted">
              {isSnake ? `petak ${p.board_pos} · ` : ''}
              {p.correct}/{p.answered} benar
            </span>
            <span className="w-14 text-right font-bold tabular-nums">{p.score}</span>
          </li>
        ))}
      </ol>
      <p className="mt-3 text-center text-xs text-muted">Skor & XP sudah dicatat ke akun masing-masing pemain.</p>
      <div className="mt-6 grid gap-2 sm:grid-cols-3">
        <Link to="/app/leaderboard" className="rounded-xl border border-line bg-white py-3 text-center text-sm font-bold text-primary hover:bg-slate-50">
          Leaderboard
        </Link>
        <Link to="/app/lobby" className="rounded-xl bg-primary py-3 text-center text-sm font-bold text-white hover:bg-primary-light">
          Main bareng lagi
        </Link>
        <Link to="/app" className="rounded-xl border border-line bg-white py-3 text-center text-sm font-bold text-primary hover:bg-slate-50">
          Beranda
        </Link>
      </div>
    </div>
  )
}
