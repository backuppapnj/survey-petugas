<?php

namespace Tests\Controllers\Api;

use App\Libraries\JwtLibrary;
use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\DatabaseTestTrait;
use CodeIgniter\Test\FeatureTestTrait;

/**
 * @internal
 */
final class PetugasControllerTest extends CIUnitTestCase
{
    use DatabaseTestTrait;
    use FeatureTestTrait;

    protected $migrate   = true;
    protected $refresh   = true;
    protected $seed      = 'App\Database\Seeds\DatabaseSeeder';
    protected $namespace = 'App';

    private function authHeader(): array
    {
        $token = (new JwtLibrary())->encode(['admin_id' => 1, 'username' => 'admin']);
        return ['Authorization' => 'Bearer ' . $token];
    }

    public function testShowPublicMengembalikanPetugasAktif(): void
    {
        $result = $this->call('get', '/api/petugas/1');

        $result->assertStatus(200);
        $body = json_decode($result->getJSON(), true);
        $this->assertSame('Budi Santoso', $body['nama']);
        $this->assertStringContainsString('/api/uploads/', $body['foto_url']);
    }

    public function testShowPublic404UntukPetugasNonAktif(): void
    {
        $this->db->table('petugas')->where('id', 1)->update(['is_active' => 0]);

        $result = $this->call('get', '/api/petugas/1');

        $result->assertStatus(404);
    }

    public function testIndexAdmin401TanpaToken(): void
    {
        $result = $this->call('get', '/api/admin/petugas');

        $result->assertStatus(401);
    }

    public function testIndexAdminMengembalikanSemuaPetugas(): void
    {
        $result = $this->withHeaders($this->authHeader())->call('get', '/api/admin/petugas');

        $result->assertStatus(200);
        $body = json_decode($result->getJSON(), true);
        $this->assertCount(3, $body);
    }

    public function testDeleteAdminSoftDeletePetugas(): void
    {
        $result = $this->withHeaders($this->authHeader())->call('delete', '/api/admin/petugas/1');

        $result->assertStatus(200);

        $row = $this->db->table('petugas')->where('id', 1)->get()->getRowArray();
        $this->assertSame(0, (int) $row['is_active']);
    }
}
