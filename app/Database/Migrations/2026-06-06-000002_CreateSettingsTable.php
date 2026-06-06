<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

/**
 * Tabel settings key-value untuk konfigurasi dinamis yang dapat diubah
 * administrator tanpa perlu mengubah kode atau melakukan re-deploy.
 *
 * Kolom:
 *  - key       : kunci unik pengaturan (PK), mis. "app_title"
 *  - value     : nilai pengaturan (disimpan sebagai teks; di-cast via "type")
 *  - type      : tipe data untuk casting (string|int|bool|float|json)
 *  - category  : pengelompokan UI (branding|kiosk|performance|ikm|security)
 *  - label     : label ramah-pengguna untuk ditampilkan di UI admin
 *  - is_public : true jika nilai boleh diakses tanpa autentikasi (mis. branding,
 *                kiosk) — dipakai endpoint publik /api/settings/public
 *  - updated_at: waktu perubahan terakhir
 */
class CreateSettingsTable extends Migration
{
    public function up()
    {
        $this->forge->addField([
            'key'        => ['type' => 'VARCHAR', 'constraint' => 100],
            'value'      => ['type' => 'TEXT', 'null' => true],
            'type'       => ['type' => 'VARCHAR', 'constraint' => 10, 'default' => 'string'],
            'category'   => ['type' => 'VARCHAR', 'constraint' => 30, 'default' => 'general'],
            'label'      => ['type' => 'VARCHAR', 'constraint' => 150, 'default' => ''],
            'is_public'  => ['type' => 'TINYINT', 'constraint' => 1, 'default' => 0],
            'updated_at' => ['type' => 'DATETIME', 'null' => true],
        ]);
        $this->forge->addKey('key', true);
        $this->forge->addKey('category');
        $this->forge->createTable('settings');
    }

    public function down()
    {
        $this->forge->dropTable('settings');
    }
}
