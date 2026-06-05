<?php

namespace App\Controllers\Api;

use App\Services\AnomalyService;
use CodeIgniter\HTTP\ResponseInterface;
use CodeIgniter\RESTful\ResourceController;
use DateTime;

class AnomaliController extends ResourceController
{
    public function index(): ResponseInterface
    {
        $start = (string) ($this->request->getGet('start') ?? date('Y-m-d'));
        $end   = (string) ($this->request->getGet('end') ?? date('Y-m-d'));

        if (! $this->isValidDate($start) || ! $this->isValidDate($end)) {
            return $this->response->setStatusCode(400)->setJSON([
                'status' => 400,
                'error'  => 'Format tanggal tidak valid (gunakan YYYY-MM-DD)',
            ]);
        }

        if ($start > $end) {
            return $this->response->setStatusCode(400)->setJSON([
                'status' => 400,
                'error'  => 'Tanggal mulai tidak boleh melebihi tanggal akhir',
            ]);
        }

        return $this->response->setJSON((new AnomalyService())->analyze($start, $end));
    }

    private function isValidDate(string $date): bool
    {
        $d = DateTime::createFromFormat('Y-m-d', $date);

        return $d !== false && $d->format('Y-m-d') === $date;
    }
}
