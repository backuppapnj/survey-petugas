<?php

namespace Tests\Database;

use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\DatabaseTestTrait;

/**
 * @internal
 */
final class MigrationTest extends CIUnitTestCase
{
    use DatabaseTestTrait;

    protected $migrate     = true;
    protected $migrateOnce = false;
    protected $refresh     = true;
    protected $namespace   = 'App';

    public function testTabelPetugasMemilikiSemuaKolomYangDiperlukan(): void
    {
        $fields = $this->db->getFieldData('petugas');
        $names  = array_column($fields, 'name');

        // 'survey_token' ditambahkan pada migration token-survey (2026-06-06).
        $this->assertEqualsCanonicalizing(
            ['id', 'nama', 'foto', 'loket', 'unit_kerja', 'survey_token', 'is_active', 'created_at', 'updated_at'],
            $names,
        );
    }

    public function testTabelSurveiMemilikiForeignKeyKePetugas(): void
    {
        $fields = $this->db->getFieldData('survei');
        $names  = array_column($fields, 'name');

        $this->assertContains('petugas_id', $names);
        $this->assertContains('kecepatan', $names);
        $this->assertContains('keramahan', $names);
        $this->assertContains('informasi', $names);
        $this->assertContains('kenyamanan', $names);
        $this->assertContains('saran', $names);
        $this->assertContains('created_at', $names);
    }

    public function testTabelAdminMemilikiSemuaKolomYangDiperlukan(): void
    {
        $fields = $this->db->getFieldData('admin');
        $names  = array_column($fields, 'name');

        $this->assertEqualsCanonicalizing(
            ['id', 'username', 'password_hash', 'nama', 'created_at'],
            $names,
        );
    }

    public function testTabelAdminUsernameUnique(): void
    {
        // Portable across MySQL / SQLite (used in tests): use CI4 getIndexData()
        // instead of raw "SHOW INDEX" which is MySQL-only and caused SQLite syntax error.
        $indexes = $this->db->getIndexData('admin');

        $usernameIndexes = array_filter($indexes, static function ($idx) {
            return isset($idx->fields) && in_array('username', (array) $idx->fields, true);
        });

        $this->assertNotEmpty($usernameIndexes, 'Index unik pada kolom username tidak ditemukan');

        $uniqueIdx = array_values($usernameIndexes)[0] ?? null;
        $this->assertNotNull($uniqueIdx);

        // Portable check: some drivers (MySQL) use $idx->unique bool, SQLite uses $idx->type === 'UNIQUE'
        $isUnique = !empty($uniqueIdx->unique) || (isset($uniqueIdx->type) && strtoupper((string)$uniqueIdx->type) === 'UNIQUE');
        $this->assertTrue($isUnique, 'Kolom username harus memiliki unique index');
    }
}
