<?php

namespace App\Controllers\Api;

use App\Models\PetugasModel;
use CodeIgniter\HTTP\ResponseInterface;
use CodeIgniter\RESTful\ResourceController;
use Ramsey\Uuid\Uuid;

class PetugasController extends ResourceController
{
    protected PetugasModel $petugasModel;

    public function __construct()
    {
        $this->petugasModel = new PetugasModel();
    }

    /**
     * GET /api/petugas/{id} — public, hanya petugas aktif.
     */
    public function show($id = null): ResponseInterface
    {
        $petugas = $this->petugasModel->getActiveDetail((int) $id);

        if ($petugas === null) {
            return $this->response->setStatusCode(404)->setJSON([
                'status' => 404,
                'error'  => 'Petugas tidak ditemukan',
            ]);
        }

        return $this->response->setJSON($this->serialize($petugas));
    }

    /**
     * GET /api/admin/petugas — list semua petugas (termasuk non-aktif).
     */
    public function index(): ResponseInterface
    {
        $petugas = $this->petugasModel->findAll();

        return $this->response->setJSON(array_map(
            fn ($p) => $this->serialize($p, includeStatus: true),
            $petugas,
        ));
    }

    /**
     * POST /api/admin/petugas — buat petugas baru (multipart/form-data).
     */
    public function create(): ResponseInterface
    {
        $rules = [
            'nama'       => 'required|string|max_length[100]',
            'loket'      => 'required|string|max_length[50]',
            'unit_kerja' => 'required|string|max_length[100]',
            'foto'       => 'uploaded[foto]|max_size[foto,2048]|is_image[foto]|mime_in[foto,image/jpeg,image/png]',
        ];

        if (! $this->validate($rules)) {
            return $this->response->setStatusCode(422)->setJSON([
                'status'   => 422,
                'error'    => 'Validation Error',
                'messages' => $this->validator->getErrors(),
            ]);
        }

        $foto     = $this->request->getFile('foto');
        $filename = Uuid::uuid4()->toString() . '.' . $foto->getExtension();
        $foto->move(WRITEPATH . 'uploads', $filename);

        $id = $this->petugasModel->insert([
            'nama'       => (string) $this->request->getPost('nama'),
            'foto'       => $filename,
            'loket'      => (string) $this->request->getPost('loket'),
            'unit_kerja' => (string) $this->request->getPost('unit_kerja'),
        ]);

        return $this->response->setStatusCode(201)->setJSON(
            $this->serialize($this->petugasModel->find($id), includeStatus: true),
        );
    }

    /**
     * PUT /api/admin/petugas/{id} — update petugas (multipart via _method spoofing).
     */
    public function update($id = null): ResponseInterface
    {
        $petugas = $this->petugasModel->find((int) $id);

        if ($petugas === null) {
            return $this->response->setStatusCode(404)->setJSON([
                'status' => 404,
                'error'  => 'Petugas tidak ditemukan',
            ]);
        }

        $data = [];
        foreach (['nama', 'loket', 'unit_kerja'] as $field) {
            $value = $this->request->getPost($field);
            if ($value !== null && $value !== '') {
                $data[$field] = (string) $value;
            }
        }

        $foto = $this->request->getFile('foto');
        if ($foto !== null && $foto->isValid() && ! $foto->hasMoved()) {
            $rules = ['foto' => 'max_size[foto,2048]|is_image[foto]|mime_in[foto,image/jpeg,image/png]'];
            if (! $this->validate($rules)) {
                return $this->response->setStatusCode(422)->setJSON([
                    'status'   => 422,
                    'error'    => 'Validation Error',
                    'messages' => $this->validator->getErrors(),
                ]);
            }
            $filename = Uuid::uuid4()->toString() . '.' . $foto->getExtension();
            $foto->move(WRITEPATH . 'uploads', $filename);
            $data['foto'] = $filename;
        }

        if ($data === []) {
            return $this->response->setStatusCode(422)->setJSON([
                'status' => 422,
                'error'  => 'Tidak ada data yang diubah',
            ]);
        }

        $this->petugasModel->update($id, $data);

        return $this->response->setJSON(
            $this->serialize($this->petugasModel->find($id), includeStatus: true),
        );
    }

    /**
     * DELETE /api/admin/petugas/{id} — soft delete (set is_active=0).
     */
    public function delete($id = null): ResponseInterface
    {
        $petugas = $this->petugasModel->find((int) $id);

        if ($petugas === null) {
            return $this->response->setStatusCode(404)->setJSON([
                'status' => 404,
                'error'  => 'Petugas tidak ditemukan',
            ]);
        }

        $this->petugasModel->update($id, ['is_active' => 0]);

        return $this->response->setJSON(['message' => 'Petugas berhasil dinonaktifkan']);
    }

    /**
     * Helper untuk serialisasi petugas ke format API.
     */
    private function serialize(array $petugas, bool $includeStatus = false): array
    {
        $out = [
            'id'         => (int) $petugas['id'],
            'nama'       => $petugas['nama'],
            'foto_url'   => '/api/uploads/' . $petugas['foto'],
            'loket'      => $petugas['loket'],
            'unit_kerja' => $petugas['unit_kerja'],
        ];
        if ($includeStatus) {
            $out['is_active'] = (int) $petugas['is_active'];
        }
        return $out;
    }
}
