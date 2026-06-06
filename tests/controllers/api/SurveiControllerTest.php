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

    protected function setUp(): void
    {
        parent::setUp();
        // Bersihkan cache throttler agar token bucket tidak bocor antar test case
        // maupun antar test class (konsisten dengan pola RateLimitFilterTest).
        cache()->clean();
        // Reset singleton throttler agar instance baru membaca cache yang bersih.
        \CodeIgniter\Config\Services::resetSingle('throttler');
    }

    protected function tearDown(): void
    {
        cache()->clean();
        \CodeIgniter\Config\Services::resetSingle('throttler');
        parent::tearDown();
    }

    public function testSubmitSuksesDenganRatingValid(): void
    {
        $token = (new \App\Models\PetugasModel())->find(1)['survey_token'];

        $result = $this->withBodyFormat('json')->call('post', '/api/survei', [
            'token'      => $token,
            'kecepatan'  => 4,
            'keramahan'  => 3,
            'informasi'  => 4,
            'kenyamanan' => 3,
            'saran'      => 'Mantap',
        ]);

        $result->assertStatus(201);
        $this->assertSame(1, $this->db->table('survei')->countAllResults());
    }

    public function testSubmitGagalDenganRatingDiluar1Sampai4(): void
    {
        $token = (new \App\Models\PetugasModel())->find(1)['survey_token'];

        $result = $this->withBodyFormat('json')->call('post', '/api/survei', [
            'token'      => $token,
            'kecepatan'  => 5,
            'keramahan'  => 3,
            'informasi'  => 4,
            'kenyamanan' => 3,
        ]);

        $result->assertStatus(422);
    }

    public function testSubmitGagalUntukPetugasNonAktif(): void
    {
        $token = (new \App\Models\PetugasModel())->find(1)['survey_token'];
        $this->db->table('petugas')->where('id', 1)->update(['is_active' => 0]);

        $result = $this->withBodyFormat('json')->call('post', '/api/survei', [
            'token'      => $token,
            'kecepatan'  => 4, 'keramahan' => 4, 'informasi' => 4, 'kenyamanan' => 4,
        ]);

        $result->assertStatus(422);
    }

    public function testSubmitGagalTokenTidakDikenal(): void
    {
        $result = $this->withBodyFormat('json')->call('post', '/api/survei', [
            'token'      => 'tokenpalsu000000',
            'kecepatan'  => 4, 'keramahan' => 4, 'informasi' => 4, 'kenyamanan' => 4,
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
