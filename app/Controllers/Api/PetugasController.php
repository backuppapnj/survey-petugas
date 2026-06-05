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

        $foto = $this->request->getFile('foto');

        // Gunakan validasi enhanced untuk keamanan
        $validation = $this->validateSecureUpload($foto);
        if (!$validation['valid']) {
            return $this->response->setStatusCode(422)->setJSON([
                'status' => 422,
                'error'  => $validation['error'],
            ]);
        }

        $filename = $validation['filename'];

        // Pastikan direktori uploads ada
        $uploadDir = WRITEPATH . 'uploads';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        $foto->move($uploadDir, $filename);

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

            // Gunakan validasi enhanced untuk keamanan
            $validation = $this->validateSecureUpload($foto);
            if (!$validation['valid']) {
                return $this->response->setStatusCode(422)->setJSON([
                    'status' => 422,
                    'error'  => $validation['error'],
                ]);
            }

            $filename = $validation['filename'];
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
     * POST /api/admin/petugas/{id}/restore — reaktivasi petugas non-aktif.
     */
    public function restore($id = null): ResponseInterface
    {
        $petugas = $this->petugasModel->find((int) $id);

        if ($petugas === null) {
            return $this->response->setStatusCode(404)->setJSON([
                'status' => 404,
                'error'  => 'Petugas tidak ditemukan',
            ]);
        }

        $this->petugasModel->update($id, ['is_active' => 1]);

        return $this->response->setJSON(['message' => 'Petugas berhasil diaktifkan kembali']);
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

    /**
     * Validasi file upload dengan keamanan enhanced.
     * Melakukan verifikasi MIME type, dimensi gambar, dan pencegahan polyglot attack.
     *
     * @param \CodeIgniter\HTTP\UploadedFile $file File yang diupload
     * @return array ['valid' => bool, 'error' => string|null, 'filename' => string|null]
     */
    private function validateSecureUpload(\CodeIgniter\HTTP\UploadedFile $file): array
    {
        // Cek apakah file benar-benar diupload
        if (!$file || !$file->isValid()) {
            return [
                'valid' => false,
                'error' => 'File tidak valid atau gagal diupload',
                'filename' => null,
            ];
        }

        // Verifikasi MIME type actual menggunakan finfo (bukan hanya extension)
        $finfo = new \finfo(FILEINFO_MIME_TYPE);
        $mimeType = $finfo->file($file->getTempName());

        $allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!in_array($mimeType, $allowedMimes, true)) {
            return [
                'valid' => false,
                'error' => 'Tipe file tidak diizinkan. Hanya JPG, PNG, GIF, atau WebP.',
                'filename' => null,
            ];
        }

        // Cek dimensi gambar (mencegah polyglot attacks - gambar dengan PHP embedded)
        $imageInfo = @getimagesize($file->getTempName());
        if ($imageInfo === false) {
            return [
                'valid' => false,
                'error' => 'File bukan gambar yang valid',
                'filename' => null,
            ];
        }

        // Verifikasi tipe gambar
        if (!in_array($imageInfo[2], [IMAGETYPE_JPEG, IMAGETYPE_PNG, IMAGETYPE_GIF, IMAGETYPE_WEBP])) {
            return [
                'valid' => false,
                'error' => 'Format gambar tidak didukung',
                'filename' => null,
            ];
        }

        // Generate random filename untuk mencegah enumeration dan timing attacks
        $extension = strtolower($file->getExtension());
        $filename = bin2hex(random_bytes(16)) . '.' . $extension;

        return [
            'valid' => true,
            'error' => null,
            'filename' => $filename,
        ];
    }
}
