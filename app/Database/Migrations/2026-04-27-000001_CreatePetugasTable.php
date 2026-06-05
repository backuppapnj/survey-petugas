<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreatePetugasTable extends Migration
{
    public function up()
    {
        $this->forge->addField([
            'id'         => ['type' => 'INT', 'unsigned' => true, 'auto_increment' => true],
            'nama'       => ['type' => 'VARCHAR', 'constraint' => 100],
            // Foto boleh null: petugas dapat dibuat tanpa foto, UI memakai
            // inisial nama (AvatarFallback) sebagai gantinya.
            'foto'       => ['type' => 'VARCHAR', 'constraint' => 255, 'null' => true],
            'loket'      => ['type' => 'VARCHAR', 'constraint' => 50],
            'unit_kerja' => ['type' => 'VARCHAR', 'constraint' => 100],
            'is_active'  => ['type' => 'TINYINT', 'constraint' => 1, 'default' => 1],
            'created_at' => ['type' => 'DATETIME', 'null' => false],
            'updated_at' => ['type' => 'DATETIME', 'null' => false],
        ]);
        $this->forge->addKey('id', true);
        $this->forge->createTable('petugas');
    }

    public function down()
    {
        $this->forge->dropTable('petugas');
    }
}
