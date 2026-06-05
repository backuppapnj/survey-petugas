<?php

namespace Tests\Controllers\Api;

use App\Libraries\JwtLibrary;
use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\DatabaseTestTrait;
use CodeIgniter\Test\FeatureTestTrait;

/**
 * @internal
 */
final class AnomaliControllerTest extends CIUnitTestCase
{
    use DatabaseTestTrait;
    use FeatureTestTrait;

    protected $migrate = true;
    protected $refresh = true;
    protected $seed = 'App\Database\Seeds\DatabaseSeeder';
    protected $namespace = 'App';

    protected function setUp(): void
    {
        parent::setUp();
        cache()->clean(); // hindari kebocoran blacklist token antar-test
    }

    public function testTanpaTokenDitolak401(): void
    {
        $this->call('get', '/api/admin/anomali?start=2026-06-01&end=2026-06-05')
            ->assertStatus(401);
    }

    public function testTanggalTidakValidMengembalikan400(): void
    {
        $token = (new JwtLibrary())->encode(['admin_id' => 1, 'username' => 'admin']);
        $this->withHeaders(['Authorization' => 'Bearer ' . $token])
            ->call('get', '/api/admin/anomali?start=bukan-tanggal&end=2026-06-05')
            ->assertStatus(400);
    }

    public function testRentangTerbalikMengembalikan400(): void
    {
        $token = (new JwtLibrary())->encode(['admin_id' => 1, 'username' => 'admin']);
        $this->withHeaders(['Authorization' => 'Bearer ' . $token])
            ->call('get', '/api/admin/anomali?start=2026-06-10&end=2026-06-01')
            ->assertStatus(400);
    }

    public function testTokenValidMengembalikanStrukturLaporan(): void
    {
        // ANTRIAN_PTSP_URL tidak dikonfigurasi di test -> antrean_tersedia=false.
        $token = (new JwtLibrary())->encode(['admin_id' => 1, 'username' => 'admin']);

        $result = $this->withHeaders(['Authorization' => 'Bearer ' . $token])
            ->call('get', '/api/admin/anomali?start=2026-06-01&end=2026-06-05');

        $result->assertStatus(200);
        $body = json_decode($result->getJSON(), true);

        $this->assertArrayHasKey('range', $body);
        $this->assertArrayHasKey('luar_jam', $body);
        $this->assertArrayHasKey('harian', $body);
        $this->assertArrayHasKey('petugas_outlier', $body);
        $this->assertFalse($body['harian']['antrean_tersedia']);
    }

    public function testTanpaParameterMengembalikan200(): void
    {
        // Tanpa start/end -> default ke hari ini -> 200 (jalur default param).
        $token = (new JwtLibrary())->encode(['admin_id' => 1, 'username' => 'admin']);
        $this->withHeaders(['Authorization' => 'Bearer ' . $token])
            ->call('get', '/api/admin/anomali')
            ->assertStatus(200);
    }

    public function testTanggalOverflowDitolak400(): void
    {
        // 2026-02-30 tidak valid (round-trip jadi 2026-03-02) -> 400.
        $token = (new JwtLibrary())->encode(['admin_id' => 1, 'username' => 'admin']);
        $this->withHeaders(['Authorization' => 'Bearer ' . $token])
            ->call('get', '/api/admin/anomali?start=2026-02-30&end=2026-03-05')
            ->assertStatus(400);
    }
}
