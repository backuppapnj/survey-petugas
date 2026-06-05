<?php

/**
 * Helper kalkulasi IKM sesuai PermenPAN-RB 14/2017.
 *
 * Skala penilaian aplikasi adalah 1..4 (sama dengan NRR PermenPAN), sehingga
 * Nilai IKM dihitung langsung: rata-rata seluruh unsur (skala 1..4) dikali 25,
 * menghasilkan skala 25..100. Tidak ada konversi skala. Helper ini menjadi
 * sumber kebenaran tunggal di backend dan mencerminkan frontend/src/lib/ikm.ts.
 */

if (! function_exists('hitung_ikm')) {
    /**
     * Menghitung Nilai IKM (25..100) dari rata-rata empat unsur survei
     * pada skala 1..4, sesuai PermenPAN-RB 14/2017.
     *
     * @param float $kecepatan  Rata-rata unsur kecepatan (1..4)
     * @param float $keramahan  Rata-rata unsur keramahan (1..4)
     * @param float $informasi  Rata-rata unsur informasi (1..4)
     * @param float $kenyamanan Rata-rata unsur kenyamanan (1..4)
     * @return float Nilai IKM 25..100 (atau 0 jika seluruh unsur kosong)
     */
    function hitung_ikm(float $kecepatan, float $keramahan, float $informasi, float $kenyamanan): float
    {
        $unsur = [$kecepatan, $keramahan, $informasi, $kenyamanan];

        return round((array_sum($unsur) / count($unsur)) * 25, 2);
    }
}
