<?php

namespace Tests\Unit;

use CodeIgniter\Test\CIUnitTestCase;

/**
 * Unit test untuk helper konversi IKM (PermenPAN-RB 14/2017).
 *
 * Memverifikasi konversi skala bintang 1..5 ke Nilai IKM 25..100 lewat
 * NRR (Nilai Rata-rata Tertimbang) skala 1..4. Pure function, tanpa database.
 *
 * @internal
 */
final class IkmHelperTest extends CIUnitTestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        helper('ikm');
    }

    public function testRata5KeNrrMemetakanSkala1Sampai5KeSkala1Sampai4(): void
    {
        // Batas bawah: bintang 1 → NRR 1 (PermenPAN), bukan 0.8
        $this->assertSame(1.0, rata5_ke_nrr(1.0));
        // Tengah: bintang 3 → NRR 2.5
        $this->assertSame(2.5, rata5_ke_nrr(3.0));
        // Batas atas: bintang 5 → NRR 4
        $this->assertSame(4.0, rata5_ke_nrr(5.0));
        // Nilai kosong/nol → 0 (tidak ada responden)
        $this->assertSame(0.0, rata5_ke_nrr(0.0));
    }

    public function testHitungIkmMengikutiRumusPermenPANRB(): void
    {
        // Semua unsur bintang 5 → IKM 100 (batas atas, sama dengan rumus lama)
        $this->assertSame(100.0, hitung_ikm(5.0, 5.0, 5.0, 5.0));
        // Semua unsur bintang 1 → IKM 25 (batas bawah PermenPAN, BUKAN 20)
        $this->assertSame(25.0, hitung_ikm(1.0, 1.0, 1.0, 1.0));
        // Semua unsur bintang 3 → IKM 62.5 (BUKAN 60)
        $this->assertSame(62.5, hitung_ikm(3.0, 3.0, 3.0, 3.0));
        // Semua unsur bintang 4 → IKM 81.25 (BUKAN 80)
        $this->assertSame(81.25, hitung_ikm(4.0, 4.0, 4.0, 4.0));
    }

    public function testHitungIkmMerataRatakanUnsurYangTidakSeragam(): void
    {
        // Unsur berbeda-beda membuktikan agregasi NRR lintas-unsur benar
        // (bukan sekadar meneruskan satu nilai). NRR = [1, 1.75, 2.5, 3.25],
        // rata-rata = 2.125, IKM = 2.125 * 25 = 53.13.
        $this->assertSame(53.13, hitung_ikm(1.0, 2.0, 3.0, 4.0));
    }
}
