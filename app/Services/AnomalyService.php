<?php

namespace App\Services;

use App\Libraries\QueueClient;
use App\Models\PetugasModel;
use App\Models\SurveiModel;

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
        $this->surveiModel   = $surveiModel ?? new SurveiModel();
        $this->petugasModel  = $petugasModel ?? new PetugasModel();
        $this->queueClient   = $queueClient ?? new QueueClient();
        $this->hourStart     = (int) env('SERVICE_HOUR_START', 8);
        $this->hourEnd       = (int) env('SERVICE_HOUR_END', 16);
        $this->outlierMin    = (int) env('OUTLIER_MIN', 10);
        $this->outlierFactor = (float) env('OUTLIER_FACTOR', 3);
    }

    /**
     * Analisis anomali dalam rentang tanggal yang diberikan.
     *
     * @return array<string,mixed> Laporan anomali sesuai kontrak spec.
     */
    public function analyze(string $start, string $end): array
    {
        $submissions = $this->surveiModel->getSubmissionsInRange($start, $end);

        $offHours        = [];  // item submit luar jam
        $perPetugasCount = [];  // petugas_id => jumlah
        $dailyCount      = [];  // 'YYYY-MM-DD' => jumlah survei

        foreach ($submissions as $row) {
            $pid       = (int) $row['petugas_id'];
            $createdAt = (string) $row['created_at'];
            $date      = substr($createdAt, 0, 10);

            $perPetugasCount[$pid] = ($perPetugasCount[$pid] ?? 0) + 1;
            $dailyCount[$date]     = ($dailyCount[$date] ?? 0) + 1;

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
            'range'            => ['start' => $start, 'end' => $end],
            'luar_jam'         => ['total' => count($offHours), 'items' => $offHours],
            'harian'           => $this->buildHarian($dailyCount, $start, $end),
            'petugas_outlier'  => $this->buildOutlier($perPetugasCount, $namaMap),
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

        $dow  = (int) $dt->format('N');  // 1=Senin .. 7=Minggu
        $hour = (int) $dt->format('G');  // 0..23

        if ($dow >= 6) {
            return true; // Sabtu/Minggu
        }

        return $hour < $this->hourStart || $hour >= $this->hourEnd;
    }

    /**
     * Bangun laporan harian dengan perbandingan survei vs tamu dilayani.
     *
     * @param  array<string,int> $dailyCount
     * @return array{antrean_tersedia:bool, items:list<array{date:string,survei:int,dilayani:int,anomali:bool}>}
     */
    private function buildHarian(array $dailyCount, string $start, string $end): array
    {
        $served   = $this->queueClient->getServedCounts($start, $end);
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
            $survei   = $dailyCount[$date] ?? 0;
            $dilayani = $tersedia ? ($served[$date] ?? 0) : 0;
            $items[]  = [
                'date'     => $date,
                'survei'   => $survei,
                'dilayani' => $dilayani,
                // Anomali hanya bermakna bila data antrean tersedia.
                'anomali'  => $tersedia && $survei > $dilayani,
            ];
        }

        return ['antrean_tersedia' => $tersedia, 'items' => $items];
    }

    /**
     * Bangun laporan petugas yang menjadi outlier berdasarkan median.
     *
     * @param  array<int,int>    $perPetugasCount
     * @param  array<int,string> $namaMap
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
                    'nama'       => $namaMap[$pid] ?? 'Unknown',
                    'jumlah'     => $jumlah,
                    'rasio'      => $median > 0 ? round($jumlah / $median, 2) : (float) $jumlah,
                ];
            }
        }

        // Urutkan dari jumlah terbesar.
        usort($items, static fn ($a, $b) => $b['jumlah'] <=> $a['jumlah']);

        return ['median' => $median, 'items' => $items];
    }

    /**
     * Hitung median dari array bilangan bulat.
     *
     * @param  list<int> $values
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
     * Ambil nama petugas berdasarkan daftar ID.
     *
     * @param  list<int>         $ids
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
