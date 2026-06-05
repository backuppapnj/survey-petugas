<?php

namespace App\Filters;

use CodeIgniter\Filters\FilterInterface;
use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;

/**
 * Rate limiting filter to prevent brute force attacks on authentication endpoints.
 * Uses file-based cache for shared hosting compatibility (multiple PHP processes).
 */
class RateLimitFilter implements FilterInterface
{
    private const MAX_REQUESTS = 5;      // Max requests per window
    private const WINDOW_SECONDS = 60;   // Time window in seconds

    /**
     * Get the client IP address with proper validation.
     * Only trusts X-Forwarded-For when behind a known reverse proxy.
     */
    private function getClientIp(RequestInterface $request): string
    {
        $config = config('App');

        // If we have trusted proxies, check X-Forwarded-For
        if (!empty($config->proxyIPs)) {
            $ip = $request->getHeaderLine('X-Forwarded-For');

            if ($ip !== null && $ip !== '') {
                // X-Forwarded-For can contain multiple IPs: client, proxy1, proxy2
                // Take the first (leftmost) IP as that's the original client
                $ips = array_map('trim', explode(',', $ip));
                $clientIp = $ips[0] ?? '';

                // Validate IP format
                if ($this->isValidIp($clientIp)) {
                    return $clientIp;
                }
            }

            // Check X-Real-IP as fallback
            $ip = $request->getHeaderLine('X-Real-IP');
            if ($ip !== null && $ip !== '' && $this->isValidIp($ip)) {
                return $ip;
            }
        }

        // Fall back to direct connection IP
        return $request->getIPAddress();
    }

    /**
     * Validate IP address format.
     */
    private function isValidIp(string $ip): bool
    {
        return filter_var($ip, FILTER_VALIDATE_IP) !== false;
    }

    /**
     * Get rate limit cache file path.
     */
    private function getCacheFile(): string
    {
        return WRITEPATH . 'cache' . DIRECTORY_SEPARATOR . 'ratelimit.json';
    }

    /**
     * Load rate limit data from file.
     */
    private function loadRateLimitData(): array
    {
        $cacheFile = $this->getCacheFile();

        if (!is_file($cacheFile)) {
            return [];
        }

        $content = @file_get_contents($cacheFile);
        if ($content === false) {
            return [];
        }

        $data = json_decode($content, true);
        return is_array($data) ? $data : [];
    }

    /**
     * Save rate limit data to file.
     */
    private function saveRateLimitData(array $data): bool
    {
        $cacheFile = $this->getCacheFile();
        $cacheDir = dirname($cacheFile);

        // Ensure cache directory exists
        if (!is_dir($cacheDir)) {
            mkdir($cacheDir, 0755, true);
        }

        $json = json_encode($data, JSON_PRETTY_PRINT);
        return file_put_contents($cacheFile, $json) !== false;
    }

    /**
     * Clean up expired entries from rate limit data.
     */
    private function cleanupExpiredEntries(array &$data, int $now): void
    {
        foreach ($data as $key => $entry) {
            if ($now - $entry['window_start'] > self::WINDOW_SECONDS * 2) {
                unset($data[$key]);
            }
        }
    }

    public function before(RequestInterface $request, $arguments = null)
    {
        $ip = $this->getClientIp($request);
        $endpoint = $request->getPath();

        // Only rate limit auth endpoints
        if (!preg_match('#/api/(login|auth)#', $endpoint)) {
            return;
        }

        $key = $ip . ':' . $endpoint;
        $now = time();

        // Load existing data
        $data = $this->loadRateLimitData();

        // Clean up expired entries periodically
        if (mt_rand(1, 100) <= 10) { // 10% chance to cleanup
            $this->cleanupExpiredEntries($data, $now);
        }

        // Initialize or reset window if expired
        if (!isset($data[$key]) || ($now - $data[$key]['window_start']) > self::WINDOW_SECONDS) {
            $data[$key] = ['count' => 0, 'window_start' => $now];
        }

        // Increment counter
        $data[$key]['count']++;

        // Save updated data
        $this->saveRateLimitData($data);

        // Check if rate limit exceeded
        if ($data[$key]['count'] > self::MAX_REQUESTS) {
            $retryAfter = self::WINDOW_SECONDS - ($now - $data[$key]['window_start']);

            return service('response')
                ->setStatusCode(429)
                ->setJSON([
                    'status' => 429,
                    'error' => 'Terlalu banyak percobaan login. Silakan coba lagi dalam ' . max(1, $retryAfter) . ' detik.',
                ])
                ->setHeader('Retry-After', (string) max(1, $retryAfter));
        }
    }

    public function after(RequestInterface $request, ResponseInterface $response, $arguments = null)
    {
        // No action needed after response
    }
}