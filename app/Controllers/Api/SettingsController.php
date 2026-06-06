<?php

namespace App\Controllers\Api;

use App\Models\SettingsModel;
use CodeIgniter\HTTP\ResponseInterface;
use CodeIgniter\RESTful\ResourceController;

class SettingsController extends ResourceController
{
    protected SettingsModel $settingsModel;

    public function __construct()
    {
        $this->settingsModel = new SettingsModel();
    }

    /**
     * GET /api/settings/public — pengaturan publik (branding, kiosk, label IKM).
     * Tidak memerlukan autentikasi: dipakai halaman login, survei, dan 404.
     */
    public function publicSettings(): ResponseInterface
    {
        return $this->response->setJSON($this->settingsModel->getAllCast(onlyPublic: true));
    }

    /**
     * GET /api/admin/settings — seluruh pengaturan + metadata (untuk UI admin).
     */
    public function index(): ResponseInterface
    {
        return $this->response->setJSON($this->settingsModel->getAllWithMeta());
    }

    /**
     * PUT /api/admin/settings — perbarui banyak pengaturan sekaligus.
     * Body: { "settings": { "app_title": "...", "kiosk_reset_timeout": 8000 } }
     */
    public function updateBatch(): ResponseInterface
    {
        $raw  = (string) $this->request->getBody();
        $json = $raw === '' ? [] : json_decode($raw, true);
        if (! is_array($json)) {
            return $this->response->setStatusCode(400)->setJSON([
                'status' => 400,
                'error'  => 'Format JSON tidak valid',
            ]);
        }

        $pairs = $json['settings'] ?? null;
        if (! is_array($pairs) || $pairs === []) {
            return $this->response->setStatusCode(422)->setJSON([
                'status' => 422,
                'error'  => 'Tidak ada pengaturan yang dikirim',
            ]);
        }

        $updated = $this->settingsModel->updateMany($pairs);

        return $this->response->setJSON([
            'updated'  => $updated,
            'settings' => $this->settingsModel->getAllWithMeta(),
        ]);
    }
}
