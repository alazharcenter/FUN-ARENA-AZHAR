import type { Badge } from '../lib/api'

// Badge asli dari server. Yang belum didapat ditampilkan pudar beserta syaratnya.
export default function BadgeGrid({ badges, limit, cols = 'grid-cols-3 sm:grid-cols-4' }: { badges: Badge[]; limit?: number; cols?: string }) {
  const list = badges
    .slice()
    .sort((a, b) => Number(!!b.earned_at) - Number(!!a.earned_at))
    .slice(0, limit)
  return (
    <div className={`grid gap-3 ${cols}`}>
      {list.map((b) => (
        <div
          key={b.code}
          title={`${b.description}${b.earned_at ? ` · didapat ${new Date(b.earned_at).toLocaleDateString('id-ID')}` : ' · belum didapat'}`}
          className={`flex flex-col items-center gap-1.5 text-center ${b.earned_at ? '' : 'opacity-35 grayscale'}`}
        >
          <span className="grid size-12 place-items-center rounded-2xl bg-stone-50 text-2xl">{b.icon}</span>
          <span className="text-[11px] leading-tight font-medium">{b.name}</span>
        </div>
      ))}
    </div>
  )
}
