<?php

namespace App\Models;

use CodeIgniter\Model;

class PetugasModel extends Model
{
    protected $table         = 'petugas';
    protected $primaryKey    = 'id';
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
