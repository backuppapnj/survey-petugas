<?php

namespace App\Libraries;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use RuntimeException;
use Throwable;

class JwtLibrary
{
    /**
     * Nilai default yang TIDAK BOLEH dipakai di lingkungan produksi.
     */
    private const INSECURE_DEFAULT_KEY = 'default-secret-key-change-me';

    private string $secretKey;
    private string $algorithm = 'HS256';
    private int $expiry       = 86400; // 24 jam

    public function __construct()
    {
        $secret = (string) env('JWT_SECRET_KEY', '');

        // Di produksi, secret key WAJIB di-set lewat environment dan tidak boleh
        // memakai nilai default yang tidak aman. Mencegah token mudah dipalsukan.
        if (ENVIRONMENT === 'production' && ($secret === '' || $secret === self::INSECURE_DEFAULT_KEY)) {
            throw new RuntimeException(
                'JWT_SECRET_KEY belum dikonfigurasi. Set variabel environment JWT_SECRET_KEY '
                . 'dengan string acak yang aman sebelum menjalankan aplikasi di produksi.',
            );
        }

        // Di non-produksi, izinkan fallback default agar pengembangan lokal lancar.
        $this->secretKey = $secret !== '' ? $secret : self::INSECURE_DEFAULT_KEY;
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
