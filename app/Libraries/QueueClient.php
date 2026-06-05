<?php

namespace App\Libraries;

use CodeIgniter\Config\Services;
use Throwable;

/**
 * Klien HTTP untuk mengambil data agregat dari sistem antrean PTSP
 * (aplikasi terpisah). Dirancang "fail-soft": setiap kegagalan
 * (tak terkonfigurasi, timeout, status non-200, body rusak) menghasilkan
 * null agar dashboard tetap berfungsi tanpa data antrean.
 */
class QueueClient
{
    private string $baseUrl;
    private string $apiKey;
    private int $timeout;

    public function __construct()
    {
        // rtrim slash agar penggabungan path konsisten.
        $this->baseUrl = rtrim((string) env('ANTRIAN_PTSP_URL', ''), '/');
        $this->apiKey = (string) env('ANTRIAN_PTSP_API_KEY', '');
        $this->timeout = (int) env('ANTRIAN_PTSP_TIMEOUT', 5);
    }

    /**
     * Ambil jumlah tiket 'completed' per tanggal dari antrean.
     *
     * @return array<string,int>|null Map ['YYYY-MM-DD' => served] atau null bila gagal.
     */
    public function getServedCounts(string $start, string $end): ?array
    {
        // Degradasi anggun: belum dikonfigurasi -> jangan panggil jaringan.
        if ($this->baseUrl === '' || $this->apiKey === '') {
            return null;
        }

        try {
            $client = Services::curlrequest([
                'baseURI' => $this->baseUrl . '/',
                'timeout' => $this->timeout,
                'http_errors' => false, // jangan lempar exception pada status >= 400
            ]);

            $response = $client->request('GET', 'api/served-counts', [
                'headers' => [
                    'X-Api-Key' => $this->apiKey,
                    'Accept' => 'application/json',
                ],
                'query' => ['start' => $start, 'end' => $end],
            ]);

            return $this->parseResponse(
                $response->getStatusCode(),
                (string) $response->getBody()
            );
        } catch (Throwable $e) {
            log_message('error', 'QueueClient gagal menghubungi antrean: ' . $e->getMessage());

            return null;
        }
    }

    /**
     * Parse respons HTTP menjadi map tanggal->jumlah. Method murni (tanpa
     * efek samping jaringan) agar mudah diuji.
     *
     * @return array<string,int>|null
     */
    public function parseResponse(int $status, ?string $body): ?array
    {
        if ($status !== 200 || $body === null || $body === '') {
            return null;
        }

        $decoded = json_decode($body, true);
        if (! is_array($decoded) || ! isset($decoded['data']) || ! is_array($decoded['data'])) {
            return null;
        }

        $map = [];
        foreach ($decoded['data'] as $row) {
            if (is_array($row) && isset($row['date'], $row['served']) && is_numeric($row['served'])) {
                $map[(string) $row['date']] = (int) $row['served'];
            }
        }

        return $map;
    }
}
