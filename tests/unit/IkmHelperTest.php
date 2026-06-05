<?php

namespace Tests\Unit;

use CodeIgniter\Test\CIUnitTestCase;

/**
 * Unit test helper IKM (PermenPAN-RB 14/2017).
 * Skala penilaian 1..4 = NRR langsung; IKM = rata-rata unsur x 25.
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

    public function testHitungIkmMengikutiRumusPermenPANRB(): void
    {
        // Semua "Sangat Baik" (4) -> IKM 100
        $this->assertSame(100.0, hitung_ikm(4.0, 4.0, 4.0, 4.0));
        // Semua "Baik" (3) -> IKM 75 (mutu C, ambang B mulai NRR ~3,06)
        $this->assertSame(75.0, hitung_ikm(3.0, 3.0, 3.0, 3.0));
        // Semua "Kurang Baik" (2) -> IKM 50
        $this->assertSame(50.0, hitung_ikm(2.0, 2.0, 2.0, 2.0));
        // Semua "Tidak Baik" (1) -> IKM 25 (batas bawah)
        $this->assertSame(25.0, hitung_ikm(1.0, 1.0, 1.0, 1.0));
    }

    public function testHitungIkmMerataRatakanUnsurYangTidakSeragam(): void
    {
        // Rata-rata (1+2+3+4)/4 = 2.5 -> IKM 62.5
        $this->assertSame(62.5, hitung_ikm(1.0, 2.0, 3.0, 4.0));
    }

    public function testHitungIkmNolUntukSeluruhUnsurKosong(): void
    {
        $this->assertSame(0.0, hitung_ikm(0.0, 0.0, 0.0, 0.0));
    }
}
