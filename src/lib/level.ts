// Sama dengan fungsi level_for_xp di database: level n dimulai pada 100 × (n−1)² XP
export function levelStart(level: number) {
  return 100 * (level - 1) ** 2
}

export function levelProgress(xp: number) {
  const level = Math.floor(Math.sqrt(Math.max(xp, 0) / 100)) + 1
  const start = levelStart(level)
  const next = levelStart(level + 1)
  return { level, current: xp - start, needed: next - start }
}
