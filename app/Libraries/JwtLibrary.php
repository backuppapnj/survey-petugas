<?php

namespace App\Libraries;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Throwable;

class JwtLibrary
{
    private string $secretKey;
    private string $algorithm = 'HS256';
    private int $expiry;

    private const MIN_KEY_LENGTH = 32; // 256 bits

    /** Prefix cache untuk daftar-cabut (blacklist) berbasis jti. */
    private const REVOKE_CACHE_PREFIX = 'jwt_revoked_';

    public function __construct()
    {
        $secret = (string) env('JWT_SECRET_KEY', '');

        if ($secret === '' || strlen($secret) < self::MIN_KEY_LENGTH) {
            throw new \RuntimeException(
                'JWT_SECRET_KEY must be at least ' . self::MIN_KEY_LENGTH . ' characters.'
            );
        }

        $this->secretKey = $secret;
        // Masa berlaku token dapat dikonfigurasi via .env (detik). Default 24 jam.
        $this->expiry = (int) env('JWT_EXPIRY', 86400);
    }

    public function encode(array $payload): string
    {
        $issuedAt = time();
        $merged   = array_merge($payload, [
            'iat' => $issuedAt,
            'exp' => $issuedAt + $this->expiry,
            'jti' => bin2hex(random_bytes(16)), // ID unik token untuk revocation
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
            // Log token kedaluwarsa untuk monitoring
            if ($e instanceof \Firebase\JWT\ExpiredException) {
                log_message('warning', 'Expired JWT token attempted: ' . $e->getMessage());
            }
            return null;
        }
    }

    /**
     * Cabut (revoke) token berdasarkan jti hingga waktu kedaluwarsanya.
     * Entri blacklist disimpan di cache dengan TTL = sisa umur token, sehingga
     * otomatis terhapus saat token memang sudah kedaluwarsa (hemat penyimpanan).
     */
    public function revoke(string $jti, int $expiresAt): void
    {
        if ($jti === '') {
            return;
        }

        $ttl = $expiresAt - time();
        if ($ttl > 0) {
            cache()->save(self::REVOKE_CACHE_PREFIX . $jti, 1, $ttl);
        }
    }

    /**
     * Periksa apakah sebuah jti sudah dicabut (ada di blacklist).
     */
    public function isRevoked(string $jti): bool
    {
        return $jti !== '' && cache(self::REVOKE_CACHE_PREFIX . $jti) !== null;
    }
}
