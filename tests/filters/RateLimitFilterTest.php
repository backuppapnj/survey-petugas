<?php

namespace Tests\Filters;

use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\DatabaseTestTrait;
use CodeIgniter\Test\FeatureTestTrait;

/**
 * Feature test untuk RateLimitFilter pada endpoint /api/login.
 * Menguji perilaku nyata melalui pipeline filter (bukan mock),
 * konsisten dengan pendekatan CorsFilterTest.
 *
 * @internal
 */
final class RateLimitFilterTest extends CIUnitTestCase
{
    use DatabaseTestTrait;
    use FeatureTestTrait;

    protected $migrate   = true;
    protected $refresh   = true;
    protected $seed      = 'App\Database\Seeds\DatabaseSeeder';
    protected $namespace = 'App';

    protected function setUp(): void
    {
        parent::setUp();
        // Throttler menyimpan token bucket di cache; bersihkan agar
        // hitungan tidak bocor antar pengujian.
        cache()->clean();
    }

    protected function tearDown(): void
    {
        cache()->clean();
        parent::tearDown();
    }

    /**
     * Helper: kirim percobaan login dengan kredensial salah.
     * Rate limit filter berjalan SEBELUM controller, sehingga tetap
     * dihitung walau kredensial salah.
     */
    private function attemptLogin()
    {
        return $this->withBody(json_encode(['username' => 'admin', 'password' => 'salah']))
            ->withHeaders(['Content-Type' => 'application/json'])
            ->call('post', '/api/login');
    }

    public function testLimaPercobaanPertamaTidakDiblokir(): void
    {
        for ($i = 1; $i <= 5; $i++) {
            $result = $this->attemptLogin();
            // Tidak boleh 429 untuk 5 percobaan pertama (boleh 401 karena kredensial salah)
            $this->assertNotSame(429, $result->getStatusCode(), "Percobaan ke-$i seharusnya tidak diblokir");
        }
    }

    public function testPercobaanKeenamDiblokirDengan429(): void
    {
        for ($i = 1; $i <= 5; $i++) {
            $this->attemptLogin();
        }

        // Percobaan ke-6 harus diblokir
        $result = $this->attemptLogin();
        $result->assertStatus(429);
    }

    public function testResponse429MemilikiHeaderRetryAfter(): void
    {
        for ($i = 1; $i <= 6; $i++) {
            $result = $this->attemptLogin();
        }

        $this->assertTrue($result->response()->hasHeader('Retry-After'));
    }

    public function testPesanError429DalamBahasaIndonesia(): void
    {
        for ($i = 1; $i <= 6; $i++) {
            $result = $this->attemptLogin();
        }

        $body = json_decode($result->getJSON(), true);
        $this->assertArrayHasKey('error', $body);
        $this->assertStringContainsString('Terlalu banyak', $body['error']);
    }

    public function testEndpointNonAuthTidakDibatasi(): void
    {
        // Endpoint publik non-auth tidak boleh kena rate limit
        for ($i = 1; $i <= 8; $i++) {
            $result = $this->call('get', '/api/petugas/1');
            $this->assertNotSame(429, $result->getStatusCode());
        }
    }
}
