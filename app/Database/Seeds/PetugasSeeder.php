<?php

namespace App\Database\Seeds;

use CodeIgniter\Database\Seeder;

class PetugasSeeder extends Seeder
{
    public function run()
    {
        $now  = date('Y-m-d H:i:s');
        $data = [
            ['nama' => 'Budi Santoso',   'foto' => 'placeholder-1.png', 'loket' => 'Loket 1', 'unit_kerja' => 'Pelayanan Umum', 'is_active' => 1, 'created_at' => $now, 'updated_at' => $now],
            ['nama' => 'Siti Nurhaliza', 'foto' => 'placeholder-2.png', 'loket' => 'Loket 2', 'unit_kerja' => 'Perizinan',      'is_active' => 1, 'created_at' => $now, 'updated_at' => $now],
            ['nama' => 'Ahmad Fauzi',    'foto' => 'placeholder-3.png', 'loket' => 'Loket 3', 'unit_kerja' => 'Informasi',      'is_active' => 1, 'created_at' => $now, 'updated_at' => $now],
        ];
        $this->db->table('petugas')->insertBatch($data);
    }
}
