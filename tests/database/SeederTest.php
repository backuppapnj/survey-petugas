<?php

namespace Tests\Database;

use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\DatabaseTestTrait;

/**
 * @internal
 */
final class SeederTest extends CIUnitTestCase
{
    use DatabaseTestTrait;

    protected $migrate     = true;
    protected $refresh     = true;
    protected $seed        = 'App\Database\Seeds\DatabaseSeeder';
    protected $namespace   = 'App';

    public function testAdminSeederMembuatAkunDefault(): void
    {
        $admin = $this->db->table('admin')->where('username', 'admin')->get()->getRowArray();

        $this->assertNotNull($admin);
        $this->assertSame('Administrator', $admin['nama']);
        $this->assertTrue(password_verify('admin123', $admin['password_hash']));
    }

    public function testPetugasSeederMembuatTigaPetugasAktif(): void
    {
        $count = $this->db->table('petugas')->where('is_active', 1)->countAllResults();

        $this->assertSame(3, $count);
    }
}
