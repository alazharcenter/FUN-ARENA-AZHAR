import { describe, expect, it } from 'vitest'
import { levelProgress, levelStart } from './level'

// Harus sama dengan level_for_xp di database: floor(sqrt(xp / 100)) + 1
const sqlLevel = (xp: number) => Math.floor(Math.sqrt(xp / 100)) + 1

describe('level', () => {
  it('level awal', () => expect(levelProgress(0)).toEqual({ level: 1, current: 0, needed: 100 }))
  it('naik tepat di batas', () => {
    expect(levelProgress(99).level).toBe(1)
    expect(levelProgress(100)).toEqual({ level: 2, current: 0, needed: 300 })
    expect(levelStart(3)).toBe(400)
  })
  it('sama dengan perhitungan server', () => {
    for (let xp = 0; xp <= 50000; xp += 37) {
      const p = levelProgress(xp)
      expect(p.level).toBe(sqlLevel(xp))
      expect(p.current).toBeGreaterThanOrEqual(0)
      expect(p.current).toBeLessThan(p.needed)
    }
  })
})
