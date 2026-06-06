<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddSurveyTokenToPetugas extends Migration
{
    public function up()
    {
        // 1. Tambah kolom dengan default sementara agar kompatibel SQLite
        //    (SQLite menolak ADD COLUMN NOT NULL tanpa DEFAULT). Default ''
        //    hanya sementara; langsung di-backfill di step 2, lalu index unik
        //    ditambahkan agar kolom berfungsi sebagai pengenal publik yang aman.
        $this->forge->addColumn('petugas', [
            'survey_token' => [
                'type'       => 'VARCHAR',
                'constraint' => 32,
                'null'       => false,
                'default'    => '',
                'after'      => 'unit_kerja',
            ],
        ]);

        // 2. Backfill token acak unik untuk petugas yang sudah ada.
        //    Gunakan prefix tabel eksplisit agar kompatibel dengan SQLite
        //    testing environment yang memakai DBPrefix 'db_'.
        $prefix = $this->db->DBPrefix;
        $rows   = $this->db->query("SELECT id FROM {$prefix}petugas")->getResultArray();
        $used   = [];
        foreach ($rows as $row) {
            // Jamin token unik dalam batch backfill agar CREATE UNIQUE INDEX
            // (step 3) tidak gagal akibat bentrokan (peluang kecil namun mungkin).
            do {
                $token = bin2hex(random_bytes(8));
            } while (isset($used[$token]));
            $used[$token] = true;

            $this->db->query(
                "UPDATE {$prefix}petugas SET survey_token = ? WHERE id = ?",
                [$token, $row['id']]
            );
        }

        // 3. Tambah unique index agar token tidak terduplikasi.
        //    CREATE UNIQUE INDEX kompatibel dengan SQLite dan MySQL.
        $this->db->query("CREATE UNIQUE INDEX idx_petugas_survey_token ON {$prefix}petugas (survey_token)");
    }

    public function down()
    {
        // dropColumn menghapus kolom beserta unique index-nya secara portabel:
        // MySQL melepas index saat kolom di-drop, SQLite membangun ulang tabel.
        // Hindari "DROP INDEX IF EXISTS <idx>" tanpa klausa ON yang hanya valid
        // di SQLite dan akan menggagalkan rollback di MySQL.
        $this->forge->dropColumn('petugas', 'survey_token');
    }
}
