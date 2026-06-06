<?php

namespace App\Models;

use CodeIgniter\Model;

class PetugasModel extends Model
{
    protected $table         = 'petugas';
    protected $primaryKey    = 'id';
    // CATATAN KEAMANAN: 'is_active' sengaja DISERTAKAN agar fitur soft-delete,
    // restore, dan seeding berfungsi (update internal memerlukan field ini).
    // Proteksi mass-assignment dilakukan di layer Controller: method create()
    // dan update() hanya menyusun field dari input user secara eksplisit
    // (nama, foto, loket, unit_kerja) dan TIDAK pernah meneruskan 'is_active'
    // dari request. Toggle status hanya via endpoint admin ber-JWT
    // (delete/restore) yang memanggil update() dengan nilai tetap.
    protected $allowedFields = ['nama', 'foto', 'loket', 'unit_kerja', 'is_active'];
    protected $returnType    = 'array';
    protected $useTimestamps = true;
    protected $createdField  = 'created_at';
    protected $updatedField  = 'updated_at';

    // Callback dieksekusi sebelum setiap insert untuk menyisipkan survey_token.
    protected $beforeInsert = ['generateSurveyToken'];

    public function getActive(): array
    {
        return $this->where('is_active', 1)->findAll();
    }

    public function getActiveDetail(int $id): ?array
    {
        return $this->where('is_active', 1)->find($id);
    }

    /**
     * Set survey_token acak unik saat insert bila belum ada. Token disetel
     * sistem (bukan input admin); ditambahkan di sini setelah filter
     * allowedFields sehingga tetap masuk ke query insert.
     */
    protected function generateSurveyToken(array $data): array
    {
        if (empty($data['data']['survey_token'])) {
            $data['data']['survey_token'] = $this->generateUniqueToken();
        }
        return $data;
    }

    /** Hasilkan token 16-char hex yang unik di tabel petugas. */
    public function generateUniqueToken(): string
    {
        do {
            $token = bin2hex(random_bytes(8));
        } while ($this->where('survey_token', $token)->first() !== null);

        return $token;
    }

    /** Petugas aktif berdasarkan survey_token (untuk URL/survey publik). */
    public function getActiveByToken(string $token): ?array
    {
        return $this->where('is_active', 1)->where('survey_token', $token)->first();
    }

    /**
     * Buat ulang token petugas (mematikan QR lama). Update langsung via
     * Query Builder agar tidak bergantung allowedFields. Null bila tak ada.
     */
    public function regenerateToken(int $id): ?string
    {
        if ($this->find($id) === null) {
            return null;
        }
        $token = $this->generateUniqueToken();
        $this->builder()->where('id', $id)->update(['survey_token' => $token]);

        return $token;
    }
}
