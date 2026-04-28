<?php

namespace Tests\Controllers\Api;

use App\Libraries\JwtLibrary;
use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\DatabaseTestTrait;
use CodeIgniter\Test\FeatureTestTrait;

/**
 * @internal
 */
final class SurveiControllerTest extends CIUnitTestCase
{
    use DatabaseTestTrait;
    use FeatureTestTrait;

    protected $migrate   = true;
    protected $refresh   = true;
    protected $seed      = 'App\Database\Seeds\DatabaseSeeder';
    protected $namespace = 'App';

    public function testSubmitSuksesDenganRatingValid(): void
    {
        $result = $this->withBodyFormat('json')->call('post', '/api/survei', [
            'petugas_id' => 1,
            'kecepatan'  => 5,
            'keramahan'  => 4,
            'informasi'  => 5,
            'kenyamanan' => 4,
            'saran'      => 'Mantap',
        ]);

        $result->assertStatus(201);

        $count = $this->db->table('survei')->countAllResults();
        $this->assertSame(1, $count);
    }

    public function testSubmitGagalDenganRatingDiluar1Sampai5(): void
    {
        $result = $this->withBodyFormat('json')->call('post', '/api/survei', [
            'petugas_id' => 1,
            'kecepatan'  => 6,
            'keramahan'  => 4,
            'informasi'  => 5,
            'kenyamanan' => 4,
        ]);

        $result->assertStatus(422);
    }

    public function testSubmitGagalUntukPetugasNonAktif(): void
    {
        $this->db->table('petugas')->where('id', 1)->update(['is_active' => 0]);

        $result = $this->withBodyFormat('json')->call('post', '/api/survei', [
            'petugas_id' => 1,
            'kecepatan'  => 5,
            'keramahan'  => 5,
            'informasi'  => 5,
            'kenyamanan' => 5,
        ]);

        $result->assertStatus(422);
    }

    public function testRekapMembutuhkanAuth(): void
    {
        $result = $this->call('get', '/api/admin/survei/rekap');

        $result->assertStatus(401);
    }

    public function testRekapMengembalikanStrukturLengkap(): void
    {
        $token   = (new JwtLibrary())->encode(['admin_id' => 1, 'username' => 'admin']);
        $headers = ['Authorization' => 'Bearer ' . $token];

        $today = date('Y-m-d');
        $result = $this->withHeaders($headers)->call('get', "/api/admin/survei/rekap?start={$today}&end={$today}");

        $result->assertStatus(200);
        $body = json_decode($result->getJSON(), true);
        $this->assertArrayHasKey('summary', $body);
        $this->assertArrayHasKey('per_petugas', $body);
        $this->assertArrayHasKey('semua', $body);
    }
}
