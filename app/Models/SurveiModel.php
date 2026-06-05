<?php

namespace App\Models;

use CodeIgniter\Model;

class SurveiModel extends Model
{
    protected $table         = 'survei';
    protected $primaryKey    = 'id';
    protected $allowedFields = ['petugas_id', 'kecepatan', 'keramahan', 'informasi', 'kenyamanan', 'saran'];
    protected $returnType    = 'array';
    protected $useTimestamps = false; // hanya created_at, di-set manual saat insert

    /**
     * Override insert untuk set created_at otomatis.
     */
    protected function setCreatedAt(array $data): array
    {
        if (! isset($data['data']['created_at'])) {
            $data['data']['created_at'] = date('Y-m-d H:i:s');
        }
        return $data;
    }

    protected $beforeInsert = ['setCreatedAt', 'sanitizeSaran'];
    protected $beforeUpdate = ['sanitizeSaran'];

    /**
     * Sanitize saran field to prevent XSS attacks.
     * Strips HTML tags and encodes special characters.
     */
    protected function sanitizeSaran(array $data): array
    {
        if (isset($data['data']['saran']) && $data['data']['saran'] !== null) {
            $saran = $data['data']['saran'];

            // Strip all HTML tags
            $saran = strip_tags($saran);

            // Trim whitespace
            $saran = trim($saran);

            // Encode special characters for safe display
            $saran = htmlspecialchars($saran, ENT_QUOTES | ENT_HTML5, 'UTF-8');

            $data['data']['saran'] = $saran;
        }

        return $data;
    }

    /**
     * Hitung rekap survei dalam rentang tanggal.
     * Mengembalikan ringkasan, agregat per petugas, dan data mentah.
     */
    public function getRekapByDateRange(string $start, string $end): array
    {
        // PERFORMA: gunakan rentang DATETIME mentah, bukan DATE(created_at).
        // Membungkus kolom dengan fungsi DATE() membuat query non-sargable
        // sehingga index pada created_at tidak terpakai (full table scan).
        // Rentang [start 00:00:00 .. end 23:59:59] memberi hasil sama namun
        // tetap memanfaatkan index created_at yang sudah ada.
        $semua = $this->where('created_at >=', $start . ' 00:00:00')
            ->where('created_at <=', $end . ' 23:59:59')
            ->orderBy('created_at', 'DESC')
            ->findAll();

        $totalResponden = count($semua);
        $rataRata       = ['kecepatan' => 0.0, 'keramahan' => 0.0, 'informasi' => 0.0, 'kenyamanan' => 0.0];
        $perPetugas     = [];

        if ($totalResponden === 0) {
            return [
                'summary'     => ['total_responden' => 0, 'rata_rata' => $rataRata, 'ikm' => 0.0],
                'per_petugas' => [],
                'semua'       => [],
            ];
        }

        // Hitung rata-rata global
        foreach ($semua as $s) {
            $rataRata['kecepatan']  += (int) $s['kecepatan'];
            $rataRata['keramahan']  += (int) $s['keramahan'];
            $rataRata['informasi']  += (int) $s['informasi'];
            $rataRata['kenyamanan'] += (int) $s['kenyamanan'];
        }
        foreach ($rataRata as $key => $val) {
            $rataRata[$key] = round($val / $totalResponden, 2);
        }

        // IKM dihitung sesuai PermenPAN-RB 14/2017 (skala 25..100) lewat helper
        // (di-autoload via Config\Autoload::$helpers), bukan konversi linier
        // rata/5*100 (skala 20..100) yang keliru.
        $ikm = hitung_ikm(
            $rataRata['kecepatan'],
            $rataRata['keramahan'],
            $rataRata['informasi'],
            $rataRata['kenyamanan'],
        );

        // Group survei per petugas
        $grouped = [];
        foreach ($semua as $s) {
            $grouped[(int) $s['petugas_id']][] = $s;
        }

        // Single query untuk semua petugas (hindari N+1)
        $petugasIds = array_keys($grouped);
        $petugasMap = [];
        if ($petugasIds !== []) {
            $petugasRows = (new PetugasModel())->whereIn('id', $petugasIds)->findAll();
            foreach ($petugasRows as $p) {
                $petugasMap[(int) $p['id']] = $p;
            }
        }

        foreach ($grouped as $pid => $items) {
            $count = count($items);
            $avg   = ['kecepatan' => 0.0, 'keramahan' => 0.0, 'informasi' => 0.0, 'kenyamanan' => 0.0];
            foreach ($items as $item) {
                $avg['kecepatan']  += (int) $item['kecepatan'];
                $avg['keramahan']  += (int) $item['keramahan'];
                $avg['informasi']  += (int) $item['informasi'];
                $avg['kenyamanan'] += (int) $item['kenyamanan'];
            }
            foreach ($avg as $key => $val) {
                $avg[$key] = round($val / $count, 2);
            }

            $petugas      = $petugasMap[$pid] ?? null;
            $perPetugas[] = [
                'petugas_id'      => $pid,
                'nama'            => $petugas['nama'] ?? 'Unknown',
                'foto_url'        => $petugas ? '/api/uploads/' . $petugas['foto'] : '',
                'total_responden' => $count,
                'rata_rata'       => $avg,
            ];
        }

        return [
            'summary'     => ['total_responden' => $totalResponden, 'rata_rata' => $rataRata, 'ikm' => $ikm],
            'per_petugas' => $perPetugas,
            'semua'       => $semua,
        ];
    }

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
        $rows = $this->select('id, petugas_id, created_at')
            ->where('created_at >=', $start . ' 00:00:00')
            ->where('created_at <=', $end . ' 23:59:59')
            ->orderBy('created_at', 'ASC')
            ->findAll();

        // Normalisasi tipe: Query Builder dapat mengembalikan kolom numerik
        // sebagai string (tergantung driver), pastikan int agar kontrak akurat.
        return array_map(static fn (array $row): array => [
            'id'         => (int) $row['id'],
            'petugas_id' => (int) $row['petugas_id'],
            'created_at' => (string) $row['created_at'],
        ], $rows);
    }
}
