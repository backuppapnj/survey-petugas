<?php

namespace Tests\Controllers\Api;

use App\Libraries\JwtLibrary;
use App\Models\SurveiModel;
use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\DatabaseTestTrait;
use CodeIgniter\Test\FeatureTestTrait;
use PhpOffice\PhpSpreadsheet\IOFactory;

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

    public function testExportTidakRentanFormulaInjection(): void
    {
        // Submit survei dengan saran payload formula injection.
        // (htmlspecialchars pada sanitasi TIDAK menetralkan '=', jadi payload
        // sampai ke export — harus disimpan sebagai STRING, bukan formula.)
        (new SurveiModel())->insert([
            'petugas_id' => 1,
            'kecepatan'  => 5,
            'keramahan'  => 5,
            'informasi'  => 5,
            'kenyamanan' => 5,
            'saran'      => '=1+2',
        ]);

        $token   = (new JwtLibrary())->encode(['admin_id' => 1, 'username' => 'admin']);
        $today   = date('Y-m-d');
        $result  = $this->withHeaders(['Authorization' => 'Bearer ' . $token])
            ->call('get', "/api/admin/survei/export?start={$today}&end={$today}");

        $result->assertStatus(200);

        // Muat ulang xlsx hasil export dan periksa sel 'saran' (kolom G, baris 2).
        $tmp = tempnam(sys_get_temp_dir(), 'xlsxtest') . '.xlsx';
        file_put_contents($tmp, $result->response()->getBody());

        try {
            $spreadsheet = IOFactory::load($tmp);
            $cell        = $spreadsheet->getSheetByName('Data Mentah')->getCell('G2');

            // Tidak boleh ditafsirkan sebagai formula, dan nilai literal terjaga.
            $this->assertFalse($cell->isFormula(), 'Sel saran tidak boleh menjadi formula');
            $this->assertSame('=1+2', $cell->getValue());
        } finally {
            @unlink($tmp);
        }
    }
}
