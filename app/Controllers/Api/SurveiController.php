<?php

namespace App\Controllers\Api;

use App\Models\PetugasModel;
use App\Models\SurveiModel;
use CodeIgniter\HTTP\ResponseInterface;
use CodeIgniter\RESTful\ResourceController;

class SurveiController extends ResourceController
{
    public function submit(): ResponseInterface
    {
        $json  = $this->request->getJSON(true) ?? [];
        $rules = [
            'petugas_id' => 'required|integer',
            'kecepatan'  => 'required|integer|greater_than[0]|less_than[6]',
            'keramahan'  => 'required|integer|greater_than[0]|less_than[6]',
            'informasi'  => 'required|integer|greater_than[0]|less_than[6]',
            'kenyamanan' => 'required|integer|greater_than[0]|less_than[6]',
            'saran'      => 'permit_empty|string|max_length[1000]',
        ];

        if (! $this->validateData($json, $rules)) {
            return $this->response->setStatusCode(422)->setJSON([
                'status'   => 422,
                'error'    => 'Validation Error',
                'messages' => $this->validator->getErrors(),
            ]);
        }

        $petugas = (new PetugasModel())->getActiveDetail((int) $json['petugas_id']);
        if ($petugas === null) {
            return $this->response->setStatusCode(422)->setJSON([
                'status'   => 422,
                'error'    => 'Validation Error',
                'messages' => ['petugas_id' => 'Petugas tidak ditemukan atau tidak aktif'],
            ]);
        }

        (new SurveiModel())->insert([
            'petugas_id' => (int) $json['petugas_id'],
            'kecepatan'  => (int) $json['kecepatan'],
            'keramahan'  => (int) $json['keramahan'],
            'informasi'  => (int) $json['informasi'],
            'kenyamanan' => (int) $json['kenyamanan'],
            'saran'      => $json['saran'] ?? null,
        ]);

        return $this->response->setStatusCode(201)->setJSON([
            'message' => 'Terima kasih atas penilaian Anda',
        ]);
    }

    public function rekap(): ResponseInterface
    {
        $start = (string) ($this->request->getGet('start') ?? date('Y-m-d'));
        $end   = (string) ($this->request->getGet('end') ?? date('Y-m-d'));

        return $this->response->setJSON((new SurveiModel())->getRekapByDateRange($start, $end));
    }
}
