<?php

namespace Tests\Controllers\Api;

use App\Libraries\JwtLibrary;
use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\DatabaseTestTrait;
use CodeIgniter\Test\FeatureTestTrait;

/**
 * @internal
 */
final class AuthControllerTest extends CIUnitTestCase
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
        // Bersihkan cache agar blacklist token & throttler tidak bocor antar-test.
        cache()->clean();
    }

    public function testLoginSuksesMengembalikanToken(): void
    {
        $result = $this->withBodyFormat('json')->call('post', '/api/login', [
            'username' => 'admin',
            'password' => 'admin123',
        ]);

        $result->assertStatus(200);
        $body = json_decode($result->getJSON(), true);

        $this->assertArrayHasKey('token', $body);
        $this->assertNotEmpty($body['token']);
        $this->assertSame('admin', $body['admin']['username']);
    }

    public function testLoginGagalDenganPasswordSalah(): void
    {
        $result = $this->withBodyFormat('json')->call('post', '/api/login', [
            'username' => 'admin',
            'password' => 'password-salah',
        ]);

        $result->assertStatus(401);
    }

    public function testLoginGagalTanpaUsername(): void
    {
        $result = $this->withBodyFormat('json')->call('post', '/api/login', [
            'password' => 'admin123',
        ]);

        $result->assertStatus(422);
    }

    public function testLoginDenganJsonRusakMengembalikan400(): void
    {
        // JSON rusak harus 400 (bad request), bukan 500.
        $result = $this->withBody('{bad json')
            ->withHeaders(['Content-Type' => 'application/json'])
            ->call('post', '/api/login');

        $result->assertStatus(400);
    }

    public function testLogoutMencabutTokenSehinggaDitolakBerikutnya(): void
    {
        $token   = (new JwtLibrary())->encode(['admin_id' => 1, 'username' => 'admin']);
        $headers = ['Authorization' => 'Bearer ' . $token];

        // Sebelum logout: token sah -> akses admin OK.
        $this->withHeaders($headers)->call('get', '/api/admin/petugas')->assertStatus(200);

        // Logout: cabut token saat ini.
        $this->withHeaders($headers)->call('post', '/api/admin/logout')->assertStatus(200);

        // Setelah logout: token yang sama harus ditolak (401), walau belum kedaluwarsa.
        $this->withHeaders($headers)->call('get', '/api/admin/petugas')->assertStatus(401);
    }
}
