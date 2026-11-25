// Dadu dengan titik (pip) 1–6
const PIPS: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
}

export default function Dice({ value, rolling, size = 72 }: { value: number; rolling?: boolean; size?: number }) {
  return (
    <div
      role="img"
      aria-label={`Dadu: ${value}`}
      className={`grid shrink-0 grid-cols-3 grid-rows-3 rounded-[22%] border-2 border-primary/15 bg-white shadow-[0_4px_0_rgba(90,58,48,0.18)] ${
        rolling ? 'animate-[dice-shake_0.35s_ease-in-out_infinite]' : ''
      }`}
      // Padding & jarak dalam piksel: persen pada padding dihitung dari lebar induk, bukan dadu
      style={{ width: size, height: size, padding: size * 0.16, gap: size * 0.06 }}
    >
      {Array.from({ length: 9 }, (_, i) => (
        <span key={i} className={`rounded-full ${PIPS[value]?.includes(i) ? 'bg-primary' : ''}`} />
      ))}
    </div>
  )
}
