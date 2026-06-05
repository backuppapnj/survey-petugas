<?php

namespace Tests\Unit;

use CodeIgniter\Test\CIUnitTestCase;
use Config\Cors;

/**
 * Test keamanan konfigurasi CORS.
 * Memastikan header sensitif tidak diekspos dan header aman tetap tersedia.
 *
 * @internal
 */
final class CorsConfigTest extends CIUnitTestCase
{
    public function testTidakMengeksposHeaderRateLimit(): void
    {
        $config = new Cors();
        $exposed = $config->default['exposedHeaders'] ?? [];

        // Header rate limit tidak boleh diekspos (mencegah information disclosure)
        $this->assertNotContains('X-RateLimit-Limit', $exposed);
        $this->assertNotContains('X-RateLimit-Remaining', $exposed);
    }

    public function testMengeksposHeaderAman(): void
    {
        $config = new Cors();
        $exposed = $config->default['exposedHeaders'] ?? [];

        // X-Total-Count aman diekspos (praktik umum paginasi API)
        $this->assertContains('X-Total-Count', $exposed);
    }

    public function testMethodHttpYangDiizinkan(): void
    {
        $config = new Cors();
        $methods = $config->default['allowedMethods'] ?? [];

        foreach (['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'] as $method) {
            $this->assertContains($method, $methods);
        }
    }
}
