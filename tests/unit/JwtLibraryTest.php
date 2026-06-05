<?php

namespace Tests\Unit;

use App\Libraries\JwtLibrary;
use PHPUnit\Framework\TestCase;

class JwtLibraryTest extends TestCase
{
    /**
     * Test that weak/empty secret is rejected.
     */
    public function testJwtEncodeRequiresStrongSecret(): void
    {
        // Simpan env asli
        $originalEnv = getenv('JWT_SECRET_KEY');

        // Test dengan secret kosong
        putenv('JWT_SECRET_KEY=');

        // Should throw exception for weak/empty secret
        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('JWT_SECRET_KEY must be at least 32 characters');

        new JwtLibrary();

        // Restore env
        if ($originalEnv !== false) {
            putenv('JWT_SECRET_KEY=' . $originalEnv);
        }
    }

    /**
     * Test that minimum key length is enforced (256 bits = 32 bytes).
     */
    public function testJwtRejectsShortSecret(): void
    {
        putenv('JWT_SECRET_KEY=short');

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('32 characters');

        new JwtLibrary();
    }

    /**
     * Test token generation with valid secret.
     */
    public function testJwtEncodeWithValidSecret(): void
    {
        $validSecret = str_repeat('a', 32);
        putenv('JWT_SECRET_KEY=' . $validSecret);

        $jwt = new JwtLibrary();
        $token = $jwt->encode(['user_id' => 123]);

        $this->assertNotEmpty($token);
        $this->assertIsString($token);
    }

    /**
     * Test token contains unique jti claim.
     */
    public function testJwtTokenHasUniqueJti(): void
    {
        $validSecret = str_repeat('a', 32);
        putenv('JWT_SECRET_KEY=' . $validSecret);

        $jwt = new JwtLibrary();
        $token1 = $jwt->encode(['user_id' => 1]);
        $token2 = $jwt->encode(['user_id' => 1]);

        // Tokens should be different due to unique jti
        $this->assertNotEquals($token1, $token2);
    }

    /**
     * Test token expiry enforcement.
     */
    public function testJwtDecodeRejectsExpiredToken(): void
    {
        $validSecret = str_repeat('a', 32);
        putenv('JWT_SECRET_KEY=' . $validSecret);

        // Manually create an expired token
        $payload = [
            'user_id' => 123,
            'iat' => time() - 86400,
            'exp' => time() - 3600, // Expired 1 hour ago
            'jti' => bin2hex(random_bytes(16)),
        ];

        $jwt = new JwtLibrary();
        $token = \Firebase\JWT\JWT::encode($payload, $validSecret, 'HS256');

        $decoded = $jwt->decode($token);
        $this->assertNull($decoded);
    }

    /**
     * Test signature verification.
     */
    public function testJwtDecodeRejectsTamperedToken(): void
    {
        $validSecret = str_repeat('a', 32);
        putenv('JWT_SECRET_KEY=' . $validSecret);

        $jwt = new JwtLibrary();
        $token = $jwt->encode(['user_id' => 123]);

        // Tamper with the token
        $parts = explode('.', $token);
        $parts[1] = base64_encode(json_encode(['user_id' => 999])); // Change payload
        $tamperedToken = implode('.', $parts);

        $decoded = $jwt->decode($tamperedToken);
        $this->assertNull($decoded);
    }

    /**
     * Test empty token handling.
     */
    public function testJwtDecodeRejectsEmptyToken(): void
    {
        $validSecret = str_repeat('a', 32);
        putenv('JWT_SECRET_KEY=' . $validSecret);

        $jwt = new JwtLibrary();
        $decoded = $jwt->decode('');

        $this->assertNull($decoded);
    }

    protected function tearDown(): void
    {
        // Clean up environment variable
        putenv('JWT_SECRET_KEY');
    }
}