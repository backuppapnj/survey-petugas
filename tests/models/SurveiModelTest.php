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
        $now   = date('Y-m-d H:i:s');

        // Insert 2 survei untuk petugas 1, semua bintang 5 → IKM 100
        $model->insert(['petugas_id' => 1, 'kecepatan' => 5, 'keramahan' => 5, 'informasi' => 5, 'kenyamanan' => 5, 'saran' => null]);
        $model->insert(['petugas_id' => 1, 'kecepatan' => 5, 'keramahan' => 5, 'informasi' => 5, 'kenyamanan' => 5, 'saran' => null]);

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

        // Petugas 1: bintang 4 untuk semua aspek
        $model->insert(['petugas_id' => 1, 'kecepatan' => 4, 'keramahan' => 4, 'informasi' => 4, 'kenyamanan' => 4]);
        // Petugas 2: bintang 5 untuk semua aspek
        $model->insert(['petugas_id' => 2, 'kecepatan' => 5, 'keramahan' => 5, 'informasi' => 5, 'kenyamanan' => 5]);

        $today = date('Y-m-d');
        $rekap = $model->getRekapByDateRange($today, $today);

        $this->assertSame(2, $rekap['summary']['total_responden']);
        // Rata-rata: ((4+5)/2 + (4+5)/2 + (4+5)/2 + (4+5)/2) / 4 = 4.5; IKM = 4.5/5 * 100 = 90
        $this->assertSame(90.0, (float) $rekap['summary']['ikm']);
    }
}
