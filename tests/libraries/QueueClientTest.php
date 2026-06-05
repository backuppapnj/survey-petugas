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
    public function testBelumDikonfigurasiMengembalikanNull(): void
    {
        // Pastikan env kosong (default di lingkungan test).
        putenv('ANTRIAN_PTSP_URL');
        putenv('ANTRIAN_PTSP_API_KEY');

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
}
