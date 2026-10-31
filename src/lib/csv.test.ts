import { describe, expect, it } from 'vitest'
import { parseCsv } from './csv'

describe('parseCsv', () => {
  it('koma & kutip', () => {
    expect(parseCsv('a,b,c\n1,"dua, tiga","kata ""kutip"""')).toEqual([
      ['a', 'b', 'c'],
      ['1', 'dua, tiga', 'kata "kutip"'],
    ])
  })
  it('titik koma (Excel Indonesia), BOM, CRLF, baris kosong', () => {
    expect(parseCsv('﻿jenis;soal\r\nvocab;قَلَمٌ\r\n\r\n')).toEqual([
      ['jenis', 'soal'],
      ['vocab', 'قَلَمٌ'],
    ])
  })
  it('baris baru di dalam kutip', () => {
    expect(parseCsv('a,b\n"baris 1\nbaris 2",x')).toEqual([
      ['a', 'b'],
      ['baris 1\nbaris 2', 'x'],
    ])
  })
})
