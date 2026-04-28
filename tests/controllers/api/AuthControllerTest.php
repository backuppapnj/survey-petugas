<?php

namespace Tests\Controllers\Api;

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
}
