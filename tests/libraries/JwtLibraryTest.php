<?php

namespace Tests\Libraries;

use App\Libraries\JwtLibrary;
use CodeIgniter\Test\CIUnitTestCase;

/**
 * @internal
 */
final class JwtLibraryTest extends CIUnitTestCase
{
    public function testEncodeDanDecodeMengembalikanPayloadAsli(): void
    {
        $jwt     = new JwtLibrary();
        $payload = ['admin_id' => 1, 'username' => 'admin'];

        $token   = $jwt->encode($payload);
        $decoded = $jwt->decode($token);

        $this->assertNotNull($decoded);
        $this->assertSame(1, $decoded->admin_id);
        $this->assertSame('admin', $decoded->username);
    }

    public function testDecodeMengembalikanNullUntukTokenInvalid(): void
    {
        $jwt = new JwtLibrary();

        $this->assertNull($jwt->decode('token-invalid-sekali'));
        $this->assertNull($jwt->decode(''));
    }

    public function testTokenMemilikiClaimIatDanExp(): void
    {
        $jwt   = new JwtLibrary();
        $token = $jwt->encode(['admin_id' => 1]);

        $decoded = $jwt->decode($token);

        $this->assertNotNull($decoded);
        $this->assertGreaterThan(0, $decoded->iat);
        $this->assertGreaterThan($decoded->iat, $decoded->exp);
    }
}
