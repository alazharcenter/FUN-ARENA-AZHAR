import { TILE_KINDS } from '../lib/arenas'
import { BOARDS, COLS, boardRows, cellCenter, tileKind, type BoardSize, type SnakeMode } from '../lib/snake'

export interface BoardPiece {
  id: string
  colorClass: string
  pos: number // 0 = belum masuk papan
  active?: boolean
}

// Sedikit geser bidak yang berada di petak sama agar semuanya terlihat
const OFFSETS = [
  [-1, -1], [1, -1], [-1, 1], [1, 1], [0, 0], [0, -1.6],
]

export default function SnakeBoard({
  size,
  mode,
  pieces = [],
  highlight,
}: {
  size: BoardSize
  mode: SnakeMode
  pieces?: BoardPiece[]
  highlight?: number
}) {
  const board = BOARDS[size]
  const rows = size / COLS
  const H = rows * 10 // tinggi koordinat SVG (lebar = 100)
  const pt = (n: number) => {
    const c = cellCenter(n, size)
    return { x: c.x, y: (c.y / 100) * H }
  }

  return (
    <div className="relative mx-auto w-full overflow-hidden rounded-2xl border-2 border-primary/15 bg-white" style={{ aspectRatio: `${COLS} / ${rows}` }}>
      <div className="grid h-full" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)`, gridTemplateRows: `repeat(${rows}, 1fr)` }}>
        {boardRows(size).flat().map((n) => {
          const kind = n === size ? 'normal' : tileKind(n, board, mode)
          const t = TILE_KINDS[kind]
          return (
            <div
              key={n}
              title={`${n} · ${n === size ? 'Finish' : t.label}`}
              className={`relative flex items-center justify-center border-[0.5px] border-primary/10 ${t.className} ${
                highlight === n ? 'z-[1] ring-3 ring-gold ring-inset' : ''
              }`}
            >
              <span className="absolute top-0.5 left-1 text-[8px] font-semibold opacity-60 sm:text-[10px]">{n}</span>
              {n === size ? (
                <span className="text-sm sm:text-xl">🏁</span>
              ) : (
                t.symbol && <span className="arabic text-xs font-bold sm:text-base">{t.symbol}</span>
              )}
            </div>
          )
        })}
      </div>

      {/* Tangga & ular */}
      <svg viewBox={`0 0 100 ${H}`} className="pointer-events-none absolute inset-0 size-full" aria-hidden>
        {Object.entries(board.ladders).map(([from, to]) => {
          const a = pt(+from)
          const b = pt(to)
          const len = Math.hypot(b.x - a.x, b.y - a.y)
          const nx = (-(b.y - a.y) / len) * 1.5
          const ny = ((b.x - a.x) / len) * 1.5
          const rungs = Math.max(2, Math.floor(len / 3))
          return (
            <g key={`l${from}`} stroke="#92400e" strokeLinecap="round" opacity="0.85">
              <line x1={a.x + nx} y1={a.y + ny} x2={b.x + nx} y2={b.y + ny} strokeWidth="0.7" />
              <line x1={a.x - nx} y1={a.y - ny} x2={b.x - nx} y2={b.y - ny} strokeWidth="0.7" />
              {Array.from({ length: rungs }, (_, i) => {
                const t = (i + 0.5) / rungs
                const x = a.x + (b.x - a.x) * t
                const y = a.y + (b.y - a.y) * t
                return <line key={i} x1={x + nx} y1={y + ny} x2={x - nx} y2={y - ny} strokeWidth="0.5" />
              })}
            </g>
          )
        })}
        {Object.entries(board.snakes).map(([from, to]) => {
          const h = pt(+from)
          const t = pt(to)
          const dx = t.x - h.x
          const dy = t.y - h.y
          const len = Math.hypot(dx, dy)
          const nx = -dy / len
          const ny = dx / len
          const w = Math.min(4, len / 5) // lebar kelokan
          const p1 = { x: h.x + dx / 3 + nx * w, y: h.y + dy / 3 + ny * w }
          const p2 = { x: h.x + (dx * 2) / 3 - nx * w, y: h.y + (dy * 2) / 3 - ny * w }
          const d = `M${h.x} ${h.y} C${p1.x} ${p1.y} ${p2.x} ${p2.y} ${t.x} ${t.y}`
          return (
            <g key={`s${from}`} opacity="0.85">
              <path d={d} fill="none" stroke="#b91c1c" strokeWidth="2" strokeLinecap="round" />
              <path d={d} fill="none" stroke="#f87171" strokeWidth="0.8" strokeLinecap="round" strokeDasharray="0.8 1.6" />
              <circle cx={h.x} cy={h.y} r="1.9" fill="#b91c1c" />
              <circle cx={h.x - 0.6} cy={h.y - 0.4} r="0.35" fill="white" />
              <circle cx={h.x + 0.6} cy={h.y - 0.4} r="0.35" fill="white" />
            </g>
          )
        })}
      </svg>

      {/* Bidak: posisi absolut agar bisa bergerak halus antar petak */}
      {pieces
        .filter((p) => p.pos > 0)
        .map((p) => {
          const same = pieces.filter((o) => o.pos === p.pos)
          const [ox, oy] = same.length > 1 ? OFFSETS[same.indexOf(p) % OFFSETS.length] : [0, 0]
          const c = cellCenter(p.pos, size)
          return (
            <span
              key={p.id}
              className={`absolute z-10 aspect-square w-[4.2%] min-w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-md transition-all duration-200 ease-out ${p.colorClass} ${
                p.active ? 'z-20 scale-125 ring-2 ring-gold' : ''
              }`}
              // Geser 1,2% lebar papan ke samping/atas; persen tinggi dikonversi agar jaraknya sama
              style={{ left: `${c.x + ox * 1.2}%`, top: `${c.y + oy * 1.2 * (COLS / rows)}%` }}
            />
          )
        })}
    </div>
  )
}
