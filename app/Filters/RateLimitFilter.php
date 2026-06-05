<?php

namespace App\Filters;

use CodeIgniter\Filters\FilterInterface;
use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;

/**
 * Rate limiting filter untuk mencegah brute force pada endpoint autentikasi.
 *
 * Menggunakan Throttler bawaan CodeIgniter (algoritma Token Bucket berbasis
 * Cache). Pendekatan ini:
 * - Atomik & bebas race condition (tidak seperti read-modify-write file manual).
 * - Kompatibel shared hosting (default cache handler = file).
 * - Mudah diuji dan idiomatik CI4.
 */
class RateLimitFilter implements FilterInterface
{
    /**
     * Kapasitas token bucket: maksimal 5 percobaan yang terisi penuh
     * dalam 1 menit (rata-rata 1 token per 12 detik).
     */
    private const CAPACITY = 5;

    public function before(RequestInterface $request, $arguments = null)
    {
        $throttler = service('throttler');

        // Kunci berbasis alamat IP. CodeIgniter::getIPAddress() hanya
        // mempercayai header proxy (X-Forwarded-For/X-Real-IP) bila
        // Config\App::$proxyIPs dikonfigurasi secara eksplisit, sehingga
        // aman terhadap IP spoofing pada konfigurasi default.
        $key = 'auth_login_' . md5($request->getIPAddress());

        if ($throttler->check($key, self::CAPACITY, MINUTE) === false) {
            // Minimal 1 detik sesuai perilaku getTokenTime().
            $retryAfter = max(1, $throttler->getTokenTime());

            return service('response')
                ->setStatusCode(429)
                ->setJSON([
                    'status' => 429,
                    'error'  => 'Terlalu banyak percobaan login. Silakan coba lagi dalam ' . $retryAfter . ' detik.',
                ])
                ->setHeader('Retry-After', (string) $retryAfter);
        }
    }

    public function after(RequestInterface $request, ResponseInterface $response, $arguments = null)
    {
        // Tidak ada operasi setelah response.
    }
}
