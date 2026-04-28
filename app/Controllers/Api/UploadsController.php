<?php

namespace App\Controllers\Api;

use CodeIgniter\HTTP\ResponseInterface;
use CodeIgniter\RESTful\ResourceController;

class UploadsController extends ResourceController
{
    public function show($filename = null): ResponseInterface
    {
        // Cegah path traversal dengan strip komponen direktori
        $safeFilename = basename((string) $filename);
        $filepath     = WRITEPATH . 'uploads/' . $safeFilename;

        if (! is_file($filepath)) {
            return $this->response->setStatusCode(404)->setJSON([
                'status' => 404,
                'error'  => 'File tidak ditemukan',
            ]);
        }

        return $this->response
            ->setHeader('Content-Type', mime_content_type($filepath) ?: 'application/octet-stream')
            ->setBody(file_get_contents($filepath));
    }
}
