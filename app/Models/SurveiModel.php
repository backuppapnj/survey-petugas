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

    protected $beforeInsert = ['setCreatedAt'];

    /**
     * Hitung rekap survei dalam rentang tanggal.
     * Mengembalikan ringkasan, agregat per petugas, dan data mentah.
     */
    public function getRekapByDateRange(string $start, string $end): array
    {
        $semua = $this->where('DATE(created_at) >=', $start)
            ->where('DATE(created_at) <=', $end)
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

        $rataRataTotal = array_sum($rataRata) / 4;
        $ikm           = round(($rataRataTotal / 5) * 100, 2);

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
}
