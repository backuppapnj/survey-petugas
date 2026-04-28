<?php

namespace App\Controllers\Api;

use App\Models\SurveiModel;
use CodeIgniter\HTTP\ResponseInterface;
use CodeIgniter\RESTful\ResourceController;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class ExportController extends ResourceController
{
    public function excel(): ResponseInterface
    {
        $start = (string) ($this->request->getGet('start') ?? date('Y-m-d'));
        $end   = (string) ($this->request->getGet('end') ?? date('Y-m-d'));
        $rekap = (new SurveiModel())->getRekapByDateRange($start, $end);

        $spreadsheet = new Spreadsheet();

        $this->buildRingkasanSheet($spreadsheet->getActiveSheet(), $rekap['summary'], $start, $end);
        $this->buildPerPetugasSheet($spreadsheet->createSheet(), $rekap['per_petugas']);
        $this->buildDataMentahSheet($spreadsheet->createSheet(), $rekap['semua']);

        // Tulis ke memori, bukan filesystem
        ob_start();
        (new Xlsx($spreadsheet))->save('php://output');
        $body = ob_get_clean();

        $filename = "laporan-ikm-{$start}-{$end}.xlsx";

        return $this->response
            ->setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
            ->setHeader('Content-Disposition', "attachment; filename=\"{$filename}\"")
            ->setBody($body);
    }

    private function buildRingkasanSheet($sheet, array $summary, string $start, string $end): void
    {
        $sheet->setTitle('Ringkasan IKM');
        $sheet->setCellValue('A1', 'Laporan Indeks Kepuasan Masyarakat');
        $sheet->setCellValue('A2', "Periode: {$start} s/d {$end}");
        $sheet->setCellValue('A4', 'Total Responden');
        $sheet->setCellValue('B4', $summary['total_responden']);
        $sheet->setCellValue('A5', 'IKM');
        $sheet->setCellValue('B5', $summary['ikm']);
        $sheet->setCellValue('A7', 'Rata-rata per Aspek');
        $sheet->setCellValue('A8', 'Kecepatan');
        $sheet->setCellValue('B8', $summary['rata_rata']['kecepatan']);
        $sheet->setCellValue('A9', 'Keramahan');
        $sheet->setCellValue('B9', $summary['rata_rata']['keramahan']);
        $sheet->setCellValue('A10', 'Informasi');
        $sheet->setCellValue('B10', $summary['rata_rata']['informasi']);
        $sheet->setCellValue('A11', 'Kenyamanan');
        $sheet->setCellValue('B11', $summary['rata_rata']['kenyamanan']);
    }

    private function buildPerPetugasSheet($sheet, array $perPetugas): void
    {
        $sheet->setTitle('Per Petugas');
        $headers = ['A1' => 'Nama', 'B1' => 'Responden', 'C1' => 'Kecepatan', 'D1' => 'Keramahan', 'E1' => 'Informasi', 'F1' => 'Kenyamanan'];
        foreach ($headers as $cell => $val) {
            $sheet->setCellValue($cell, $val);
        }

        $row = 2;
        foreach ($perPetugas as $p) {
            $sheet->setCellValue("A{$row}", $p['nama']);
            $sheet->setCellValue("B{$row}", $p['total_responden']);
            $sheet->setCellValue("C{$row}", $p['rata_rata']['kecepatan']);
            $sheet->setCellValue("D{$row}", $p['rata_rata']['keramahan']);
            $sheet->setCellValue("E{$row}", $p['rata_rata']['informasi']);
            $sheet->setCellValue("F{$row}", $p['rata_rata']['kenyamanan']);
            $row++;
        }
    }

    private function buildDataMentahSheet($sheet, array $semua): void
    {
        $sheet->setTitle('Data Mentah');
        $headers = ['A1' => 'ID', 'B1' => 'Petugas ID', 'C1' => 'Kecepatan', 'D1' => 'Keramahan', 'E1' => 'Informasi', 'F1' => 'Kenyamanan', 'G1' => 'Saran', 'H1' => 'Tanggal'];
        foreach ($headers as $cell => $val) {
            $sheet->setCellValue($cell, $val);
        }

        $row = 2;
        foreach ($semua as $s) {
            $sheet->setCellValue("A{$row}", $s['id']);
            $sheet->setCellValue("B{$row}", $s['petugas_id']);
            $sheet->setCellValue("C{$row}", $s['kecepatan']);
            $sheet->setCellValue("D{$row}", $s['keramahan']);
            $sheet->setCellValue("E{$row}", $s['informasi']);
            $sheet->setCellValue("F{$row}", $s['kenyamanan']);
            $sheet->setCellValue("G{$row}", $s['saran'] ?? '');
            $sheet->setCellValue("H{$row}", $s['created_at']);
            $row++;
        }
    }
}
