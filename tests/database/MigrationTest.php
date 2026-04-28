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

        $this->assertEqualsCanonicalizing(
            ['id', 'nama', 'foto', 'loket', 'unit_kerja', 'is_active', 'created_at', 'updated_at'],
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
        $indexes = $this->db->query('SHOW INDEX FROM admin WHERE Key_name = "username"')->getResultArray();

        $this->assertNotEmpty($indexes, 'Index unique pada kolom username tidak ditemukan');
        $this->assertSame(0, (int) $indexes[0]['Non_unique'], 'Kolom username harus UNIQUE');
    }
}
