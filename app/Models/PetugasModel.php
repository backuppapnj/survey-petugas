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

    public function getActive(): array
    {
        return $this->where('is_active', 1)->findAll();
    }

    public function getActiveDetail(int $id): ?array
    {
        return $this->where('is_active', 1)->find($id);
    }
}
