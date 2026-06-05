<?php

namespace Tests\Models;

use App\Models\SurveiModel;
use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\DatabaseTestTrait;

/**
 * @internal
 */
final class SurveiModelRangeTest extends CIUnitTestCase
{
    use DatabaseTestTrait;

    protected $migrate = true;
    protected $refresh = true;
    protected $namespace = 'App';

    private function seedPetugas(int $id): void
    {
        db_connect()->table('petugas')->insert([
            'id' => $id,
            'nama' => 'Petugas ' . $id,
            'foto' => 'x.png',
            'loket' => 'L1',
            'unit_kerja' => 'Umum',
            'is_active' => 1,
            'created_at' => '2026-06-01 08:00:00',
            'updated_at' => '2026-06-01 08:00:00',
        ]);
    }

    public function testGetSubmissionsInRangeHanyaDalamRentang(): void
    {
        $this->seedPetugas(1);
        db_connect()->table('survei')->insertBatch([
            ['petugas_id' => 1, 'kecepatan' => 5, 'keramahan' => 5, 'informasi' => 5, 'kenyamanan' => 5, 'saran' => null, 'created_at' => '2026-06-02 09:00:00'],
            ['petugas_id' => 1, 'kecepatan' => 4, 'keramahan' => 4, 'informasi' => 4, 'kenyamanan' => 4, 'saran' => null, 'created_at' => '2026-06-03 10:00:00'],
            // Di luar rentang — harus diabaikan.
            ['petugas_id' => 1, 'kecepatan' => 3, 'keramahan' => 3, 'informasi' => 3, 'kenyamanan' => 3, 'saran' => null, 'created_at' => '2026-05-30 10:00:00'],
        ]);

        $rows = (new SurveiModel())->getSubmissionsInRange('2026-06-01', '2026-06-05');

        $this->assertCount(2, $rows);
        $this->assertSame('2026-06-02 09:00:00', $rows[0]['created_at']);
        $this->assertArrayHasKey('petugas_id', $rows[0]);
        $this->assertArrayNotHasKey('kecepatan', $rows[0]); // hanya kolom lean
    }
}
