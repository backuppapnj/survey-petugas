# Dashboard Monitoring Anomali Survei — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menambahkan panel "Anomali" pada dashboard admin survei yang mendeteksi 3 sinyal manipulasi nilai IKM (submit di luar jam layanan, total survei > total tamu dilayani, dan petugas outlier) dengan memanfaatkan data agregat sistem antrean PTSP via satu endpoint API read-only.

**Architecture:** Frontend memanggil `GET /api/admin/anomali` (di balik JWT) → `AnomaliController` → `AnomalyService` menghitung 3 sinyal dari `SurveiModel::getSubmissionsInRange` (satu query sargable) dan `QueueClient` (HTTP ke antrian-ptsp, degradasi anggun bila gagal). antrian-ptsp hanya menerima 1 endpoint baru `GET /api/served-counts` yang mengembalikan jumlah tiket `completed` per tanggal.

**Tech Stack:** CodeIgniter 4 (PHP 8.x) + PHPUnit, Laravel + Pest (antrian-ptsp), React 19 + TypeScript + Vitest + Testing Library.

**Branch:** Lanjutkan di `feature/production-readiness` (spec & seluruh pekerjaan sebelumnya ada di sini).

**Spec sumber:** `docs/superpowers/specs/2026-06-05-anomaly-dashboard-design.md`

---

## ⚠️ Batasan Kritis (antrian-ptsp)

Project antrian-ptsp (`E:\project\antrian-ptsp`, Laravel) **HANYA boleh** menerima penambahan endpoint API. Jejak total yang diizinkan:

1. **1 file controller baru:** `app/Http/Controllers/Api/ServedCountController.php`
2. **2 baris pada `routes/api.php`:** 1 baris `use` + 1 baris registrasi route (di dalam group `throttle:60,1` yang sudah ada).
3. **1 file test baru (aditif):** `tests/Feature/Api/ServedCountTest.php`.

DILARANG: migrasi baru, mengubah model/enum/controller lain, mengubah `config/services.php`, atau file produksi lain. Kunci API dibaca via `env('SURVEY_DASHBOARD_API_KEY')` langsung di controller agar self-contained.

> **CATATAN PRODUKSI (wajib disampaikan ke admin antrian-ptsp):** Karena controller membaca `env()` langsung, bila antrian-ptsp menjalankan `php artisan config:cache` di produksi, `env()` di luar file config akan mengembalikan `null`. Solusinya saat deploy: JANGAN cache config, ATAU (bila diizinkan kemudian) pindahkan kunci ke `config/services.php`. Tandai ini saat handover.

---

## File Structure

### antrian-ptsp (Laravel) — aditif saja
- **Create** `app/Http/Controllers/Api/ServedCountController.php` — auth X-Api-Key + agregasi `completed` per `service_date`.
- **Modify** `routes/api.php:3` (tambah `use`) dan `routes/api.php` (1 baris route dalam group `throttle:60,1`).
- **Create (test)** `tests/Feature/Api/ServedCountTest.php`.

### survey-petugas (CodeIgniter 4)
- **Modify** `app/Models/SurveiModel.php` — tambah `getSubmissionsInRange()` (query lean & sargable).
- **Create** `app/Libraries/QueueClient.php` — klien HTTP ke antrean (CURLRequest), `parseResponse()` murni untuk testabilitas.
- **Create** `app/Services/AnomalyService.php` — hitung 3 sinyal, gabung jadi laporan.
- **Create** `app/Controllers/Api/AnomaliController.php` — endpoint `GET /api/admin/anomali`.
- **Modify** `app/Config/Routes.php` — 1 baris route di group admin (filter `jwt`).
- **Modify** `.env.production.example` — dokumentasikan konfigurasi baru.
- **Create (test)** `tests/libraries/QueueClientTest.php`, `tests/services/AnomalyServiceTest.php`, `tests/controllers/api/AnomaliControllerTest.php`.

### frontend (React)
- **Modify** `frontend/src/types/index.ts` — tipe `AnomaliResponse` dkk.
- **Modify** `frontend/src/lib/api.ts` — `getAnomali()`.
- **Create** `frontend/src/components/dashboard/AnomaliPanel.tsx` — UI panel anomali.
- **Modify** `frontend/src/pages/DashboardPage.tsx` — tab "Anomali" + state/fetch.
- **Create (test)** `frontend/src/components/dashboard/AnomaliPanel.test.tsx`.
- **Modify (test)** `frontend/src/pages/DashboardPage.test.tsx` — mock `getAnomali` + 1 test tab.

---

## FASE A — Endpoint antrian-ptsp (Laravel + Pest)

> Jalankan perintah di direktori `E:\project\antrian-ptsp`. Project ini memakai Pest (`uses(RefreshDatabase::class)`).

### Task A1: Controller `ServedCountController` + route + test

**Files:**
- Create: `E:\project\antrian-ptsp\app\Http\Controllers\Api\ServedCountController.php`
- Modify: `E:\project\antrian-ptsp\routes\api.php`
- Test: `E:\project\antrian-ptsp\tests\Feature\Api\ServedCountTest.php`

- [ ] **Step 1: Tulis failing test**

Buat `tests/Feature/Api/ServedCountTest.php`:

```php
<?php

use App\Enums\QueueStatus;
use App\Models\QueueTicket;
use Illuminate\Foundation\Testing\RefreshDatabase;

use function Pest\Laravel\getJson;
use function Pest\Laravel\withHeaders;

uses(RefreshDatabase::class);

beforeEach(function () {
    // Set shared secret untuk endpoint (dibaca controller via env()).
    putenv('SURVEY_DASHBOARD_API_KEY=secret-test-key');
    $_ENV['SURVEY_DASHBOARD_API_KEY'] = 'secret-test-key';
    $_SERVER['SURVEY_DASHBOARD_API_KEY'] = 'secret-test-key';
});

afterEach(function () {
    putenv('SURVEY_DASHBOARD_API_KEY');
    unset($_ENV['SURVEY_DASHBOARD_API_KEY'], $_SERVER['SURVEY_DASHBOARD_API_KEY']);
});

test('menolak permintaan tanpa X-Api-Key', function () {
    getJson('/api/served-counts?start=2026-06-01&end=2026-06-05')
        ->assertStatus(401);
});

test('menolak X-Api-Key yang salah', function () {
    withHeaders(['X-Api-Key' => 'kunci-salah'])
        ->getJson('/api/served-counts?start=2026-06-01&end=2026-06-05')
        ->assertStatus(401);
});

test('mengembalikan jumlah tiket completed per tanggal', function () {
    QueueTicket::factory()->count(3)->create([
        'status' => QueueStatus::Completed,
        'service_date' => '2026-06-02',
    ]);
    QueueTicket::factory()->count(2)->create([
        'status' => QueueStatus::Completed,
        'service_date' => '2026-06-03',
    ]);
    // Tiket non-completed harus diabaikan.
    QueueTicket::factory()->count(5)->create([
        'status' => QueueStatus::Waiting,
        'service_date' => '2026-06-02',
    ]);

    withHeaders(['X-Api-Key' => 'secret-test-key'])
        ->getJson('/api/served-counts?start=2026-06-01&end=2026-06-05')
        ->assertOk()
        ->assertJsonPath('start', '2026-06-01')
        ->assertJsonPath('end', '2026-06-05')
        ->assertJsonFragment(['date' => '2026-06-02', 'served' => 3])
        ->assertJsonFragment(['date' => '2026-06-03', 'served' => 2]);
});

test('menolak rentang tanggal terbalik', function () {
    withHeaders(['X-Api-Key' => 'secret-test-key'])
        ->getJson('/api/served-counts?start=2026-06-10&end=2026-06-01')
        ->assertStatus(422);
});
```

- [ ] **Step 2: Jalankan test, pastikan GAGAL**

Run: `php artisan test --filter=ServedCountTest`
Expected: FAIL — route `/api/served-counts` belum ada (404 / "Not Found").

- [ ] **Step 3: Buat controller**

Buat `app/Http/Controllers/Api/ServedCountController.php`:

```php
<?php

namespace App\Http\Controllers\Api;

use App\Enums\QueueStatus;
use App\Http\Controllers\Controller;
use App\Models\QueueTicket;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

/**
 * Endpoint read-only untuk dashboard survei (aplikasi terpisah).
 * Mengembalikan jumlah tiket berstatus 'completed' (tamu selesai dilayani)
 * per tanggal layanan. Hanya agregat — tanpa data pribadi pengunjung.
 *
 * Autentikasi: shared secret via header X-Api-Key (dibaca dari env
 * SURVEY_DASHBOARD_API_KEY agar endpoint self-contained tanpa mengubah
 * file config lain).
 */
class ServedCountController extends Controller
{
    private const MAX_RANGE_DAYS = 92;

    public function index(Request $request): JsonResponse
    {
        $expected = (string) env('SURVEY_DASHBOARD_API_KEY', '');
        $provided = (string) $request->header('X-Api-Key', '');

        // Tolak bila kunci server belum dikonfigurasi atau tidak cocok.
        if ($expected === '' || ! hash_equals($expected, $provided)) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $validated = $request->validate([
            'start' => ['nullable', 'date_format:Y-m-d'],
            'end' => ['nullable', 'date_format:Y-m-d'],
        ]);

        $start = $validated['start'] ?? now()->toDateString();
        $end = $validated['end'] ?? now()->toDateString();

        if ($start > $end) {
            return response()->json(['message' => 'Rentang tanggal tidak valid'], 422);
        }

        if (Carbon::parse($start)->diffInDays(Carbon::parse($end)) > self::MAX_RANGE_DAYS) {
            return response()->json(['message' => 'Rentang tanggal maksimal 92 hari'], 422);
        }

        $rows = QueueTicket::query()
            ->where('status', QueueStatus::Completed->value)
            ->whereBetween('service_date', [$start, $end])
            ->selectRaw('service_date, COUNT(*) as served')
            ->groupBy('service_date')
            ->orderBy('service_date')
            ->get();

        $data = $rows->map(static fn ($row) => [
            'date' => Carbon::parse($row->service_date)->toDateString(),
            'served' => (int) $row->served,
        ])->all();

        return response()->json([
            'data' => $data,
            'start' => $start,
            'end' => $end,
        ]);
    }
}
```

- [ ] **Step 4: Daftarkan route**

Di `routes/api.php`, tambahkan baris `use` setelah baris `use App\Http\Controllers\Api\TimeController;` (baris 5):

```php
use App\Http\Controllers\Api\ServedCountController;
```

Lalu di dalam group `Route::middleware('throttle:60,1')->group(function () {` yang sudah ada, tambahkan satu baris (mis. setelah baris `time`):

```php
    Route::get('served-counts', [ServedCountController::class, 'index'])->name('api.served-counts');
```

- [ ] **Step 5: Jalankan test, pastikan LULUS**

Run: `php artisan test --filter=ServedCountTest`
Expected: PASS (4 test hijau).

- [ ] **Step 6: Pastikan tidak ada regresi pada suite antrian-ptsp**

Run: `php artisan test --filter=Api`
Expected: Semua test grup Api hijau (tidak ada yang rusak akibat tambahan route).

- [ ] **Step 7: Commit (di repo antrian-ptsp)**

```bash
git add app/Http/Controllers/Api/ServedCountController.php routes/api.php tests/Feature/Api/ServedCountTest.php
git commit -m "feat(api): add read-only served-counts endpoint for survey dashboard"
```

---

## FASE B — Backend survey-petugas (CodeIgniter 4 + PHPUnit)

> Jalankan perintah di direktori `E:\project\survey-petugas`.

### Task B1: `SurveiModel::getSubmissionsInRange`

**Files:**
- Modify: `app/Models/SurveiModel.php`
- Test: `tests/services/AnomalyServiceTest.php` (akan dibuat di Task B3; method ini diuji tidak langsung lewat service). Untuk RED langsung pada model, buat test ringkas di bawah.

- [ ] **Step 1: Tulis failing test**

Buat `tests/models/SurveiModelRangeTest.php`:

```php
<?php

namespace Tests\Models;

use App\Models\SurveiModel;
use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\DatabaseTestTrait;

/**
 * @internal
 */
final class SurveiModelRangeTest extends CIUnitTestCase
{
    use DatabaseTestTrait;

    protected $migrate = true;
    protected $refresh = true;
    protected $namespace = 'App';

    private function seedPetugas(int $id): void
    {
        db_connect()->table('petugas')->insert([
            'id' => $id,
            'nama' => 'Petugas ' . $id,
            'foto' => 'x.png',
            'loket' => 'L1',
            'unit_kerja' => 'Umum',
            'is_active' => 1,
            'created_at' => '2026-06-01 08:00:00',
            'updated_at' => '2026-06-01 08:00:00',
        ]);
    }

    public function testGetSubmissionsInRangeHanyaDalamRentang(): void
    {
        $this->seedPetugas(1);
        db_connect()->table('survei')->insertBatch([
            ['petugas_id' => 1, 'kecepatan' => 5, 'keramahan' => 5, 'informasi' => 5, 'kenyamanan' => 5, 'saran' => null, 'created_at' => '2026-06-02 09:00:00'],
            ['petugas_id' => 1, 'kecepatan' => 4, 'keramahan' => 4, 'informasi' => 4, 'kenyamanan' => 4, 'saran' => null, 'created_at' => '2026-06-03 10:00:00'],
            // Di luar rentang — harus diabaikan.
            ['petugas_id' => 1, 'kecepatan' => 3, 'keramahan' => 3, 'informasi' => 3, 'kenyamanan' => 3, 'saran' => null, 'created_at' => '2026-05-30 10:00:00'],
        ]);

        $rows = (new SurveiModel())->getSubmissionsInRange('2026-06-01', '2026-06-05');

        $this->assertCount(2, $rows);
        $this->assertSame('2026-06-02 09:00:00', $rows[0]['created_at']);
        $this->assertArrayHasKey('petugas_id', $rows[0]);
        $this->assertArrayNotHasKey('kecepatan', $rows[0]); // hanya kolom lean
    }
}
```

- [ ] **Step 2: Jalankan test, pastikan GAGAL**

Run: `php vendor/bin/phpunit --filter=SurveiModelRangeTest`
Expected: FAIL — "Call to undefined method ...getSubmissionsInRange()".

- [ ] **Step 3: Implementasi method**

Di `app/Models/SurveiModel.php`, tambahkan method baru setelah `getRekapByDateRange()` (sebelum penutup class):

```php
    /**
     * Ambil submission survei dalam rentang tanggal dengan kolom minimal
     * (id, petugas_id, created_at) untuk analisis anomali.
     *
     * PERFORMA: memakai rentang DATETIME mentah agar tetap sargable
     * (memanfaatkan index pada created_at), konsisten dengan
     * getRekapByDateRange().
     *
     * @return list<array{id:int, petugas_id:int, created_at:string}>
     */
    public function getSubmissionsInRange(string $start, string $end): array
    {
        return $this->select('id, petugas_id, created_at')
            ->where('created_at >=', $start . ' 00:00:00')
            ->where('created_at <=', $end . ' 23:59:59')
            ->orderBy('created_at', 'ASC')
            ->findAll();
    }
```

- [ ] **Step 4: Jalankan test, pastikan LULUS**

Run: `php vendor/bin/phpunit --filter=SurveiModelRangeTest`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/Models/SurveiModel.php tests/models/SurveiModelRangeTest.php
git commit -m "feat(survei): add getSubmissionsInRange for anomaly analysis"
```

---

### Task B2: `QueueClient` library

**Files:**
- Create: `app/Libraries/QueueClient.php`
- Test: `tests/libraries/QueueClientTest.php`

- [ ] **Step 1: Tulis failing test**

Buat `tests/libraries/QueueClientTest.php`:

```php
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
```

- [ ] **Step 2: Jalankan test, pastikan GAGAL**

Run: `php vendor/bin/phpunit --filter=QueueClientTest`
Expected: FAIL — class `App\Libraries\QueueClient` tidak ada.

- [ ] **Step 3: Implementasi QueueClient**

Buat `app/Libraries/QueueClient.php` (API CURLRequest sudah diverifikasi via Context7 — `service('curlrequest', $opts)`, `request('GET', $path, ['headers'=>..,'query'=>..])`, `getStatusCode()`, `getBody()`, opsi `http_errors=false`):

```php
<?php

namespace App\Libraries;

use Config\Services;
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
            if (is_array($row) && isset($row['date'], $row['served'])) {
                $map[(string) $row['date']] = (int) $row['served'];
            }
        }

        return $map;
    }
}
```

- [ ] **Step 4: Jalankan test, pastikan LULUS**

Run: `php vendor/bin/phpunit --filter=QueueClientTest`
Expected: PASS (4 test hijau).

- [ ] **Step 5: Commit**

```bash
git add app/Libraries/QueueClient.php tests/libraries/QueueClientTest.php
git commit -m "feat(anomali): add fail-soft QueueClient for antrean integration"
```

---

### Task B3: `AnomalyService`

**Files:**
- Create: `app/Services/AnomalyService.php`
- Test: `tests/services/AnomalyServiceTest.php`

- [ ] **Step 1: Tulis failing test**

Buat `tests/services/AnomalyServiceTest.php`:

```php
<?php

namespace Tests\Services;

use App\Libraries\QueueClient;
use App\Services\AnomalyService;
use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\DatabaseTestTrait;

/**
 * @internal
 */
final class AnomalyServiceTest extends CIUnitTestCase
{
    use DatabaseTestTrait;

    protected $migrate = true;
    protected $refresh = true;
    protected $namespace = 'App';

    protected function setUp(): void
    {
        parent::setUp();
        // Ambang dibuat kecil agar outlier mudah diuji secara deterministik.
        putenv('OUTLIER_MIN=3');
        putenv('OUTLIER_FACTOR=2');
        putenv('SERVICE_HOUR_START=8');
        putenv('SERVICE_HOUR_END=16');
    }

    protected function tearDown(): void
    {
        putenv('OUTLIER_MIN');
        putenv('OUTLIER_FACTOR');
        putenv('SERVICE_HOUR_START');
        putenv('SERVICE_HOUR_END');
        parent::tearDown();
    }

    private function seedPetugas(int $id, string $nama): void
    {
        db_connect()->table('petugas')->insert([
            'id' => $id,
            'nama' => $nama,
            'foto' => 'x.png',
            'loket' => 'L1',
            'unit_kerja' => 'Umum',
            'is_active' => 1,
            'created_at' => '2026-06-01 08:00:00',
            'updated_at' => '2026-06-01 08:00:00',
        ]);
    }

    private function survei(int $petugasId, string $createdAt): array
    {
        return [
            'petugas_id' => $petugasId,
            'kecepatan' => 5, 'keramahan' => 5, 'informasi' => 5, 'kenyamanan' => 5,
            'saran' => null, 'created_at' => $createdAt,
        ];
    }

    /** Stub QueueClient dengan map served tetap (atau null). */
    private function stubQueue(?array $map): QueueClient
    {
        return new class($map) extends QueueClient {
            public function __construct(private ?array $stubMap)
            {
                parent::__construct();
            }

            public function getServedCounts(string $start, string $end): ?array
            {
                return $this->stubMap;
            }
        };
    }

    public function testMendeteksiSubmitDiLuarJam(): void
    {
        $this->seedPetugas(1, 'Budi');
        // 2026-06-06 adalah Sabtu (akhir pekan) -> luar jam.
        // 2026-06-02 (Selasa) 07:00 -> sebelum jam buka -> luar jam.
        // 2026-06-02 (Selasa) 10:00 -> dalam jam -> bukan anomali.
        db_connect()->table('survei')->insertBatch([
            $this->survei(1, '2026-06-02 10:00:00'),
            $this->survei(1, '2026-06-02 07:00:00'),
            $this->survei(1, '2026-06-06 11:00:00'),
        ]);

        $service = new AnomalyService(null, null, $this->stubQueue(null));
        $report = $service->analyze('2026-06-01', '2026-06-07');

        $this->assertSame(2, $report['luar_jam']['total']);
        $this->assertCount(2, $report['luar_jam']['items']);
        $this->assertSame('Budi', $report['luar_jam']['items'][0]['nama']);
    }

    public function testMendeteksiSurveiLebihBanyakDariDilayani(): void
    {
        $this->seedPetugas(1, 'Budi');
        // 3 survei pada 2026-06-02 (Selasa) jam normal.
        db_connect()->table('survei')->insertBatch([
            $this->survei(1, '2026-06-02 09:00:00'),
            $this->survei(1, '2026-06-02 10:00:00'),
            $this->survei(1, '2026-06-02 11:00:00'),
        ]);

        // Antrean hanya melayani 1 tamu di tanggal itu -> anomali (3 > 1).
        $service = new AnomalyService(null, null, $this->stubQueue(['2026-06-02' => 1]));
        $report = $service->analyze('2026-06-01', '2026-06-07');

        $this->assertTrue($report['harian']['antrean_tersedia']);
        $hari = array_values(array_filter(
            $report['harian']['items'],
            static fn ($r) => $r['date'] === '2026-06-02'
        ))[0];
        $this->assertSame(3, $hari['survei']);
        $this->assertSame(1, $hari['dilayani']);
        $this->assertTrue($hari['anomali']);
    }

    public function testAntreanTidakTersediaSaatQueueNull(): void
    {
        $this->seedPetugas(1, 'Budi');
        db_connect()->table('survei')->insertBatch([
            $this->survei(1, '2026-06-02 09:00:00'),
        ]);

        $service = new AnomalyService(null, null, $this->stubQueue(null));
        $report = $service->analyze('2026-06-01', '2026-06-07');

        $this->assertFalse($report['harian']['antrean_tersedia']);
        // Tanpa data antrean, tidak ada penanda anomali harian.
        foreach ($report['harian']['items'] as $r) {
            $this->assertFalse($r['anomali']);
        }
    }

    public function testMendeteksiPetugasOutlier(): void
    {
        $this->seedPetugas(1, 'Budi');
        $this->seedPetugas(2, 'Andi');
        $this->seedPetugas(3, 'Cici');

        $rows = [];
        // Budi: 10 survei (outlier), Andi: 2, Cici: 2. Median = 2.
        // OUTLIER_MIN=3, FACTOR=2 -> ambang: count>=3 DAN count>median*2 (>4).
        for ($i = 0; $i < 10; $i++) {
            $rows[] = $this->survei(1, '2026-06-02 09:00:00');
        }
        $rows[] = $this->survei(2, '2026-06-02 09:00:00');
        $rows[] = $this->survei(2, '2026-06-02 10:00:00');
        $rows[] = $this->survei(3, '2026-06-02 09:00:00');
        $rows[] = $this->survei(3, '2026-06-02 10:00:00');
        db_connect()->table('survei')->insertBatch($rows);

        $service = new AnomalyService(null, null, $this->stubQueue(null));
        $report = $service->analyze('2026-06-01', '2026-06-07');

        $this->assertSame(2.0, $report['petugas_outlier']['median']);
        $this->assertCount(1, $report['petugas_outlier']['items']);
        $this->assertSame('Budi', $report['petugas_outlier']['items'][0]['nama']);
        $this->assertSame(10, $report['petugas_outlier']['items'][0]['jumlah']);
        $this->assertSame(5.0, $report['petugas_outlier']['items'][0]['rasio']);
    }
}
```

- [ ] **Step 2: Jalankan test, pastikan GAGAL**

Run: `php vendor/bin/phpunit --filter=AnomalyServiceTest`
Expected: FAIL — class `App\Services\AnomalyService` tidak ada.

- [ ] **Step 3: Implementasi AnomalyService**

Buat `app/Services/AnomalyService.php`:

```php
<?php

namespace App\Services;

use App\Libraries\QueueClient;
use App\Models\PetugasModel;
use App\Models\SurveiModel;
use DateTime;

/**
 * Menghitung sinyal anomali survei dari satu pengambilan data submission:
 *   1) submit di luar jam layanan (Sen-Jum, SERVICE_HOUR_START..END),
 *   2) total survei > total tamu dilayani per tanggal (via antrean),
 *   3) petugas outlier (jumlah jauh di atas median antar-petugas).
 *
 * Dependensi disuntik lewat constructor agar mudah diuji (DIP).
 */
class AnomalyService
{
    private SurveiModel $surveiModel;
    private PetugasModel $petugasModel;
    private QueueClient $queueClient;
    private int $hourStart;
    private int $hourEnd;
    private int $outlierMin;
    private float $outlierFactor;

    public function __construct(
        ?SurveiModel $surveiModel = null,
        ?PetugasModel $petugasModel = null,
        ?QueueClient $queueClient = null
    ) {
        $this->surveiModel = $surveiModel ?? new SurveiModel();
        $this->petugasModel = $petugasModel ?? new PetugasModel();
        $this->queueClient = $queueClient ?? new QueueClient();
        $this->hourStart = (int) env('SERVICE_HOUR_START', 8);
        $this->hourEnd = (int) env('SERVICE_HOUR_END', 16);
        $this->outlierMin = (int) env('OUTLIER_MIN', 10);
        $this->outlierFactor = (float) env('OUTLIER_FACTOR', 3);
    }

    /**
     * @return array<string,mixed> Laporan anomali sesuai kontrak spec.
     */
    public function analyze(string $start, string $end): array
    {
        $submissions = $this->surveiModel->getSubmissionsInRange($start, $end);

        $offHours = [];        // item submit luar jam
        $perPetugasCount = []; // petugas_id => jumlah
        $dailyCount = [];      // 'YYYY-MM-DD' => jumlah survei

        foreach ($submissions as $row) {
            $pid = (int) $row['petugas_id'];
            $createdAt = (string) $row['created_at'];
            $date = substr($createdAt, 0, 10);

            $perPetugasCount[$pid] = ($perPetugasCount[$pid] ?? 0) + 1;
            $dailyCount[$date] = ($dailyCount[$date] ?? 0) + 1;

            if ($this->isOffHours($createdAt)) {
                $offHours[] = ['petugas_id' => $pid, 'created_at' => $createdAt];
            }
        }

        // Ambil nama petugas yang dibutuhkan (luar-jam + kandidat outlier).
        $namaMap = $this->buildNamaMap(array_merge(
            array_column($offHours, 'petugas_id'),
            array_keys($perPetugasCount)
        ));

        // Lengkapi nama pada item luar jam.
        foreach ($offHours as &$item) {
            $item['nama'] = $namaMap[$item['petugas_id']] ?? 'Unknown';
        }
        unset($item);

        return [
            'range' => ['start' => $start, 'end' => $end],
            'luar_jam' => ['total' => count($offHours), 'items' => $offHours],
            'harian' => $this->buildHarian($dailyCount, $start, $end),
            'petugas_outlier' => $this->buildOutlier($perPetugasCount, $namaMap),
        ];
    }

    /**
     * Submit dianggap di luar jam bila: akhir pekan (Sabtu/Minggu) ATAU
     * jam < hourStart ATAU jam >= hourEnd. Komponen waktu dibaca apa adanya
     * dari string DATETIME (tanpa konversi zona), konsisten dgn penyimpanan.
     */
    public function isOffHours(string $createdAt): bool
    {
        $dt = date_create($createdAt);
        if ($dt === false) {
            return false;
        }

        $dow = (int) $dt->format('N');  // 1=Senin .. 7=Minggu
        $hour = (int) $dt->format('G'); // 0..23

        if ($dow >= 6) {
            return true; // Sabtu/Minggu
        }

        return $hour < $this->hourStart || $hour >= $this->hourEnd;
    }

    /**
     * @param array<string,int> $dailyCount
     * @return array{antrean_tersedia:bool, items:list<array{date:string,survei:int,dilayani:int,anomali:bool}>}
     */
    private function buildHarian(array $dailyCount, string $start, string $end): array
    {
        $served = $this->queueClient->getServedCounts($start, $end);
        $tersedia = $served !== null;

        // Gabungkan tanggal dari survei dan (bila ada) dari antrean.
        $dates = array_keys($dailyCount);
        if ($tersedia) {
            $dates = array_merge($dates, array_keys($served));
        }
        $dates = array_values(array_unique($dates));
        sort($dates);

        $items = [];
        foreach ($dates as $date) {
            $survei = $dailyCount[$date] ?? 0;
            $dilayani = $tersedia ? ($served[$date] ?? 0) : 0;
            $items[] = [
                'date' => $date,
                'survei' => $survei,
                'dilayani' => $dilayani,
                // Anomali hanya bermakna bila data antrean tersedia.
                'anomali' => $tersedia && $survei > $dilayani,
            ];
        }

        return ['antrean_tersedia' => $tersedia, 'items' => $items];
    }

    /**
     * @param array<int,int> $perPetugasCount
     * @param array<int,string> $namaMap
     * @return array{median:float, items:list<array{petugas_id:int,nama:string,jumlah:int,rasio:float}>}
     */
    private function buildOutlier(array $perPetugasCount, array $namaMap): array
    {
        $median = $this->computeMedian(array_values($perPetugasCount));

        $items = [];
        foreach ($perPetugasCount as $pid => $jumlah) {
            if ($jumlah >= $this->outlierMin && $jumlah > $median * $this->outlierFactor) {
                $items[] = [
                    'petugas_id' => $pid,
                    'nama' => $namaMap[$pid] ?? 'Unknown',
                    'jumlah' => $jumlah,
                    'rasio' => $median > 0 ? round($jumlah / $median, 2) : (float) $jumlah,
                ];
            }
        }

        // Urutkan dari jumlah terbesar.
        usort($items, static fn ($a, $b) => $b['jumlah'] <=> $a['jumlah']);

        return ['median' => $median, 'items' => $items];
    }

    /**
     * @param list<int> $values
     */
    public function computeMedian(array $values): float
    {
        $n = count($values);
        if ($n === 0) {
            return 0.0;
        }

        sort($values);
        $mid = intdiv($n, 2);

        if ($n % 2 === 1) {
            return (float) $values[$mid];
        }

        return ($values[$mid - 1] + $values[$mid]) / 2;
    }

    /**
     * @param list<int> $ids
     * @return array<int,string> Map petugas_id => nama.
     */
    private function buildNamaMap(array $ids): array
    {
        $ids = array_values(array_unique(array_filter($ids)));
        if ($ids === []) {
            return [];
        }

        $map = [];
        foreach ($this->petugasModel->whereIn('id', $ids)->findAll() as $p) {
            $map[(int) $p['id']] = $p['nama'];
        }

        return $map;
    }
}
```

- [ ] **Step 4: Jalankan test, pastikan LULUS**

Run: `php vendor/bin/phpunit --filter=AnomalyServiceTest`
Expected: PASS (4 test hijau).

- [ ] **Step 5: Commit**

```bash
git add app/Services/AnomalyService.php tests/services/AnomalyServiceTest.php
git commit -m "feat(anomali): add AnomalyService computing 3 anomaly signals"
```

---

### Task B4: `AnomaliController` + route

**Files:**
- Create: `app/Controllers/Api/AnomaliController.php`
- Modify: `app/Config/Routes.php`
- Test: `tests/controllers/api/AnomaliControllerTest.php`

- [ ] **Step 1: Tulis failing test**

Buat `tests/controllers/api/AnomaliControllerTest.php`:

```php
<?php

namespace Tests\Controllers\Api;

use App\Libraries\JwtLibrary;
use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\DatabaseTestTrait;
use CodeIgniter\Test\FeatureTestTrait;

/**
 * @internal
 */
final class AnomaliControllerTest extends CIUnitTestCase
{
    use DatabaseTestTrait;
    use FeatureTestTrait;

    protected $migrate = true;
    protected $refresh = true;
    protected $seed = 'App\Database\Seeds\DatabaseSeeder';
    protected $namespace = 'App';

    protected function setUp(): void
    {
        parent::setUp();
        cache()->clean(); // hindari kebocoran blacklist token antar-test
    }

    public function testTanpaTokenDitolak401(): void
    {
        $this->call('get', '/api/admin/anomali?start=2026-06-01&end=2026-06-05')
            ->assertStatus(401);
    }

    public function testTanggalTidakValidMengembalikan400(): void
    {
        $token = (new JwtLibrary())->encode(['admin_id' => 1, 'username' => 'admin']);
        $this->withHeaders(['Authorization' => 'Bearer ' . $token])
            ->call('get', '/api/admin/anomali?start=bukan-tanggal&end=2026-06-05')
            ->assertStatus(400);
    }

    public function testRentangTerbalikMengembalikan400(): void
    {
        $token = (new JwtLibrary())->encode(['admin_id' => 1, 'username' => 'admin']);
        $this->withHeaders(['Authorization' => 'Bearer ' . $token])
            ->call('get', '/api/admin/anomali?start=2026-06-10&end=2026-06-01')
            ->assertStatus(400);
    }

    public function testTokenValidMengembalikanStrukturLaporan(): void
    {
        // ANTRIAN_PTSP_URL tidak dikonfigurasi di test -> antrean_tersedia=false.
        $token = (new JwtLibrary())->encode(['admin_id' => 1, 'username' => 'admin']);

        $result = $this->withHeaders(['Authorization' => 'Bearer ' . $token])
            ->call('get', '/api/admin/anomali?start=2026-06-01&end=2026-06-05');

        $result->assertStatus(200);
        $body = json_decode($result->getJSON(), true);

        $this->assertArrayHasKey('range', $body);
        $this->assertArrayHasKey('luar_jam', $body);
        $this->assertArrayHasKey('harian', $body);
        $this->assertArrayHasKey('petugas_outlier', $body);
        $this->assertFalse($body['harian']['antrean_tersedia']);
    }
}
```

- [ ] **Step 2: Jalankan test, pastikan GAGAL**

Run: `php vendor/bin/phpunit --filter=AnomaliControllerTest`
Expected: FAIL — route `/api/admin/anomali` belum ada (401/404 tidak konsisten; minimal test struktur 200 gagal).

- [ ] **Step 3: Implementasi controller**

Buat `app/Controllers/Api/AnomaliController.php`:

```php
<?php

namespace App\Controllers\Api;

use App\Services\AnomalyService;
use CodeIgniter\HTTP\ResponseInterface;
use CodeIgniter\RESTful\ResourceController;
use DateTime;

class AnomaliController extends ResourceController
{
    public function index(): ResponseInterface
    {
        $start = (string) ($this->request->getGet('start') ?? date('Y-m-d'));
        $end = (string) ($this->request->getGet('end') ?? date('Y-m-d'));

        if (! $this->isValidDate($start) || ! $this->isValidDate($end)) {
            return $this->response->setStatusCode(400)->setJSON([
                'status' => 400,
                'error' => 'Format tanggal tidak valid (gunakan YYYY-MM-DD)',
            ]);
        }

        if ($start > $end) {
            return $this->response->setStatusCode(400)->setJSON([
                'status' => 400,
                'error' => 'Tanggal mulai tidak boleh melebihi tanggal akhir',
            ]);
        }

        return $this->response->setJSON((new AnomalyService())->analyze($start, $end));
    }

    private function isValidDate(string $date): bool
    {
        $d = DateTime::createFromFormat('Y-m-d', $date);

        return $d !== false && $d->format('Y-m-d') === $date;
    }
}
```

- [ ] **Step 4: Daftarkan route**

Di `app/Config/Routes.php`, di dalam group `admin` (filter `jwt`), tambahkan setelah baris `$routes->get('survei/export', ...)`:

```php
        $routes->get('anomali', 'AnomaliController::index');
```

- [ ] **Step 5: Jalankan test, pastikan LULUS**

Run: `php vendor/bin/phpunit --filter=AnomaliControllerTest`
Expected: PASS (4 test hijau).

- [ ] **Step 6: Jalankan SELURUH suite backend (cegah regresi)**

Run: `php vendor/bin/phpunit`
Expected: Semua test hijau (≥ 71 test sebelumnya + test baru). Bila ada yang merah, perbaiki akar masalah sebelum lanjut (verification-before-completion).

- [ ] **Step 7: Commit**

```bash
git add app/Controllers/Api/AnomaliController.php app/Config/Routes.php tests/controllers/api/AnomaliControllerTest.php
git commit -m "feat(anomali): add admin anomali endpoint behind JWT"
```

---

### Task B5: Dokumentasi konfigurasi `.env`

**Files:**
- Modify: `.env.production.example`

- [ ] **Step 1: Tambahkan blok konfigurasi**

Di `.env.production.example`, setelah blok RATE LIMIT (setelah baris `RATELIMIT_SURVEY = 30`), tambahkan:

```
#--------------------------------------------------------------------
# MONITORING ANOMALI (dashboard) + INTEGRASI ANTREAN PTSP
#--------------------------------------------------------------------
# Jam layanan untuk deteksi submit di luar jam (Senin-Jumat).
SERVICE_HOUR_START = 8
SERVICE_HOUR_END   = 16
# Ambang deteksi petugas outlier: tandai bila jumlah survei >= OUTLIER_MIN
# DAN jumlah > median * OUTLIER_FACTOR. OUTLIER_MIN mencegah false-positive
# saat volume kecil.
OUTLIER_MIN    = 10
OUTLIER_FACTOR = 3
# Integrasi ke sistem antrean PTSP (kosongkan untuk menonaktifkan —
# dashboard tetap jalan, sinyal "survei>dilayani" otomatis dinonaktifkan).
ANTRIAN_PTSP_URL     = https://antrian.example.com
ANTRIAN_PTSP_API_KEY = <shared-secret-sama-dengan-SURVEY_DASHBOARD_API_KEY-di-antrian-ptsp>
ANTRIAN_PTSP_TIMEOUT = 5
```

- [ ] **Step 2: Commit**

```bash
git add .env.production.example
git commit -m "docs(env): document anomaly monitoring & antrean integration config"
```

---

## FASE C — Frontend (React + Vitest)

> Jalankan perintah di direktori `E:\project\survey-petugas\frontend`.

### Task C1: Tipe + fungsi API `getAnomali`

**Files:**
- Modify: `frontend/src/types/index.ts`
- Modify: `frontend/src/lib/api.ts`

- [ ] **Step 1: Tambahkan tipe**

Di akhir `frontend/src/types/index.ts`, tambahkan:

```ts
export interface AnomaliLuarJamItem {
  petugas_id: number
  nama: string
  created_at: string
}

export interface AnomaliHarianItem {
  date: string
  survei: number
  dilayani: number
  anomali: boolean
}

export interface AnomaliOutlierItem {
  petugas_id: number
  nama: string
  jumlah: number
  rasio: number
}

export interface AnomaliResponse {
  range: { start: string; end: string }
  luar_jam: { total: number; items: AnomaliLuarJamItem[] }
  harian: { antrean_tersedia: boolean; items: AnomaliHarianItem[] }
  petugas_outlier: { median: number; items: AnomaliOutlierItem[] }
}
```

- [ ] **Step 2: Tambahkan fungsi API**

Di `frontend/src/lib/api.ts`, tambahkan import `AnomaliResponse` ke daftar import dari `@/types` (baris 2-9), lalu tambahkan fungsi setelah `getRekap` (sekitar baris 83):

```ts
export async function getAnomali(start: string, end: string): Promise<AnomaliResponse> {
  return (await api.get<AnomaliResponse>(`/admin/anomali?start=${start}&end=${end}`)).data
}
```

Pastikan baris import menjadi (tambah `AnomaliResponse`):

```ts
import type {
  LoginPayload,
  LoginResponse,
  Petugas,
  SurveiPayload,
  RekapResponse,
  ApiError,
  AnomaliResponse,
} from '@/types'
```

- [ ] **Step 3: Verifikasi typecheck**

Run: `npm run build` (atau `npx tsc -b --noEmit`)
Expected: Tidak ada error TypeScript.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/types/index.ts frontend/src/lib/api.ts
git commit -m "feat(anomali): add AnomaliResponse types and getAnomali API client"
```

---

### Task C2: Komponen `AnomaliPanel`

**Files:**
- Create: `frontend/src/components/dashboard/AnomaliPanel.tsx`
- Test: `frontend/src/components/dashboard/AnomaliPanel.test.tsx`

- [ ] **Step 1: Tulis failing test**

Buat `frontend/src/components/dashboard/AnomaliPanel.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AnomaliPanel } from './AnomaliPanel'
import type { AnomaliResponse } from '@/types'

const sample: AnomaliResponse = {
  range: { start: '2026-06-01', end: '2026-06-07' },
  luar_jam: {
    total: 2,
    items: [
      { petugas_id: 1, nama: 'Budi', created_at: '2026-06-06 11:00:00' },
      { petugas_id: 1, nama: 'Budi', created_at: '2026-06-02 07:00:00' },
    ],
  },
  harian: {
    antrean_tersedia: true,
    items: [
      { date: '2026-06-02', survei: 3, dilayani: 1, anomali: true },
      { date: '2026-06-03', survei: 2, dilayani: 5, anomali: false },
    ],
  },
  petugas_outlier: {
    median: 2,
    items: [{ petugas_id: 1, nama: 'Budi', jumlah: 10, rasio: 5 }],
  },
}

describe('AnomaliPanel', () => {
  it('menampilkan ringkasan jumlah ketiga sinyal', () => {
    render(<AnomaliPanel data={sample} loading={false} error={null} />)
    expect(screen.getByTestId('anomali-luar-jam-total')).toHaveTextContent('2')
    expect(screen.getByTestId('anomali-harian-total')).toHaveTextContent('1')
    expect(screen.getByTestId('anomali-outlier-total')).toHaveTextContent('1')
  })

  it('menyorot tanggal anomali dan menampilkan nama outlier', () => {
    render(<AnomaliPanel data={sample} loading={false} error={null} />)
    expect(screen.getByText('2026-06-02')).toBeInTheDocument()
    expect(screen.getAllByText('Budi').length).toBeGreaterThan(0)
  })

  it('menampilkan status antrean tidak tersedia', () => {
    const tanpaAntrean: AnomaliResponse = {
      ...sample,
      harian: {
        antrean_tersedia: false,
        items: [{ date: '2026-06-02', survei: 3, dilayani: 0, anomali: false }],
      },
    }
    render(<AnomaliPanel data={tanpaAntrean} loading={false} error={null} />)
    expect(screen.getByText(/data antrean tidak tersedia/i)).toBeInTheDocument()
  })

  it('menampilkan skeleton saat loading', () => {
    render(<AnomaliPanel data={null} loading={true} error={null} />)
    expect(screen.getByTestId('anomali-loading')).toBeInTheDocument()
  })

  it('menampilkan pesan error', () => {
    render(<AnomaliPanel data={null} loading={false} error="Gagal memuat" />)
    expect(screen.getByRole('alert')).toHaveTextContent('Gagal memuat')
  })
}) 
```

- [ ] **Step 2: Jalankan test, pastikan GAGAL**

Run: `npx vitest run src/components/dashboard/AnomaliPanel.test.tsx`
Expected: FAIL — modul `./AnomaliPanel` tidak ada.

- [ ] **Step 3: Implementasi komponen**

Buat `frontend/src/components/dashboard/AnomaliPanel.tsx`:

```tsx
import { AlertTriangle, Clock, TrendingUp, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { AnomaliResponse } from '@/types'

interface AnomaliPanelProps {
  data: AnomaliResponse | null
  loading: boolean
  error: string | null
}

/** Kartu ringkasan satu sinyal anomali. */
function SummaryChip({
  icon,
  label,
  value,
  testId,
  tone,
}: {
  icon: React.ReactNode
  label: string
  value: number
  testId: string
  tone: 'rose' | 'amber' | 'sky'
}) {
  const toneClass =
    tone === 'rose'
      ? 'border-rose-200 bg-rose-50/80 text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300'
      : tone === 'amber'
        ? 'border-amber-200 bg-amber-50/80 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300'
        : 'border-sky-200 bg-sky-50/80 text-sky-700 dark:border-sky-900/40 dark:bg-sky-950/20 dark:text-sky-300'

  return (
    <div className={`flex items-center gap-3 rounded-2xl border p-4 ${toneClass}`}>
      <div className="shrink-0">{icon}</div>
      <div>
        <p className="text-2xl font-bold leading-none" data-testid={testId}>
          {value}
        </p>
        <p className="text-xs">{label}</p>
      </div>
    </div>
  )
}

export function AnomaliPanel({ data, loading, error }: AnomaliPanelProps) {
  if (loading) {
    return (
      <div className="space-y-4" data-testid="anomali-loading">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div
        role="alert"
        className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300"
      >
        <AlertTriangle className="mt-0.5 size-4" aria-hidden />
        <span>{error}</span>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
        Belum ada data anomali untuk periode ini.
      </div>
    )
  }

  const jumlahAnomaliHarian = data.harian.items.filter((d) => d.anomali).length

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryChip
          icon={<Clock className="size-6" aria-hidden />}
          label="Submit di luar jam layanan"
          value={data.luar_jam.total}
          testId="anomali-luar-jam-total"
          tone="amber"
        />
        <SummaryChip
          icon={<AlertTriangle className="size-6" aria-hidden />}
          label="Tanggal survei > tamu dilayani"
          value={jumlahAnomaliHarian}
          testId="anomali-harian-total"
          tone="rose"
        />
        <SummaryChip
          icon={<TrendingUp className="size-6" aria-hidden />}
          label="Petugas outlier"
          value={data.petugas_outlier.items.length}
          testId="anomali-outlier-total"
          tone="sky"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="size-4" aria-hidden />
            Survei vs Tamu Dilayani (harian)
          </CardTitle>
          {!data.harian.antrean_tersedia && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Data antrean tidak tersedia — sinyal ini dinonaktifkan. Menampilkan
              jumlah survei harian saja.
            </p>
          )}
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="p-2">Tanggal</th>
                  <th className="p-2 text-right">Survei</th>
                  <th className="p-2 text-right">Dilayani</th>
                  <th className="p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.harian.items.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-muted-foreground">
                      Tidak ada data pada periode ini.
                    </td>
                  </tr>
                ) : (
                  data.harian.items.map((row) => (
                    <tr
                      key={row.date}
                      className={
                        row.anomali
                          ? 'border-b bg-rose-50/60 dark:bg-rose-950/20'
                          : 'border-b'
                      }
                    >
                      <td className="p-2 font-medium">{row.date}</td>
                      <td className="p-2 text-right">{row.survei}</td>
                      <td className="p-2 text-right">
                        {data.harian.antrean_tersedia ? row.dilayani : '—'}
                      </td>
                      <td className="p-2">
                        {row.anomali ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">
                            <AlertTriangle className="size-3" aria-hidden />
                            Anomali
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">Normal</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Petugas Outlier (median {data.petugas_outlier.median})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.petugas_outlier.items.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Tidak ada petugas dengan jumlah survei yang mencurigakan.
              </p>
            ) : (
              <ul className="space-y-2">
                {data.petugas_outlier.items.map((p) => (
                  <li
                    key={p.petugas_id}
                    className="flex items-center justify-between rounded-lg border p-2 text-sm"
                  >
                    <span className="font-medium">{p.nama}</span>
                    <span className="text-muted-foreground">
                      {p.jumlah} survei · {p.rasio}× median
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Submit di Luar Jam ({data.luar_jam.total})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.luar_jam.items.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Semua submit berada dalam jam layanan.
              </p>
            ) : (
              <ul className="max-h-64 space-y-2 overflow-y-auto">
                {data.luar_jam.items.map((item, idx) => (
                  <li
                    key={`${item.petugas_id}-${item.created_at}-${idx}`}
                    className="flex items-center justify-between rounded-lg border p-2 text-sm"
                  >
                    <span className="font-medium">{item.nama}</span>
                    <span className="text-muted-foreground">{item.created_at}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Jalankan test, pastikan LULUS**

Run: `npx vitest run src/components/dashboard/AnomaliPanel.test.tsx`
Expected: PASS (5 test hijau).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/dashboard/AnomaliPanel.tsx frontend/src/components/dashboard/AnomaliPanel.test.tsx
git commit -m "feat(anomali): add AnomaliPanel component with graceful states"
```

---

### Task C3: Integrasi tab "Anomali" ke `DashboardPage`

**Files:**
- Modify: `frontend/src/pages/DashboardPage.tsx`
- Test: `frontend/src/pages/DashboardPage.test.tsx`

- [ ] **Step 1: Tulis failing test**

Di `frontend/src/pages/DashboardPage.test.tsx`, (a) tambahkan konstanta `fakeAnomali` setelah `fakePetugas` (sekitar baris 71):

```tsx
const fakeAnomali = {
  range: { start: '2026-04-01', end: '2026-04-29' },
  luar_jam: {
    total: 1,
    items: [{ petugas_id: 1, nama: 'Budi', created_at: '2026-04-29 07:00:00' }],
  },
  harian: {
    antrean_tersedia: true,
    items: [{ date: '2026-04-29', survei: 5, dilayani: 2, anomali: true }],
  },
  petugas_outlier: {
    median: 2,
    items: [{ petugas_id: 1, nama: 'Budi', jumlah: 8, rasio: 4 }],
  },
}
```

(b) tambahkan mock di `setupMocks` (sekitar baris 130):

```tsx
const setupMocks = () => {
  vi.spyOn(apiModule, 'getRekap').mockResolvedValue(fakeRekap)
  vi.spyOn(apiModule, 'getAdminPetugas').mockResolvedValue(fakePetugas)
  vi.spyOn(apiModule, 'getAnomali').mockResolvedValue(fakeAnomali)
}
```

(c) tambahkan test baru di dalam `describe('DashboardPage', ...)`:

```tsx
  it('menampilkan tab Anomali dengan ringkasan sinyal', async () => {
    const user = (await import('@testing-library/user-event')).default.setup()
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    )

    await waitFor(() => screen.getByRole('tab', { name: /anomali/i }))
    await user.click(screen.getByRole('tab', { name: /anomali/i }))

    await waitFor(() => {
      expect(screen.getByTestId('anomali-luar-jam-total')).toHaveTextContent('1')
    })
    expect(screen.getByTestId('anomali-outlier-total')).toHaveTextContent('1')
  })
```

- [ ] **Step 2: Jalankan test, pastikan GAGAL**

Run: `npx vitest run src/pages/DashboardPage.test.tsx`
Expected: FAIL — `getAnomali` belum di-spy (TypeError) / tab "Anomali" tidak ada.

- [ ] **Step 3: Implementasi integrasi**

Di `frontend/src/pages/DashboardPage.tsx`:

(a) Tambahkan import komponen & API (di blok import atas):

```tsx
import { AnomaliPanel } from '@/components/dashboard/AnomaliPanel'
```

Ubah baris import API menjadi menambahkan `getAnomali`:

```tsx
import { getAdminPetugas, getAnomali, getExportUrl, getRekap } from '@/lib/api'
```

Ubah baris import type menjadi menambahkan `AnomaliResponse`:

```tsx
import type { AnomaliResponse, Petugas, RekapResponse, SurveiRecord } from '@/types'
```

(b) Tambahkan state untuk anomali (setelah deklarasi state `loadedRangeKey`, sekitar baris 50):

```tsx
  const [anomali, setAnomali] = useState<AnomaliResponse | null>(null)
  const [anomaliLoading, setAnomaliLoading] = useState<boolean>(false)
  const [anomaliError, setAnomaliError] = useState<string | null>(null)
  const anomaliRequestRef = useRef(0)
```

(c) Tambahkan effect fetch anomali (setelah effect polling, sekitar baris 103) — terpisah dari `fetchData` agar antrean lambat tidak memblokir dashboard IKM:

```tsx
  // Ambil data anomali terpisah (non-blocking) agar timeout antrean tidak
  // menahan render dashboard utama. Race terbaru dimenangkan via requestRef.
  useEffect(() => {
    if (!hasValidDateRange) return
    const reqId = ++anomaliRequestRef.current
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAnomaliLoading(true)
    setAnomaliError(null)
    getAnomali(start, end)
      .then((res) => {
        if (reqId === anomaliRequestRef.current) setAnomali(res)
      })
      .catch(() => {
        if (reqId === anomaliRequestRef.current) {
          setAnomaliError('Gagal memuat data anomali.')
        }
      })
      .finally(() => {
        if (reqId === anomaliRequestRef.current) setAnomaliLoading(false)
      })
  }, [start, end, hasValidDateRange])
```

(d) Tambahkan trigger tab di `<TabsList>` (setelah `<TabsTrigger value="detail">...`):

```tsx
              <TabsTrigger value="anomali">Anomali</TabsTrigger>
```

(e) Tambahkan konten tab (setelah `<TabsContent value="detail">...</TabsContent>`, sebelum penutup `</Tabs>`):

```tsx
            <TabsContent value="anomali">
              <motion.div
                data-testid="dashboard-tab-panel-anomali"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, ease: 'easeOut' }}
              >
                <AnomaliPanel data={anomali} loading={anomaliLoading} error={anomaliError} />
              </motion.div>
            </TabsContent>
```

- [ ] **Step 4: Jalankan test DashboardPage, pastikan LULUS**

Run: `npx vitest run src/pages/DashboardPage.test.tsx`
Expected: PASS (semua test lama + test tab Anomali baru hijau).

- [ ] **Step 5: Jalankan SELURUH suite frontend + typecheck (cegah regresi)**

Run: `npx vitest run` lalu `npm run build`
Expected: Semua test frontend hijau (≥ 47 + test baru) dan build TypeScript sukses tanpa error.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/pages/DashboardPage.tsx frontend/src/pages/DashboardPage.test.tsx
git commit -m "feat(anomali): integrate Anomali tab into DashboardPage"
```

---

## Verifikasi Akhir (sebelum dianggap selesai)

- [ ] Backend survey-petugas: `php vendor/bin/phpunit` → semua hijau.
- [ ] antrian-ptsp: `php artisan test --filter=ServedCountTest` → hijau; `php artisan test` (atau minimal grup terdampak) → tidak ada regresi.
- [ ] Frontend: `npx vitest run` → semua hijau; `npm run build` → sukses.
- [ ] Manual smoke (opsional, dev server): set `ANTRIAN_PTSP_URL`/`ANTRIAN_PTSP_API_KEY` + `SURVEY_DASHBOARD_API_KEY` (nilai sama) di kedua `.env`, buka dashboard → tab "Anomali" tampil; matikan antrean → panel menampilkan "Data antrean tidak tersedia" tanpa error.
- [ ] Konfirmasi jejak antrian-ptsp persis: `git -C E:\project\antrian-ptsp status` hanya menampilkan 1 controller baru, perubahan `routes/api.php`, dan 1 test baru.

---

## Catatan Keamanan & Degradasi (ringkas)

- Endpoint antrean read-only, terlindung `X-Api-Key` (`hash_equals`, konstan-waktu), hanya agregat (tanpa nama/identitas pengunjung), throttled `60/menit`, rentang dibatasi 92 hari.
- `AnomaliController` di balik filter `jwt` (admin) + validasi tanggal ketat.
- Kegagalan antrean (timeout/non-200/body rusak/belum dikonfigurasi) → `QueueClient` mengembalikan `null` → sinyal #1 (luar jam) & #3 (outlier) tetap jalan; #2 ditandai `antrean_tersedia: false`. Timeout default 5 detik agar dashboard tidak menggantung.

---

## Self-Review (cek terhadap spec)

**Cakupan spec:**
- Sinyal #1 luar jam → Task B3 (`isOffHours`) + tampil C2. ✅
- Sinyal #2 survei>dilayani via API → Task A1 (endpoint) + B2 (`QueueClient`) + B3 (`buildHarian`) + C2 tabel. ✅
- Sinyal #3 outlier → Task B3 (`buildOutlier`/`computeMedian`). ✅
- Endpoint antrean (route+controller, X-Api-Key, validasi, query completed group by service_date, bentuk JSON) → Task A1. ✅
- `QueueClient` graceful + config env → Task B2. ✅
- `AnomaliController` JWT + validasi → Task B4. ✅
- `SurveiModel` query bantu sargable → Task B1 (disederhanakan jadi satu query lean; dihitung di service — lebih DRY/testable, hasil setara). ✅
- Frontend perluas DashboardPage + state "antrean tidak tersedia" → Task C2/C3. ✅
- Bentuk respons `/api/admin/anomali` (range, luar_jam, harian, petugas_outlier) → cocok persis dengan kontrak spec. ✅
- Konfigurasi `.env` → Task B5. ✅
- Pengujian (antrean feature test; service/model unit; controller feature; frontend panel) → tercakup. ✅

**Konsistensi tipe/nama:** `getSubmissionsInRange`, `getServedCounts`/`parseResponse`, `analyze`/`isOffHours`/`computeMedian`, `AnomaliController::index`, `getAnomali`, `AnomaliResponse` — dipakai konsisten lintas task. ✅

**Batasan antrian-ptsp:** jejak = 1 controller baru + 2 baris route + 1 test. Tanpa migrasi/ubah model/config. ✅ (dengan catatan `config:cache` ditandai eksplisit).
