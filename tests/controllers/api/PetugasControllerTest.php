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
        // Gunakan survey_token sebagai pengganti id numerik (public route kini by token).
        $token  = (new \App\Models\PetugasModel())->find(1)['survey_token'];
        $result = $this->call('get', "/api/petugas/{$token}");

        $result->assertStatus(200);
        $body = json_decode($result->getJSON(), true);
        $this->assertSame('Budi Santoso', $body['nama']);
        // Petugas hasil seeder belum punya foto, sehingga foto_url bernilai null.
        $this->assertNull($body['foto_url']);
    }

    public function testShowPublicFotoUrlBerisiPathSaatAdaFoto(): void
    {
        // Set foto agar serialisasi menghasilkan URL uploads yang valid.
        $this->db->table('petugas')->where('id', 1)->update(['foto' => 'contoh.png']);

        $token  = (new \App\Models\PetugasModel())->find(1)['survey_token'];
        $result = $this->call('get', "/api/petugas/{$token}");

        $result->assertStatus(200);
        $body = json_decode($result->getJSON(), true);
        $this->assertSame('/api/uploads/contoh.png', $body['foto_url']);
    }

    public function testShowPublic404UntukPetugasNonAktif(): void
    {
        $this->db->table('petugas')->where('id', 1)->update(['is_active' => 0]);

        // Token masih valid, tapi petugas non-aktif — getActiveByToken harus kembalikan null.
        $token  = (new \App\Models\PetugasModel())->find(1)['survey_token'];
        $result = $this->call('get', "/api/petugas/{$token}");

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

    public function testShowPublikMemakaiToken(): void
    {
        $token = (new \App\Models\PetugasModel())->find(1)['survey_token'];

        $ok = $this->call('get', "/api/petugas/{$token}");
        $ok->assertStatus(200);
        $body = json_decode($ok->getJSON(), true);
        $this->assertSame(1, $body['id']);

        // Token asing (bukan id numerik) -> 404
        $this->call('get', '/api/petugas/tokentidakada0')->assertStatus(404);
    }

    public function testShowPublicTidakMembocorkanSurveyToken(): void
    {
        // KONTRAK KEAMANAN: response publik TIDAK boleh menyertakan survey_token
        // maupun is_active (keduanya hanya untuk konteks admin).
        $token = (new \App\Models\PetugasModel())->find(1)['survey_token'];
        $body  = json_decode($this->call('get', "/api/petugas/{$token}")->getJSON(), true);

        $this->assertArrayNotHasKey('survey_token', $body);
        $this->assertArrayNotHasKey('is_active', $body);
    }

    public function testRegenerateTokenButuhAuthDanMengubahToken(): void
    {
        $model = new \App\Models\PetugasModel();
        $lama  = $model->find(1)['survey_token'];

        $this->call('post', '/api/admin/petugas/1/regenerate-token')->assertStatus(401);

        $jwt = (new \App\Libraries\JwtLibrary())->encode(['admin_id' => 1, 'username' => 'admin']);
        $res = $this->withHeaders(['Authorization' => 'Bearer ' . $jwt])
            ->call('post', '/api/admin/petugas/1/regenerate-token');
        $res->assertStatus(200);

        $baru = json_decode($res->getJSON(), true)['survey_token'];
        $this->assertNotSame($lama, $baru);
        $this->assertSame($baru, $model->find(1)['survey_token']);
    }

    public function testCreateAdminDenganUploadFotoBerhasil(): void
    {
        // Regresi: validateSecureUpload() harus menerima UploadedFile dari
        // namespace CodeIgniter\HTTP\Files (bukan CodeIgniter\HTTP) — type hint
        // yang salah sebelumnya menyebabkan TypeError 500 saat menyimpan petugas.
        $tmp = tempnam(sys_get_temp_dir(), 'pty') . '.jpg';
        $im  = imagecreatetruecolor(48, 48);
        imagejpeg($im, $tmp, 90);
        imagedestroy($im);

        // isValid() butuh file dianggap hasil upload HTTP; pakai mode test (5th arg true).
        $file = new \CodeIgniter\HTTP\Files\UploadedFile(
            $tmp,
            'foto.jpg',
            'image/jpeg',
            filesize($tmp),
            UPLOAD_ERR_OK,
        );

        $controller = new \App\Controllers\Api\PetugasController();
        $method     = (new \ReflectionClass($controller))->getMethod('validateSecureUpload');
        $method->setAccessible(true);

        // Pemanggilan ini akan melempar TypeError jika type hint salah (regresi
        // utama). Lolos tanpa TypeError + mengembalikan array berarti type hint
        // CodeIgniter\HTTP\Files\UploadedFile sudah benar.
        $result = $method->invoke($controller, $file);

        $this->assertIsArray($result);
        $this->assertArrayHasKey('valid', $result);
        $this->assertArrayHasKey('filename', $result);

        @unlink($tmp);
    }
}
