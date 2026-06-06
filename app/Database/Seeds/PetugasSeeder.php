<?php

namespace App\Database\Seeds;

use CodeIgniter\Database\Seeder;

class PetugasSeeder extends Seeder
{
    public function run()
    {
        $now  = date('Y-m-d H:i:s');
        // Foto dikosongkan (null) karena belum ada berkas asli; UI akan
        // menampilkan inisial nama melalui AvatarFallback. Foto petugas
        // diunggah lewat menu admin dan disimpan di writable/uploads.
        // survey_token: token unik 16-char hex untuk URL survei publik
        // (wajib NOT NULL; di-seed statis agar tidak butuh Model callback).
        $data = [
            ['nama' => 'Budi Santoso',   'foto' => null, 'loket' => 'Loket 1', 'unit_kerja' => 'Pelayanan Umum', 'is_active' => 1, 'survey_token' => bin2hex(random_bytes(8)), 'created_at' => $now, 'updated_at' => $now],
            ['nama' => 'Siti Nurhaliza', 'foto' => null, 'loket' => 'Loket 2', 'unit_kerja' => 'Perizinan',      'is_active' => 1, 'survey_token' => bin2hex(random_bytes(8)), 'created_at' => $now, 'updated_at' => $now],
            ['nama' => 'Ahmad Fauzi',    'foto' => null, 'loket' => 'Loket 3', 'unit_kerja' => 'Informasi',      'is_active' => 1, 'survey_token' => bin2hex(random_bytes(8)), 'created_at' => $now, 'updated_at' => $now],
        ];
        $this->db->table('petugas')->insertBatch($data);
    }
}
