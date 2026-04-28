<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateSurveiTable extends Migration
{
    public function up()
    {
        $this->forge->addField([
            'id'         => ['type' => 'INT', 'unsigned' => true, 'auto_increment' => true],
            'petugas_id' => ['type' => 'INT', 'unsigned' => true],
            'kecepatan'  => ['type' => 'TINYINT', 'unsigned' => true],
            'keramahan'  => ['type' => 'TINYINT', 'unsigned' => true],
            'informasi'  => ['type' => 'TINYINT', 'unsigned' => true],
            'kenyamanan' => ['type' => 'TINYINT', 'unsigned' => true],
            'saran'      => ['type' => 'TEXT', 'null' => true],
            'created_at' => ['type' => 'DATETIME', 'null' => false],
        ]);
        $this->forge->addKey('id', true);
        $this->forge->addKey('petugas_id');
        $this->forge->addKey('created_at');
        $this->forge->addForeignKey('petugas_id', 'petugas', 'id', 'CASCADE', 'RESTRICT');
        $this->forge->createTable('survei');
    }

    public function down()
    {
        $this->forge->dropTable('survei');
    }
}
