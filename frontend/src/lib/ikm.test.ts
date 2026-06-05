import { describe, expect, it } from 'vitest'
import { hitungIkm, categorizeIkm, NILAI_PERSEPSI, UNSUR_LABEL } from './ikm'

describe('hitungIkm (skala 1-4)', () => {
  it('semua unsur 4 -> IKM 100', () => {
    expect(hitungIkm({ kecepatan: 4, keramahan: 4, informasi: 4, kenyamanan: 4 })).toBe(100)
  })
  it('semua unsur 3 -> IKM 75', () => {
    expect(hitungIkm({ kecepatan: 3, keramahan: 3, informasi: 3, kenyamanan: 3 })).toBe(75)
  })
  it('semua unsur 1 -> IKM 25', () => {
    expect(hitungIkm({ kecepatan: 1, keramahan: 1, informasi: 1, kenyamanan: 1 })).toBe(25)
  })
  it('unsur tidak seragam (1,2,3,4) -> IKM 62.5', () => {
    expect(hitungIkm({ kecepatan: 1, keramahan: 2, informasi: 3, kenyamanan: 4 })).toBe(62.5)
  })
})

describe('konstanta SKM', () => {
  it('NILAI_PERSEPSI berisi 4 label resmi', () => {
    expect(NILAI_PERSEPSI.map((p) => p.label)).toEqual([
      'Tidak Baik',
      'Kurang Baik',
      'Baik',
      'Sangat Baik',
    ])
  })
  it('UNSUR_LABEL memetakan kunci ke label tampilan', () => {
    expect(UNSUR_LABEL.keramahan).toBe('Keramahan & Perilaku')
  })
})

describe('categorizeIkm (tidak berubah)', () => {
  it('100 -> A', () => expect(categorizeIkm(100).grade).toBe('A'))
  it('75 -> C', () => expect(categorizeIkm(75).grade).toBe('C'))
})
