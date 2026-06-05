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
    public array $default = [
        'allowedOrigins'         => [],
        'allowedOriginsPatterns' => [],
        'supportsCredentials'    => false,
        'allowedHeaders'         => ['Content-Type', 'Authorization', 'X-Requested-With'],
        'exposedHeaders'         => [],
        'allowedMethods'         => ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        'maxAge'                 => 7200,
    ];

    public function __construct()
    {
        parent::__construct();

        // Origin yang diizinkan dibaca dari env "app.allowedOrigins" (pisahkan
        // dengan koma untuk beberapa origin). Default ke dev server Vite agar
        // pengembangan lokal tetap berjalan tanpa konfigurasi tambahan.
        $origins = (string) env('app.allowedOrigins', 'http://localhost:5173');

        $this->default['allowedOrigins'] = array_values(array_filter(
            array_map('trim', explode(',', $origins)),
            static fn (string $origin): bool => $origin !== '',
        ));
    }
}
