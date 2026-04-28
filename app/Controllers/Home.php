<?php

namespace App\Controllers;

use CodeIgniter\HTTP\ResponseInterface;

class Home extends BaseController
{
    /**
     * Sajikan SPA React (build hasil Vite) sebagai halaman utama.
     * Jika frontend belum di-build, tampilkan instruksi singkat.
     */
    public function index(): ResponseInterface
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
}
