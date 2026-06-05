<?php

namespace App\Models;

use CodeIgniter\Model;

class PetugasModel extends Model
{
    protected $table         = 'petugas';
    protected $primaryKey    = 'id';
    // SECURITY: is_active removed from allowedFields to prevent mass assignment
    protected $allowedFields = ['nama', 'foto', 'loket', 'unit_kerja'];
    protected $returnType    = 'array';
    protected $useTimestamps = true;
    protected $createdField  = 'created_at';
    protected $updatedField  = 'updated_at';

    /**
     * Set is_active via secure method (not mass assignment).
     * This should only be called from admin controller after JWT auth.
     */
    public function setActiveStatus(int $id, bool $isActive): bool
    {
        return $this->update($id, ['is_active' => $isActive ? 1 : 0]);
    }

    public function getActive(): array
    {
        return $this->where('is_active', 1)->findAll();
    }

    public function getActiveDetail(int $id): ?array
    {
        return $this->where('is_active', 1)->find($id);
    }
}
