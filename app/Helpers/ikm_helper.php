<?php

/**
 * Helper konversi & kalkulasi IKM sesuai PermenPAN-RB 14/2017.
 *
 * Form survei memakai skala bintang 1..5, sedangkan metodologi IKM resmi
 * memakai NRR (Nilai Rata-rata) skala 1..4 yang dikalikan 25 menjadi Nilai
 * IKM 25..100. Helper ini menjadi sumber kebenaran tunggal di sisi backend
 * dan mencerminkan logika frontend pada frontend/src/lib/ikm.ts (jaga DRY).
 *
 * Konversi: nrr = ((rata5 - 1) / 4) * 3 + 1   // map 1..5 -> 1..4
 *           ikm = rata-rata NRR seluruh unsur * 25
 */

if (! function_exists('rata5_ke_nrr')) {
    /**
     * Memetakan nilai skala bintang 1..5 ke NRR PermenPAN skala 1..4.
     * Nilai <= 0 (tidak ada responden) dikembalikan sebagai 0.
     *
     * @param float $rata5 Rata-rata nilai unsur pada skala 1..5
     * @return float NRR pada skala 1..4 (atau 0 jika kosong)
     */
    function rata5_ke_nrr(float $rata5): float
    {
        if ($rata5 <= 0) {
            return 0.0;
        }

        return (($rata5 - 1) / 4) * 3 + 1;
    }
}

if (! function_exists('hitung_ikm')) {
    /**
     * Menghitung Nilai IKM (25..100) dari rata-rata empat unsur survei
     * pada skala 1..5, sesuai PermenPAN-RB 14/2017.
     *
     * Tiap unsur dikonversi ke NRR (skala 1..4) lalu dirata-ratakan dengan
     * bobot setara, kemudian dikalikan 25. Hasil dibulatkan 2 desimal.
     *
     * @param float $kecepatan  Rata-rata unsur kecepatan (1..5)
     * @param float $keramahan  Rata-rata unsur keramahan (1..5)
     * @param float $informasi  Rata-rata unsur informasi (1..5)
     * @param float $kenyamanan Rata-rata unsur kenyamanan (1..5)
     * @return float Nilai IKM 25..100 (atau 0 jika seluruh unsur kosong)
     */
    function hitung_ikm(float $kecepatan, float $keramahan, float $informasi, float $kenyamanan): float
    {
        $unsur    = [$kecepatan, $keramahan, $informasi, $kenyamanan];
        $nrrTotal = array_sum(array_map('rata5_ke_nrr', $unsur)) / count($unsur);

        return round($nrrTotal * 25, 2);
    }
}
