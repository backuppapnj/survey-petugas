<?php

namespace App\Libraries;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Throwable;

class JwtLibrary
{
    private string $secretKey;
    private string $algorithm = 'HS256';
    private int $expiry = 86400; // 24 hours

    private const MIN_KEY_LENGTH = 32; // 256 bits

    public function __construct()
    {
        $secret = (string) env('JWT_SECRET_KEY', '');

        if ($secret === '' || strlen($secret) < self::MIN_KEY_LENGTH) {
            throw new \RuntimeException(
                'JWT_SECRET_KEY must be at least ' . self::MIN_KEY_LENGTH . ' characters.'
            );
        }

        $this->secretKey = $secret;
    }

    public function encode(array $payload): string
    {
        $issuedAt = time();
        $merged = array_merge($payload, [
            'iat' => $issuedAt,
            'exp' => $issuedAt + $this->expiry,
            'jti' => bin2hex(random_bytes(16)), // Unique token ID for revocation
        ]);

        return JWT::encode($merged, $this->secretKey, $this->algorithm);
    }

    public function decode(string $token): ?object
    {
        if ($token === '') {
            return null;
        }

        try {
            return JWT::decode($token, new Key($this->secretKey, $this->algorithm));
        } catch (Throwable $e) {
            // Log expired tokens for monitoring
            if ($e instanceof \Firebase\JWT\ExpiredException) {
                log_message('warning', 'Expired JWT token attempted: ' . $e->getMessage());
            }
            return null;
        }
    }

    public function decodeWithExpiry(string $token): ?object
    {
        if ($token === '') {
            return null;
        }

        try {
            $decoded = JWT::decode($token, new Key($this->secretKey, $this->algorithm));
            return $decoded;
        } catch (Throwable $e) {
            // Log expired tokens for monitoring
            if ($e instanceof \Firebase\JWT\ExpiredException) {
                log_message('warning', 'Expired JWT token attempted: ' . $e->getMessage());
            }
            return null;
        }
    }
}