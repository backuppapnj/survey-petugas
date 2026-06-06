<?php

namespace Tests\Controllers\Api;

use App\Libraries\JwtLibrary;
use App\Models\SettingsModel;
use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\DatabaseTestTrait;
use CodeIgniter\Test\FeatureTestTrait;

/**
 * @internal
 */
final class SettingsControllerTest extends CIUnitTestCase
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

    public function testPublicSettingsMengembalikanHanyaSettingPublik(): void
    {
        $result = $this->call('get', '/api/settings/public');

        $result->assertStatus(200);
        $body = json_decode($result->getJSON(), true);

        // Setting publik harus ada.
        $this->assertArrayHasKey('app_title', $body);
        $this->assertSame('Survei Kepuasan PTSP', $body['app_title']);
        // Setting privat (performance) TIDAK boleh bocor ke endpoint publik.
        $this->assertArrayNotHasKey('dashboard_poll_interval', $body);
    }

    public function testPublicSettingsCastingTipeBenar(): void
    {
        $result = $this->call('get', '/api/settings/public');
        $body   = json_decode($result->getJSON(), true);

        // kiosk_reset_timeout bertipe int -> harus integer, bukan string.
        $this->assertIsInt($body['kiosk_reset_timeout']);
        // ambang IKM bertipe float.
        $this->assertIsFloat($body['ikm_threshold_a']);
    }

    public function testAdminSettings401TanpaToken(): void
    {
        $result = $this->call('get', '/api/admin/settings');
        $result->assertStatus(401);
    }

    public function testAdminSettingsMengembalikanMetadata(): void
    {
        $result = $this->withHeaders($this->authHeader())->call('get', '/api/admin/settings');

        $result->assertStatus(200);
        $body = json_decode($result->getJSON(), true);
        $this->assertNotEmpty($body);
        // Tiap entri punya metadata lengkap.
        $first = $body[0];
        $this->assertArrayHasKey('key', $first);
        $this->assertArrayHasKey('value', $first);
        $this->assertArrayHasKey('type', $first);
        $this->assertArrayHasKey('category', $first);
        $this->assertArrayHasKey('label', $first);
        $this->assertArrayHasKey('is_public', $first);
    }

    public function testUpdateBatchMemperbaruiNilai(): void
    {
        $payload = json_encode([
            'settings' => [
                'app_title'           => 'Survei Kepuasan DPMPTSP',
                'kiosk_reset_timeout' => 8000,
            ],
        ]);

        $result = $this->withHeaders($this->authHeader())
            ->withBody($payload)
            ->call('put', '/api/admin/settings');

        $result->assertStatus(200);
        $body = json_decode($result->getJSON(), true);
        $this->assertContains('app_title', $body['updated']);
        $this->assertContains('kiosk_reset_timeout', $body['updated']);

        // Verifikasi tersimpan & ter-cast benar.
        $model = new SettingsModel();
        $this->assertSame('Survei Kepuasan DPMPTSP', $model->get('app_title'));
        $this->assertSame(8000, $model->get('kiosk_reset_timeout'));
    }

    public function testUpdateBatchMengabaikanKeyTakDikenal(): void
    {
        $payload = json_encode([
            'settings' => [
                'app_title'   => 'Judul Baru',
                'key_ngawur'  => 'nilai liar',
            ],
        ]);

        $result = $this->withHeaders($this->authHeader())
            ->withBody($payload)
            ->call('put', '/api/admin/settings');

        $result->assertStatus(200);
        $body = json_decode($result->getJSON(), true);
        $this->assertContains('app_title', $body['updated']);
        $this->assertNotContains('key_ngawur', $body['updated']);

        // Key liar tidak boleh masuk DB.
        $this->assertNull((new SettingsModel())->find('key_ngawur'));
    }

    public function testUpdateBatch422TanpaSettings(): void
    {
        $payload = json_encode(['settings' => []]);

        $result = $this->withHeaders($this->authHeader())
            ->withBody($payload)
            ->call('put', '/api/admin/settings');

        $result->assertStatus(422);
    }
}
