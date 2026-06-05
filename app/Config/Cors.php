<?php

namespace Config;

use CodeIgniter\Config\BaseConfig;

/**
 * Cross-Origin Resource Sharing (CORS) Configuration
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
 */
class Cors extends BaseConfig
{
    /**
     * The default CORS configuration.
     * Configured via environment variables for flexibility.
     *
     * @var array{
     *      allowedOrigins: list<string>,
     *      allowedOriginsPatterns: list<string>,
     *      supportsCredentials: bool,
     *      allowedHeaders: list<string>,
     *      exposedHeaders: list<string>,
     *      allowedMethods: list<string>,
     *      maxAge: int,
     *  }
     */
    public array $default;

    /**
     * Initialize CORS configuration.
     */
    public function __construct()
    {
        parent::__construct();

        $this->default = [
            'allowedOrigins'         => $this->parseAllowedOrigins(),
            'allowedOriginsPatterns' => [],
            'supportsCredentials'    => true,
            'allowedHeaders'         => [
                'Content-Type',
                'Authorization',
                'X-Requested-With',
                'X-CSRF-TOKEN',
            ],
            'exposedHeaders'         => [
                // X-Total-Count is safe to expose (common API practice)
                // Rate limit headers are NOT exposed to prevent information disclosure
                'X-Total-Count',
            ],
            'allowedMethods'         => ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
            'maxAge'                 => 86400,
        ];
    }

    /**
     * Parse allowed origins from environment variable.
     *
     * @return list<string>
     */
    private function parseAllowedOrigins(): array
    {
        $origins = env('CORS_ALLOWED_ORIGINS', '');

        if (empty($origins)) {
            // Default kosong di production — WAJIB dikonfigurasi via
            // CORS_ALLOWED_ORIGINS di .env. Pada environment development dan
            // testing, sediakan origin localhost default agar dev server dan
            // test suite (CorsFilterTest) berfungsi tanpa konfigurasi tambahan.
            if (ENVIRONMENT === 'development' || ENVIRONMENT === 'testing') {
                return ['http://localhost:5173', 'http://localhost:3000'];
            }
            return [];
        }

        // Parse comma-separated origins
        $parsed = array_filter(array_map('trim', explode(',', $origins)));

        return array_values($parsed);
    }
}