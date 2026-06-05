# Dashboard Monitoring Anomali Survei — Design Spec

**Tanggal:** 2026-06-05
**Status:** Disetujui (desain), menunggu review spec sebelum plan.

## Tujuan

Menambahkan pemantauan anomali pada dashboard admin survei untuk mendeteksi
indikasi manipulasi nilai IKM (mis. petugas mengatrol nilai sendiri / flooding),
dengan memanfaatkan data sistem antrean PTSP sebagai pembanding kebenaran.

## Konteks & Batasan

- **survey-petugas** (CodeIgniter 4 + React) — aplikasi utama, DB `survey_petugas`.
- **antrian-ptsp** (Laravel + Livewire) — aplikasi terpisah, DB `antrian_ptsp_db`.
- **Loket FLEKSIBEL (PTSL):** petugas berpindah tempat & melayani semua layanan.
  Maka `petugas.loket` **bukan** kunci andal untuk dipetakan ke `counters` antrean.
  Cross-check diarahkan ke **agregat harian se-kantor**, bukan per-loket.
- **BATASAN antrian-ptsp:** TIDAK boleh mengubah apa pun **kecuali menambah satu
  API endpoint** (1 route + 1 controller baru, read-only). Tanpa migrasi, tanpa
  ubah model/controller/logika lain. `git pull` sudah dilakukan (HEAD e40dd56).

## Sinyal Anomali (final)

### 1. Submit di luar jam layanan (sisi survei — paling andal)
- `survei.created_at` di luar **Senin–Jumat 08:00–16:00**.
- Sabtu/Minggu dan jam <08:00 atau ≥16:00 = di luar jam.
- Configurable via `.env`: `SERVICE_HOUR_START` (default 8), `SERVICE_HOUR_END`
  (default 16). Hari kerja Sen–Jum (tetap; akhir pekan = luar jam).
- Output: jumlah + daftar submit luar jam (petugas, waktu).

### 2. Total survei > total dilayani (agregat harian, via API antrean)
- API antrean mengembalikan **total tiket `completed` per tanggal** (tanpa
  pemetaan loket, tanpa data pribadi).
- Per tanggal pada rentang: bandingkan `surveys_total[date]` vs `served_total[date]`.
- Anomali bila `surveys_total > served_total` (mustahil secara sah → flooding).
- Output: tabel/grafik harian survei-vs-dilayani + penanda tanggal anomali.

### 3. Petugas outlier (heuristik sisi survei — pengganti per-loket)
- Dari survei pada rentang, hitung jumlah per petugas.
- `median` = median jumlah survei antar-petugas.
- Tandai petugas bila: `count >= OUTLIER_MIN` **DAN** `count > median * OUTLIER_FACTOR`.
- Default: `OUTLIER_MIN = 10`, `OUTLIER_FACTOR = 3` (configurable via `.env`).
  Syarat `OUTLIER_MIN` mencegah flag saat volume kecil.
- Output: daftar petugas outlier (nama, jumlah, median, rasio).

## Arsitektur

```
survey-petugas (CI4)                          antrian-ptsp (Laravel)
  DashboardPage (React)
     │ GET /api/admin/anomali?start&end (JWT)
     ▼
  AnomaliController ─► AnomalyService
                          ├─ SurveiModel (luar-jam, per-petugas, harian)
                          └─ QueueClient ──GET /api/served-counts──► ServedCountController
                             (CURLRequest, X-Api-Key, graceful)        (queue_tickets completed,
                                                                         group by service_date)
```

## Komponen

### A. antrian-ptsp (HANYA tambahan endpoint)
- **Route** (di `routes/api.php`): `GET served-counts` → `ServedCountController@index`,
  dalam group `throttle`.
- **Controller baru** `app/Http/Controllers/Api/ServedCountController.php`:
  - Cek header `X-Api-Key` == `config('services.survey_dashboard.key')`
    (dibaca dari env `SURVEY_DASHBOARD_API_KEY`); jika kosong/salah → 401.
  - Validasi `start`,`end` (format date; default hari ini; batas rentang wajar mis. ≤ 92 hari).
  - Query read-only:
    `QueueTicket::where('status','completed')->whereBetween('service_date',[start,end])
     ->selectRaw('service_date, COUNT(*) as served')->groupBy('service_date')`.
  - Response JSON: `{ "data": [ { "date":"YYYY-MM-DD", "served": <int> } ], "start":..,"end":.. }`.
- Catatan: membaca `config('services...')` memakai key dari env tidak mengubah
  file lain; entri `.env`/`config/services.php` adalah bagian aktivasi endpoint.
  Jika menambah ke `config/services.php` dianggap "mengubah", gunakan
  `env('SURVEY_DASHBOARD_API_KEY')` langsung di controller (self-contained).

### B. survey-petugas (CI4)
- **`app/Libraries/QueueClient.php`**: panggil API antrean via `CURLRequest`.
  - Config `.env`: `ANTRIAN_PTSP_URL`, `ANTRIAN_PTSP_API_KEY`.
  - `getServedCounts(string $start, string $end): ?array` — kembalikan map
    `['YYYY-MM-DD' => served]` atau **null** bila gagal/tak dikonfigurasi (graceful;
    log warning, tidak melempar).
- **`app/Services/AnomalyService.php`** (atau library): hitung 3 sinyal, gabung jadi laporan.
- **`app/Controllers/Api/AnomaliController.php`**: `GET /api/admin/anomali?start&end`
  (di balik filter `jwt`). Validasi tanggal. Kembalikan laporan JSON.
- **`SurveiModel`**: tambah query bantu (jumlah harian, jumlah per-petugas, daftar luar-jam)
  — tetap sargable (rentang DATETIME), tidak mengubah perilaku `getRekapByDateRange`.

### C. Frontend (React) — perluas DashboardPage
- Panel "Anomali" baru di `DashboardPage` (lazy-loaded sudah ada).
- Tampilkan: ringkasan (jumlah luar-jam, jumlah tanggal survei>dilayani, jumlah
  petugas outlier), grafik/tabel harian survei-vs-dilayani, daftar petugas outlier,
  daftar submit luar-jam.
- State "data antrean tidak tersedia" bila API antrean null.

## Bentuk Respons `GET /api/admin/anomali`

```json
{
  "range": { "start": "2026-06-01", "end": "2026-06-05" },
  "luar_jam": { "total": 3, "items": [ { "petugas_id": 2, "nama": "...", "created_at": "..." } ] },
  "harian": {
    "antrean_tersedia": true,
    "items": [ { "date": "2026-06-02", "survei": 40, "dilayani": 12, "anomali": true } ]
  },
  "petugas_outlier": {
    "median": 8,
    "items": [ { "petugas_id": 2, "nama": "...", "jumlah": 80, "rasio": 10.0 } ]
  }
}
```

## Konfigurasi `.env` (survey-petugas)
```
SERVICE_HOUR_START = 8
SERVICE_HOUR_END   = 16
OUTLIER_MIN        = 10
OUTLIER_FACTOR     = 3
ANTRIAN_PTSP_URL       = https://antrian.example.com
ANTRIAN_PTSP_API_KEY   = <shared-secret>
```
(dan `SURVEY_DASHBOARD_API_KEY` di sisi antrian-ptsp = nilai sama dengan `ANTRIAN_PTSP_API_KEY`.)

## Keamanan & Degradasi
- Endpoint antrean: read-only, X-Api-Key, hanya agregat (tanpa nama/identitas pengunjung).
- `AnomaliController` di balik JWT (admin).
- Bila antrean tak terhubung/timeout → sinyal #1 & #3 tetap jalan; #2 → `antrean_tersedia: false`.
- QueueClient timeout pendek (mis. 5 dtk) agar dashboard tidak menggantung.

## Di Luar Cakupan (YAGNI)
- Pemetaan per-loket / per-petugas ke counter antrean (loket fleksibel).
- Token sekali-pakai per tamu (didiskusikan, ditunda).
- Refresh token JWT.
- Perubahan apa pun di antrian-ptsp selain 1 endpoint baru.

## Pendekatan Pengujian
- **antrian-ptsp**: feature test endpoint served-counts (auth key salah → 401;
  benar → agregat per tanggal benar). Memakai factory `QueueTicket` bila tersedia.
- **survey-petugas**:
  - `AnomalyService`/`SurveiModel`: unit/integration (luar-jam, outlier, harian)
    dengan data seed → SQLite test DB. QueueClient di-mock/stub untuk hasil deterministik.
  - `AnomaliController`: feature test (JWT wajib; struktur respons; degradasi saat antrean null).
- **Frontend**: test render panel anomali dengan data contoh + state "antrean tidak tersedia".
```
