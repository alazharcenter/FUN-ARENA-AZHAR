import type { ReactNode } from 'react'
import { Dices, MessagesSquare, Puzzle } from 'lucide-react'
import type { ArenaId } from '../lib/arenas'

// Teks Arab: selalu RTL dan memakai font berharakat
export function Arabic({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span lang="ar" dir="rtl" className={`arabic ${className}`}>
      {children}
    </span>
  )
}

// Teks campuran Indonesia + Arab (mis. penjelasan jawaban): potongan Arab
// otomatis diberi font berharakat dan arah RTL agar tidak terbalik.
const ARABIC_RUN = /([\u0600-\u06FF]+(?:\s+[\u0600-\u06FF]+)*)/g

export function RichText({ text, className = '' }: { text: string; className?: string }) {
  const parts = text.split(ARABIC_RUN)
  return (
    <span className={className}>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <bdi key={i} lang="ar" dir="rtl" className="arabic text-[1.15em]">
            {part}
          </bdi>
        ) : (
          part
        ),
      )}
    </span>
  )
}

// Teks Arab soal: bagian [[...]] adalah kata yang ditanyakan dan diberi sorotan.
// Penanda dipasang pada batas kata agar sambungan huruf Arab tidak terputus.
export function ArabicMarked({ text, className = '' }: { text: string; className?: string }) {
  const parts = text.split(/\[\[(.+?)\]\]/)
  return (
    <span lang="ar" dir="rtl" className={`arabic ${className}`}>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <mark key={i} className="rounded-lg bg-gold-soft px-1.5 text-inherit underline decoration-gold decoration-2 underline-offset-[10px]">
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </span>
  )
}

export function StageBadge({ stage }: { stage: number }) {
  return (
    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-muted">
      Tahap {stage}
    </span>
  )
}

const ARENA_ICONS = { mufrodat: MessagesSquare, qowaid: Puzzle, snake: Dices }

export function ArenaIcon({ arena, size = 22, className = '' }: { arena: ArenaId; size?: number; className?: string }) {
  const Icon = ARENA_ICONS[arena]
  return <Icon size={size} className={className} />
}

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <img src="/logo-96.png" alt="" width={40} height={40} className="size-10 shrink-0 rounded-[10px] shadow-sm" />
      <span className="leading-tight">
        <span className={`block text-[15px] font-extrabold tracking-tight ${light ? 'text-white' : 'text-primary'}`}>
          Fun Arena
        </span>
        <span className={`block text-[11px] font-semibold uppercase tracking-[0.14em] ${light ? 'text-white/70' : 'text-muted'}`}>
          Azhar Center
        </span>
      </span>
    </span>
  )
}

export function ProgressBar({ value, max, className = 'bg-primary' }: { value: number; max: number; className?: string }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div className={`h-full rounded-full transition-all duration-700 ${className}`} style={{ width: `${pct}%` }} />
    </div>
  )
}
