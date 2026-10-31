import { describe, expect, it } from 'vitest'
import { BOARDS, MODES, boardRows, cellCenter, isChallenge, stepPath, tileKind, type BoardSize } from './snake'

describe('papan ular tangga', () => {
  for (const size of [50, 100] as BoardSize[]) {
    const b = BOARDS[size]
    it(`papan ${size}: tangga naik, ular turun, tidak bertumpuk`, () => {
      for (const [from, to] of Object.entries(b.ladders)) expect(to).toBeGreaterThan(Number(from))
      for (const [from, to] of Object.entries(b.snakes)) expect(to).toBeLessThan(Number(from))
      const starts = [...Object.keys(b.ladders), ...Object.keys(b.snakes)].map(Number)
      expect(new Set(starts).size).toBe(starts.length) // satu petak hanya satu efek
      for (const end of [...Object.values(b.ladders), ...Object.values(b.snakes)]) {
        expect(starts).not.toContain(end) // tidak ada efek berantai
        expect(end).toBeGreaterThanOrEqual(1)
        expect(end).toBeLessThan(size)
      }
    })
    it(`papan ${size}: petak awal & akhir selalu normal`, () => {
      for (const mode of Object.keys(MODES) as (keyof typeof MODES)[]) {
        expect(tileKind(1, b, mode)).toBe('normal')
        expect(tileKind(size, b, mode)).toBe('normal')
      }
    })
    it(`papan ${size}: tata letak zig-zag benar`, () => {
      const rows = boardRows(size)
      expect(rows.flat().sort((x, y) => x - y)).toEqual(Array.from({ length: size }, (_, i) => i + 1))
      expect(rows.at(-1)![0]).toBe(1) // petak 1 di kiri bawah
      expect(cellCenter(1, size).x).toBeLessThan(cellCenter(10, size).x)
      expect(cellCenter(11, size).x).toBeGreaterThan(cellCenter(20, size).x) // baris kedua berbalik arah
    })
  }

  it('petak tantangan mengikuti mode', () => {
    const b = BOARDS[100]
    for (let n = 2; n < 100; n++) {
      const k = tileKind(n, b, 'qowaid')
      if (isChallenge(k)) expect(MODES.qowaid.tiles).toContain(k)
    }
    expect(tileKind(6, b, 'casual')).not.toBe(tileKind(6, b, 'qowaid'))
  })
})

describe('stepPath', () => {
  it('maju biasa', () => expect(stepPath(0, 3, 50)).toEqual([1, 2, 3]))
  it('memantul di petak terakhir', () => expect(stepPath(48, 5, 50)).toEqual([49, 50, 49, 48, 47]))
  it('mundur tidak keluar papan', () => expect(stepPath(2, -3, 50)).toEqual([1, 1, 1]))
})
