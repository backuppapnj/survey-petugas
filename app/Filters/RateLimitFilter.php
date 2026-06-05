<?php

namespace App\Filters;

use CodeIgniter\Filters\FilterInterface;
use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;

/**
 * Rate limiting filter to prevent brute force attacks on authentication endpoints.
 * Uses in-memory cache (suitable for single-server/shared hosting).
 * For multi-server production, consider Redis or database-based rate limiting.
 */
class RateLimitFilter implements FilterInterface
{
    private const MAX_REQUESTS = 5;      // Max requests per window
    private const WINDOW_SECONDS = 60;   // Time window in seconds

    // Simple in-memory cache for rate limiting
    // In production, use Redis or database for multi-server
    private static array $hits = [];

    /**
     * Get IP address from request object.
     * Handles both real Request objects and test doubles.
     *
     * @param object $request
     * @return string
     */
    private function getIPAddress(object $request): string
    {
        // Handle test doubles (they have these methods directly)
        if (method_exists($request, 'getIPAddress')) {
            return $request->getIPAddress();
        }
        return '0.0.0.0';
    }

    /**
     * Get path from request object.
     * Handles both real Request objects and test doubles.
     *
     * @param object $request
     * @return string
     */
    private function getPath(object $request): string
    {
        // Handle test doubles (they have these methods directly)
        if (method_exists($request, 'getPath')) {
            return $request->getPath();
        }
        return '/';
    }

    public function before($request, $arguments = null)
    {
        $ip = $this->getIPAddress($request);
        $endpoint = $this->getPath($request);

        // Only rate limit auth endpoints
        if (!preg_match('#/api/(login|auth)#', $endpoint)) {
            return;
        }

        $key = $this->getCacheKey($ip, $endpoint);
        $now = time();

        // Initialize or reset window if expired
        if (!isset(self::$hits[$key]) || $this->isWindowExpired(self::$hits[$key], $now)) {
            self::$hits[$key] = ['count' => 0, 'window_start' => $now];
        }

        // Increment counter
        self::$hits[$key]['count']++;

        // Check if rate limit exceeded
        if (self::$hits[$key]['count'] > self::MAX_REQUESTS) {
            $retryAfter = self::WINDOW_SECONDS - ($now - self::$hits[$key]['window_start']);

            return service('response')
                ->setStatusCode(429)
                ->setJSON([
                    'status' => 429,
                    'error' => 'Terlalu banyak percobaan login. Silakan coba lagi dalam ' . max(1, $retryAfter) . ' detik.',
                ])
                ->setHeader('Retry-After', (string) max(1, $retryAfter))
                ->setHeader('X-RateLimit-Limit', (string) self::MAX_REQUESTS)
                ->setHeader('X-RateLimit-Remaining', '0');
        }

        // Add rate limit headers to response
        $remaining = max(0, self::MAX_REQUESTS - self::$hits[$key]['count']);
        service('response')->setHeader('X-RateLimit-Limit', (string) self::MAX_REQUESTS);
        service('response')->setHeader('X-RateLimit-Remaining', (string) $remaining);
    }

    public function after($request, ResponseInterface $response, $arguments = null)
    {
        // No action needed after response
    }

    private function getCacheKey(string $ip, string $endpoint): string
    {
        return $ip . ':' . $endpoint;
    }

    private function isWindowExpired(array $hitData, int $now): bool
    {
        return ($now - $hitData['window_start']) > self::WINDOW_SECONDS;
    }

    /**
     * Clear rate limit for testing purposes.
     */
    public static function clearCache(): void
    {
        self::$hits = [];
    }
}