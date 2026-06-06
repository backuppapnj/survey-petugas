<?php

namespace App\Database\Seeds;

use CodeIgniter\Database\Seeder;

class AdminSeeder extends Seeder
{
    public function run()
    {
        // Kredensial admin diambil dari environment agar tidak ada kredensial
        // default yang ter-hardcode di repository (risiko keamanan produksi).
        // Fallback hanya untuk lingkungan pengembangan/demo.
        $username = env('ADMIN_DEFAULT_USERNAME') ?: 'admin';
        $password = env('ADMIN_DEFAULT_PASSWORD') ?: 'admin123';
        $nama     = env('ADMIN_DEFAULT_NAMA') ?: 'Administrator';

        $builder = $this->db->table('admin');

        // Idempotent: jangan buat duplikat jika username sudah ada.
        $exists = $builder->where('username', $username)->countAllResults(false) > 0;
        $builder->resetQuery();
        if ($exists) {
            return;
        }

        $builder->insert([
            'username'      => $username,
            'password_hash' => password_hash($password, PASSWORD_BCRYPT),
            'nama'          => $nama,
            'created_at'    => date('Y-m-d H:i:s'),
        ]);
    }
}
