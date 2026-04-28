/**
 * Konversi & kategorisasi IKM sesuai PermenPAN-RB 14/2017.
 *
 * Skala internal aplikasi: rata-rata bintang 1..5 per aspek.
 * Konversi ke NRR tertimbang (1..4) -> NRR x 25 -> Nilai IKM (25..100).
 *
 * Karena form survei pakai skala 1..5, kita normalisasi:
 *   nrr_aspek = ((rata5 - 1) / 4) * 3 + 1   // map 1..5 -> 1..4
 *   ikm = nrr_total * 25
 *
 * Mutu pelayanan & kinerja (PermenPAN-RB 14/2017 Lampiran III):
 *   25.00 - 64.99   D  Tidak Baik
 *   65.00 - 76.60   C  Kurang Baik
 *   76.61 - 88.30   B  Baik
 *   88.31 - 100.00  A  Sangat Baik
 */

export type IkmCategory = {
  grade: 'A' | 'B' | 'C' | 'D'
  mutu: string
  kinerja: string
  color: string
  bg: string
}

export function categorizeIkm(ikm: number): IkmCategory {
  if (ikm >= 88.31)
    return {
      grade: 'A',
      mutu: 'Sangat Baik',
      kinerja: 'Sangat Baik',
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-100 dark:bg-emerald-950/40',
    }
  if (ikm >= 76.61)
    return {
      grade: 'B',
      mutu: 'Baik',
      kinerja: 'Baik',
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-100 dark:bg-blue-950/40',
    }
  if (ikm >= 65.0)
    return {
      grade: 'C',
      mutu: 'Kurang Baik',
      kinerja: 'Kurang Baik',
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-100 dark:bg-amber-950/40',
    }
  return {
    grade: 'D',
    mutu: 'Tidak Baik',
    kinerja: 'Tidak Baik',
    color: 'text-rose-600 dark:text-rose-400',
    bg: 'bg-rose-100 dark:bg-rose-950/40',
  }
}

/** Map nilai bintang 1..5 ke skala NRR PermenPAN 1..4 */
export function rata5ToNrr(rata5: number): number {
  if (rata5 <= 0) return 0
  return ((rata5 - 1) / 4) * 3 + 1
}

/** Hitung IKM dari rata-rata 4 aspek (skala 1..5). */
export function hitungIkm(aspek: {
  kecepatan: number
  keramahan: number
  informasi: number
  kenyamanan: number
}): number {
  const nilai = [aspek.kecepatan, aspek.keramahan, aspek.informasi, aspek.kenyamanan]
  const nrrTotal =
    nilai.reduce((sum, v) => sum + rata5ToNrr(v), 0) / nilai.length
  return Number((nrrTotal * 25).toFixed(2))
}
