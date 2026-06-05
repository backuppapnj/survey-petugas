<?php

namespace App\Controllers;

use CodeIgniter\HTTP\ResponseInterface;

class Home extends BaseController
{
    /**
     * Root "/" hanya mengarahkan ke "/app/".
     *
     * SPA React dibangun dengan base "/app/" dan React Router memakai
     * basename "/app", sehingga aplikasi HARUS diakses di bawah "/app".
     * Mengakses root tanpa redirect akan membuat Router tidak menemukan
     * route yang cocok (blank page). Redirect ini menjaga konsistensi.
     *
     * Memakai header Location relatif ("/app/") secara langsung, bukan
     * helper redirect()->to() yang akan menambahkan baseURL (host/port bisa
     * keliru saat dijalankan di port berbeda dari konfigurasi baseURL).
     */
    public function index(): ResponseInterface
    {
        return $this->response
            ->setStatusCode(302)
            ->setHeader('Location', '/app/');
    }

    /**
     * Menyajikan halaman index.html SPA, atau instruksi jika belum di-build.
     */
    private function serveSpa(): ResponseInterface
    {
        $indexPath = FCPATH . 'app/index.html';

        if (! is_file($indexPath)) {
            return $this->response
                ->setStatusCode(503)
                ->setHeader('Content-Type', 'text/html; charset=UTF-8')
                ->setBody(
                    '<!doctype html><html lang="id"><head><meta charset="UTF-8">'
                    . '<title>Survei Kepuasan PTSP</title></head><body>'
                    . '<h1>Frontend belum di-build</h1>'
                    . '<p>Jalankan: <code>cd frontend &amp;&amp; npm run build</code></p>'
                    . '<p>Atau gunakan dev server: <code>cd frontend &amp;&amp; npm run dev</code> '
                    . 'lalu buka <a href="http://localhost:5173/">http://localhost:5173/</a></p>'
                    . '</body></html>',
                );
        }

        return $this->response
            ->setHeader('Content-Type', 'text/html; charset=UTF-8')
            ->setBody(file_get_contents($indexPath));
    }

    /**
     * Melayani aset statis dan SPA fallback untuk semua path di bawah "/app".
     *
     * Diperlukan saat aplikasi dijalankan via `php spark serve` (PHP built-in
     * server) yang tidak membaca .htaccess. Jika file fisik (mis. asset JS/CSS)
     * ada, file tersebut dikirim langsung; jika tidak (mis. /app/login saat
     * refresh), kembalikan index.html agar React Router yang menanganinya.
     *
     * @param string $path Sisa path setelah "/app/".
     */
    public function app(string $path = ''): ResponseInterface
    {
        $basePath = FCPATH . 'app' . DIRECTORY_SEPARATOR;

        // Normalisasi path untuk mencegah directory traversal.
        $relative   = str_replace(['..', "\0"], '', $path);
        $requested  = realpath($basePath . $relative);
        $baseReal   = realpath($basePath);

        // Jika file fisik valid dan berada di dalam folder app/, kirim file.
        if (
            $requested !== false
            && $baseReal !== false
            && str_starts_with($requested, $baseReal)
            && is_file($requested)
        ) {
            return $this->response
                ->setHeader('Content-Type', $this->resolveMimeType($requested))
                ->setBody(file_get_contents($requested));
        }

        // Bukan file fisik (mis. sub-route SPA) -> kembalikan index.html.
        return $this->serveSpa();
    }

    /**
     * Menentukan tipe MIME berdasarkan ekstensi file aset frontend.
     */
    private function resolveMimeType(string $file): string
    {
        $extension = strtolower(pathinfo($file, PATHINFO_EXTENSION));

        return match ($extension) {
            'js', 'mjs' => 'text/javascript; charset=UTF-8',
            'css'       => 'text/css; charset=UTF-8',
            'json', 'webmanifest' => 'application/json; charset=UTF-8',
            'svg'  => 'image/svg+xml',
            'png'  => 'image/png',
            'jpg', 'jpeg' => 'image/jpeg',
            'webp' => 'image/webp',
            'ico'  => 'image/x-icon',
            'woff' => 'font/woff',
            'woff2' => 'font/woff2',
            'html' => 'text/html; charset=UTF-8',
            default => 'application/octet-stream',
        };
    }
}
