<?php

namespace Tests\Libraries;

use App\Libraries\QueueClient;
use CodeIgniter\Test\CIUnitTestCase;

/**
 * Menguji logika parsing & degradasi QueueClient tanpa jaringan.
 * Transport HTTP (request nyata) tidak diuji di sini — hanya method
 * murni parseResponse() dan jalur "belum dikonfigurasi -> null".
 *
 * @internal
 */
final class QueueClientTest extends CIUnitTestCase
{
    protected function tearDown(): void
    {
        putenv('ANTRIAN_PTSP_URL');
        putenv('ANTRIAN_PTSP_API_KEY');
        parent::tearDown();
    }

    public function testBelumDikonfigurasiMengembalikanNull(): void
    {
        // Set ke string kosong secara eksplisit (lebih robust daripada unset).
        putenv('ANTRIAN_PTSP_URL=');
        putenv('ANTRIAN_PTSP_API_KEY=');

        $client = new QueueClient();
        $this->assertNull($client->getServedCounts('2026-06-01', '2026-06-05'));
    }

    public function testParseResponseStatusBukan200MengembalikanNull(): void
    {
        $client = new QueueClient();
        $this->assertNull($client->parseResponse(500, '{"data":[]}'));
        $this->assertNull($client->parseResponse(401, ''));
    }

    public function testParseResponseBodyRusakMengembalikanNull(): void
    {
        $client = new QueueClient();
        $this->assertNull($client->parseResponse(200, null));
        $this->assertNull($client->parseResponse(200, ''));
        $this->assertNull($client->parseResponse(200, '{bukan json'));
        $this->assertNull($client->parseResponse(200, '"string"'));
        $this->assertNull($client->parseResponse(200, '{"tidak_ada_data":1}'));
    }

    public function testParseResponseValidMengembalikanMap(): void
    {
        $client = new QueueClient();
        $body = '{"data":[{"date":"2026-06-02","served":12},{"date":"2026-06-03","served":5}],"start":"2026-06-01","end":"2026-06-05"}';

        $map = $client->parseResponse(200, $body);

        $this->assertSame(['2026-06-02' => 12, '2026-06-03' => 5], $map);
    }

    public function testParseResponseDataKosongMengembalikanArrayKosong(): void
    {
        // data: [] berarti antrean tersedia namun 0 tiket selesai -> map kosong,
        // BUKAN null (yang berarti antrean tidak tersedia/gagal).
        $client = new QueueClient();
        $this->assertSame([], $client->parseResponse(200, '{"data":[],"start":"2026-06-01","end":"2026-06-05"}'));
    }
}
