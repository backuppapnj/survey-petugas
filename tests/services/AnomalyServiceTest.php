<?php

namespace Tests\Services;

use App\Libraries\QueueClient;
use App\Services\AnomalyService;
use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\DatabaseTestTrait;

/**
 * @internal
 */
final class AnomalyServiceTest extends CIUnitTestCase
{
    use DatabaseTestTrait;

    protected $migrate = true;
    protected $refresh = true;
    protected $namespace = 'App';

    protected function setUp(): void
    {
        parent::setUp();
        // Ambang dibuat kecil agar outlier mudah diuji secara deterministik.
        putenv('OUTLIER_MIN=3');
        putenv('OUTLIER_FACTOR=2');
        putenv('SERVICE_HOUR_START=8');
        putenv('SERVICE_HOUR_END=16');
    }

    protected function tearDown(): void
    {
        putenv('OUTLIER_MIN');
        putenv('OUTLIER_FACTOR');
        putenv('SERVICE_HOUR_START');
        putenv('SERVICE_HOUR_END');
        parent::tearDown();
    }

    private function seedPetugas(int $id, string $nama): void
    {
        db_connect()->table('petugas')->insert([
            'id' => $id,
            'nama' => $nama,
            'foto' => 'x.png',
            'loket' => 'L1',
            'unit_kerja' => 'Umum',
            'is_active' => 1,
            'created_at' => '2026-06-01 08:00:00',
            'updated_at' => '2026-06-01 08:00:00',
        ]);
    }

    private function survei(int $petugasId, string $createdAt): array
    {
        return [
            'petugas_id' => $petugasId,
            'kecepatan' => 5, 'keramahan' => 5, 'informasi' => 5, 'kenyamanan' => 5,
            'saran' => null, 'created_at' => $createdAt,
        ];
    }

    /** Stub QueueClient dengan map served tetap (atau null). */
    private function stubQueue(?array $map): QueueClient
    {
        return new class($map) extends QueueClient {
            public function __construct(private ?array $stubMap)
            {
                parent::__construct();
            }

            public function getServedCounts(string $start, string $end): ?array
            {
                return $this->stubMap;
            }
        };
    }

    public function testMendeteksiSubmitDiLuarJam(): void
    {
        $this->seedPetugas(1, 'Budi');
        // 2026-06-06 adalah Sabtu (akhir pekan) -> luar jam.
        // 2026-06-02 (Selasa) 07:00 -> sebelum jam buka -> luar jam.
        // 2026-06-02 (Selasa) 10:00 -> dalam jam -> bukan anomali.
        db_connect()->table('survei')->insertBatch([
            $this->survei(1, '2026-06-02 10:00:00'),
            $this->survei(1, '2026-06-02 07:00:00'),
            $this->survei(1, '2026-06-06 11:00:00'),
        ]);

        $service = new AnomalyService(null, null, $this->stubQueue(null));
        $report = $service->analyze('2026-06-01', '2026-06-07');

        $this->assertSame(2, $report['luar_jam']['total']);
        $this->assertCount(2, $report['luar_jam']['items']);
        $this->assertSame('Budi', $report['luar_jam']['items'][0]['nama']);
    }

    public function testMendeteksiSurveiLebihBanyakDariDilayani(): void
    {
        $this->seedPetugas(1, 'Budi');
        // 3 survei pada 2026-06-02 (Selasa) jam normal.
        db_connect()->table('survei')->insertBatch([
            $this->survei(1, '2026-06-02 09:00:00'),
            $this->survei(1, '2026-06-02 10:00:00'),
            $this->survei(1, '2026-06-02 11:00:00'),
        ]);

        // Antrean hanya melayani 1 tamu di tanggal itu -> anomali (3 > 1).
        $service = new AnomalyService(null, null, $this->stubQueue(['2026-06-02' => 1]));
        $report = $service->analyze('2026-06-01', '2026-06-07');

        $this->assertTrue($report['harian']['antrean_tersedia']);
        $hari = array_values(array_filter(
            $report['harian']['items'],
            static fn ($r) => $r['date'] === '2026-06-02'
        ))[0];
        $this->assertSame(3, $hari['survei']);
        $this->assertSame(1, $hari['dilayani']);
        $this->assertTrue($hari['anomali']);
    }

    public function testAntreanTidakTersediaSaatQueueNull(): void
    {
        $this->seedPetugas(1, 'Budi');
        db_connect()->table('survei')->insertBatch([
            $this->survei(1, '2026-06-02 09:00:00'),
        ]);

        $service = new AnomalyService(null, null, $this->stubQueue(null));
        $report = $service->analyze('2026-06-01', '2026-06-07');

        $this->assertFalse($report['harian']['antrean_tersedia']);
        // Tanpa data antrean, tidak ada penanda anomali harian.
        foreach ($report['harian']['items'] as $r) {
            $this->assertFalse($r['anomali']);
        }
    }

    public function testMendeteksiPetugasOutlier(): void
    {
        $this->seedPetugas(1, 'Budi');
        $this->seedPetugas(2, 'Andi');
        $this->seedPetugas(3, 'Cici');

        $rows = [];
        // Budi: 10 survei (outlier), Andi: 2, Cici: 2. Median = 2.
        // OUTLIER_MIN=3, FACTOR=2 -> ambang: count>=3 DAN count>median*2 (>4).
        for ($i = 0; $i < 10; $i++) {
            $rows[] = $this->survei(1, '2026-06-02 09:00:00');
        }
        $rows[] = $this->survei(2, '2026-06-02 09:00:00');
        $rows[] = $this->survei(2, '2026-06-02 10:00:00');
        $rows[] = $this->survei(3, '2026-06-02 09:00:00');
        $rows[] = $this->survei(3, '2026-06-02 10:00:00');
        db_connect()->table('survei')->insertBatch($rows);

        $service = new AnomalyService(null, null, $this->stubQueue(null));
        $report = $service->analyze('2026-06-01', '2026-06-07');

        $this->assertSame(2.0, $report['petugas_outlier']['median']);
        $this->assertCount(1, $report['petugas_outlier']['items']);
        $this->assertSame('Budi', $report['petugas_outlier']['items'][0]['nama']);
        $this->assertSame(10, $report['petugas_outlier']['items'][0]['jumlah']);
        $this->assertSame(5.0, $report['petugas_outlier']['items'][0]['rasio']);
    }

    public function testLaporanKosongTanpaSubmission(): void
    {
        // Tanpa petugas & tanpa survei: laporan harus aman/kosong, bukan error.
        $service = new AnomalyService(null, null, $this->stubQueue(null));
        $report = $service->analyze('2026-06-01', '2026-06-07');

        $this->assertSame(0, $report['luar_jam']['total']);
        $this->assertSame([], $report['luar_jam']['items']);
        $this->assertFalse($report['harian']['antrean_tersedia']);
        $this->assertSame([], $report['harian']['items']);
        $this->assertSame(0.0, $report['petugas_outlier']['median']);
        $this->assertSame([], $report['petugas_outlier']['items']);
    }

    public function testComputeMedianGanjilDanGenap(): void
    {
        $service = new AnomalyService(null, null, $this->stubQueue(null));

        $this->assertSame(0.0, $service->computeMedian([]));
        $this->assertSame(5.0, $service->computeMedian([5]));
        $this->assertSame(2.0, $service->computeMedian([1, 2, 3])); // ganjil
        $this->assertSame(3.0, $service->computeMedian([2, 4]));     // genap -> rata-rata
        $this->assertSame(2.5, $service->computeMedian([1, 2, 3, 4])); // genap
        $this->assertSame(2.0, $service->computeMedian([4, 1, 3, 1])); // tidak terurut -> sort dulu
    }
}
