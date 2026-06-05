<?php

namespace App\Controllers\Api;

use CodeIgniter\HTTP\ResponseInterface;
use CodeIgniter\RESTful\ResourceController;

/**
 * Controller for serving uploaded files.
 * Implements security measures to prevent malicious file access.
 */
class UploadsController extends ResourceController
{
    /**
     * Allowed MIME types for image uploads.
     */
    private const ALLOWED_MIME_TYPES = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
    ];

    /**
     * Serve uploaded file with security checks.
     *
     * @param string|null $filename The filename to serve
     */
    public function show($filename = null): ResponseInterface
    {
        // SECURITY: Validate filename format
        if ($filename === null || $filename === '') {
            return $this->response->setStatusCode(400)->setJSON([
                'status' => 400,
                'error'  => 'Nama file tidak valid',
            ]);
        }

        // SECURITY: Prevent path traversal with strict basename check
        $safeFilename = basename((string) $filename);

        // Verify filename only contains safe characters
        if (!preg_match('/^[a-zA-Z0-9_-]+\.[a-zA-Z0-9]+$/', $safeFilename)) {
            return $this->response->setStatusCode(400)->setJSON([
                'status' => 400,
                'error'  => 'Nama file tidak valid',
            ]);
        }

        $filepath = WRITEPATH . 'uploads' . DIRECTORY_SEPARATOR . $safeFilename;

        // SECURITY: Verify file exists within the uploads directory
        $realPath = realpath($filepath);
        $uploadsDir = realpath(WRITEPATH . 'uploads');

        if ($realPath === false || $uploadsDir === false) {
            return $this->response->setStatusCode(404)->setJSON([
                'status' => 404,
                'error'  => 'File tidak ditemukan',
            ]);
        }

        // SECURITY: Ensure file is within uploads directory (prevent path traversal)
        if (strpos($realPath, $uploadsDir) !== 0) {
            return $this->response->setStatusCode(403)->setJSON([
                'status' => 403,
                'error'  => 'Akses file ditolak',
            ]);
        }

        // SECURITY: Verify MIME type of the actual file (not just extension)
        $finfo = new \finfo(FILEINFO_MIME_TYPE);
        $mimeType = $finfo->file($realPath);

        if (!in_array($mimeType, self::ALLOWED_MIME_TYPES, true)) {
            return $this->response->setStatusCode(403)->setJSON([
                'status' => 403,
                'error'  => 'Tipe file tidak diizinkan',
            ]);
        }

        // SECURITY: Verify this is actually an image
        $imageInfo = @getimagesize($realPath);
        if ($imageInfo === false || !in_array($imageInfo[2], [IMAGETYPE_JPEG, IMAGETYPE_PNG, IMAGETYPE_GIF, IMAGETYPE_WEBP])) {
            return $this->response->setStatusCode(403)->setJSON([
                'status' => 403,
                'error'  => 'File bukan gambar yang valid',
            ]);
        }

        // SECURITY: Add cache control headers
        $response = service('response');
        $response->setHeader('Content-Type', $mimeType);
        $response->setHeader('X-Content-Type-Options', 'nosniff');
        $response->setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        $response->setHeader('X-Frame-Options', 'SAMEORIGIN');

        $response->setBody(file_get_contents($realPath));

        return $response;
    }
}