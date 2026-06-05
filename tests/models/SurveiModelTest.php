<?php

namespace Tests\Models;

use App\Models\SurveiModel;
use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\DatabaseTestTrait;

/**
 * @internal
 */
final class SurveiModelTest extends CIUnitTestCase
{
    use DatabaseTestTrait;

    protected $migrate   = true;
    protected $refresh   = true;
    protected $seed      = 'App\Database\Seeds\DatabaseSeeder';
    protected $namespace = 'App';

    public function testGetRekapByDateRangeKembalikanStrukturKosongJikaTidakAdaData(): void
    {
        $model = new SurveiModel();
        $today = date('Y-m-d');
        $rekap = $model->getRekapByDateRange($today, $today);

        $this->assertSame(0, $rekap['summary']['total_responden']);
        $this->assertSame(0.0, (float) $rekap['summary']['ikm']);
        $this->assertSame([], $rekap['per_petugas']);
        $this->assertSame([], $rekap['semua']);
    }

    public function testGetRekapByDateRangeMenghitungIKMDenganBenar(): void
    {
        $model = new SurveiModel();

        // 2 survei petugas 1, semua "Sangat Baik" (4) -> IKM 100
        $model->insert(['petugas_id' => 1, 'kecepatan' => 4, 'keramahan' => 4, 'informasi' => 4, 'kenyamanan' => 4, 'saran' => null]);
        $model->insert(['petugas_id' => 1, 'kecepatan' => 4, 'keramahan' => 4, 'informasi' => 4, 'kenyamanan' => 4, 'saran' => null]);

        $today = date('Y-m-d');
        $rekap = $model->getRekapByDateRange($today, $today);

        $this->assertSame(2, $rekap['summary']['total_responden']);
        $this->assertSame(100.0, (float) $rekap['summary']['ikm']);
        $this->assertCount(1, $rekap['per_petugas']);
        $this->assertSame('Budi Santoso', $rekap['per_petugas'][0]['nama']);
        $this->assertSame(2, $rekap['per_petugas'][0]['total_responden']);
    }

    public function testGetRekapByDateRangeMenghitungRataRataPerPetugas(): void
    {
        $model = new SurveiModel();

        // Petugas 1: semua "Baik" (3); Petugas 2: semua "Sangat Baik" (4)
        $model->insert(['petugas_id' => 1, 'kecepatan' => 3, 'keramahan' => 3, 'informasi' => 3, 'kenyamanan' => 3]);
        $model->insert(['petugas_id' => 2, 'kecepatan' => 4, 'keramahan' => 4, 'informasi' => 4, 'kenyamanan' => 4]);

        $today = date('Y-m-d');
        $rekap = $model->getRekapByDateRange($today, $today);

        $this->assertSame(2, $rekap['summary']['total_responden']);
        // Rata-rata semua unsur = (3+4)/2 = 3.5 -> IKM 3.5 * 25 = 87.5
        $this->assertSame(87.5, (float) $rekap['summary']['ikm']);
    }

    public function testGetRekapByDateRangeMenghitungIKMSesuaiPermenPANRB(): void
    {
        $model = new SurveiModel();

        // Seluruh unsur "Tidak Baik" (1) -> IKM 1 * 25 = 25 (batas bawah)
        $model->insert(['petugas_id' => 1, 'kecepatan' => 1, 'keramahan' => 1, 'informasi' => 1, 'kenyamanan' => 1]);

        $today = date('Y-m-d');
        $rekap = $model->getRekapByDateRange($today, $today);

        $this->assertSame(1, $rekap['summary']['total_responden']);
        $this->assertSame(25.0, (float) $rekap['summary']['ikm']);
    }
}
