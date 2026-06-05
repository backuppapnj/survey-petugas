<?php

namespace App\Filters;

use CodeIgniter\Filters\FilterInterface;
use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;

/**
 * Rate limiting filter berbasis Throttler bawaan CodeIgniter (Token Bucket,
 * cache-backed, atomik, kompatibel shared hosting).
 *
 * Profil kapasitas dipilih lewat argumen filter (label), mis. di Routes:
 *   ['filter' => 'ratelimit:login']   -> ketat (anti brute-force)
 *   ['filter' => 'ratelimit:survey']  -> longgar (anti-bot, ramah kiosk)
 *
 * Kapasitas tiap profil dapat ditimpa via .env (RATELIMIT_LOGIN/SURVEY/DEFAULT).
 */
class RateLimitFilter implements FilterInterface
{
    public function before(RequestInterface $request, $arguments = null)
    {
        $label    = (is_array($arguments) && isset($arguments[0])) ? $arguments[0] : 'global';
        $capacity = $this->capacityFor($label);

        $throttler = service('throttler');

        // Kunci per-IP + label. CodeIgniter::getIPAddress() hanya mempercayai
        // header proxy bila App::$proxyIPs dikonfigurasi, sehingga aman dari
        // IP spoofing pada konfigurasi default.
        $key = 'rl_' . $label . '_' . md5($request->getIPAddress());

        if ($throttler->check($key, $capacity, MINUTE) === false) {
            $retryAfter = max(1, $throttler->getTokenTime());

            return service('response')
                ->setStatusCode(429)
                ->setJSON([
                    'status' => 429,
                    'error'  => 'Terlalu banyak permintaan. Silakan coba lagi dalam ' . $retryAfter . ' detik.',
                ])
                ->setHeader('Retry-After', (string) $retryAfter);
        }
    }

    public function after(RequestInterface $request, ResponseInterface $response, $arguments = null)
    {
        // Tidak ada operasi setelah response.
    }

    /**
     * Kapasitas (jumlah aksi per menit) untuk tiap profil rate limit.
     * - login : ketat, mencegah brute-force kredensial.
     * - survey: longgar, mencegah flooding otomatis namun ramah kiosk/IP bersama
     *           (banyak responden sah dari jaringan kantor yang sama).
     */
    private function capacityFor(string $label): int
    {
        return match ($label) {
            'login'  => (int) env('RATELIMIT_LOGIN', 5),
            'survey' => (int) env('RATELIMIT_SURVEY', 30),
            default  => (int) env('RATELIMIT_DEFAULT', 60),
        };
    }
}
