/**
 * Konversi & kategorisasi IKM sesuai PermenPAN-RB 14/2017.
 *
 * Skala penilaian aplikasi: 1..4 (= NRR PermenPAN).
 * Nilai IKM = rata-rata unsur x 25 (skala 25..100).
 *
 * Kategori mutu pelayanan & kinerja (PermenPAN-RB 14/2017 Lampiran III):
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

/** Ambang batas mutu IKM (default PermenPAN-RB 14/2017 Lampiran III). */
export interface IkmThresholds {
  a: number
  b: number
  c: number
}

export const DEFAULT_IKM_THRESHOLDS: IkmThresholds = { a: 88.31, b: 76.61, c: 65.0 }

/**
 * Kategorikan nilai IKM ke grade A/B/C/D. Ambang batas dapat dikustomisasi
 * administrator; default mengikuti PermenPAN-RB 14/2017.
 */
export function categorizeIkm(
  ikm: number,
  thresholds: IkmThresholds = DEFAULT_IKM_THRESHOLDS,
): IkmCategory {
  if (ikm >= thresholds.a)
    return {
      grade: 'A',
      mutu: 'Sangat Baik',
      kinerja: 'Sangat Baik',
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-100 dark:bg-emerald-950/40',
    }
  if (ikm >= thresholds.b)
    return {
      grade: 'B',
      mutu: 'Baik',
      kinerja: 'Baik',
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-100 dark:bg-blue-950/40',
    }
  if (ikm >= thresholds.c)
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

/** Label nilai persepsi resmi PermenPAN-RB 14/2017 (skala 1..4). */
export const NILAI_PERSEPSI = [
  { nilai: 1, label: 'Tidak Baik' },
  { nilai: 2, label: 'Kurang Baik' },
  { nilai: 3, label: 'Baik' },
  { nilai: 4, label: 'Sangat Baik' },
] as const

/** Label tampilan 4 unsur (kolom DB tetap). */
export const UNSUR_LABEL: Record<
  'kecepatan' | 'keramahan' | 'informasi' | 'kenyamanan',
  string
> = {
  kecepatan: 'Kecepatan Pelayanan',
  keramahan: 'Keramahan & Perilaku',
  informasi: 'Kejelasan Informasi',
  kenyamanan: 'Kenyamanan',
}

/** Hitung IKM dari rata-rata 4 unsur (skala 1..4). IKM = rata-rata x 25. */
export function hitungIkm(aspek: {
  kecepatan: number
  keramahan: number
  informasi: number
  kenyamanan: number
}): number {
  const nilai = [aspek.kecepatan, aspek.keramahan, aspek.informasi, aspek.kenyamanan]
  const rataRata = nilai.reduce((sum, v) => sum + v, 0) / nilai.length
  return Number((rataRata * 25).toFixed(2))
}
