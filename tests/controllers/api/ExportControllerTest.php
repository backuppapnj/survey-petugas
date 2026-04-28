<?php

namespace Tests\Controllers\Api;

use App\Libraries\JwtLibrary;
use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\DatabaseTestTrait;
use CodeIgniter\Test\FeatureTestTrait;

/**
 * @internal
 */
final class ExportControllerTest extends CIUnitTestCase
{
    use DatabaseTestTrait;
    use FeatureTestTrait;

    protected $migrate   = true;
    protected $refresh   = true;
    protected $seed      = 'App\Database\Seeds\DatabaseSeeder';
    protected $namespace = 'App';

    public function testExportMembutuhkanAuth(): void
    {
        $result = $this->call('get', '/api/admin/survei/export');

        $result->assertStatus(401);
    }

    public function testExportMengembalikanFileXlsx(): void
    {
        $token   = (new JwtLibrary())->encode(['admin_id' => 1, 'username' => 'admin']);
        $headers = ['Authorization' => 'Bearer ' . $token];

        $today  = date('Y-m-d');
        $result = $this->withHeaders($headers)->call('get', "/api/admin/survei/export?start={$today}&end={$today}");

        $result->assertStatus(200);
        $result->assertHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        // Body binary harus diambil dari response object internal,
        // karena TestResponse::__call meneruskan getBody() ke DOMParser
        // yang akan merender ulang konten binary sebagai HTML.
        $body = $result->response()->getBody();
        $this->assertNotEmpty($body);
        // Magic bytes XLSX (PK zip)
        $this->assertSame('PK', substr($body, 0, 2));
    }
}
