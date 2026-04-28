<?php

namespace App\Libraries;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Throwable;

class JwtLibrary
{
    private string $secretKey;
    private string $algorithm = 'HS256';
    private int $expiry       = 86400; // 24 jam

    public function __construct()
    {
        $this->secretKey = (string) env('JWT_SECRET_KEY', 'default-secret-key-change-me');
    }

    public function encode(array $payload): string
    {
        $issuedAt = time();
        $merged   = array_merge($payload, ['iat' => $issuedAt, 'exp' => $issuedAt + $this->expiry]);

        return JWT::encode($merged, $this->secretKey, $this->algorithm);
    }

    public function decode(string $token): ?object
    {
        if ($token === '') {
            return null;
        }

        try {
            return JWT::decode($token, new Key($this->secretKey, $this->algorithm));
        } catch (Throwable) {
            return null;
        }
    }
}
