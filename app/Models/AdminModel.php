<?php

namespace App\Models;

use CodeIgniter\Model;

class AdminModel extends Model
{
    protected $table         = 'admin';
    protected $primaryKey    = 'id';
    protected $allowedFields = ['username', 'password_hash', 'nama', 'created_at'];
    protected $returnType    = 'array';
    protected $useTimestamps = false;

    public function findByUsername(string $username): ?array
    {
        return $this->where('username', $username)->first();
    }
}
