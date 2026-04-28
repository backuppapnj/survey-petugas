<?php

namespace Tests\Filters;

use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\DatabaseTestTrait;
use CodeIgniter\Test\FeatureTestTrait;

/**
 * @internal
 */
final class CorsFilterTest extends CIUnitTestCase
{
    use DatabaseTestTrait;
    use FeatureTestTrait;

    protected $migrate   = true;
    protected $refresh   = true;
    protected $seed      = 'App\Database\Seeds\DatabaseSeeder';
    protected $namespace = 'App';

    public function testPreflightOptionsTidakMembutuhkanJwt(): void
    {
        $result = $this->withHeaders([
            'Origin'                         => 'http://localhost:5173',
            'Access-Control-Request-Method'  => 'GET',
            'Access-Control-Request-Headers' => 'Authorization',
        ])->call('options', '/api/admin/petugas');

        // CORS filter harus respond preflight tanpa hit JwtFilter (yang akan return 401)
        $this->assertNotSame(401, $result->getStatusCode());
        $result->assertHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
    }

    public function testRequestNonOptionsTanpaTokenTetap401(): void
    {
        $result = $this->withHeaders(['Origin' => 'http://localhost:5173'])
            ->call('get', '/api/admin/petugas');

        $result->assertStatus(401);
    }
}
