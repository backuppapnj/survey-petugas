<?php

namespace App\Database\Seeds;

use CodeIgniter\Database\Seeder;

/**
 * Seeder pengaturan default. Bersifat idempotent: hanya menyisipkan key yang
 * belum ada sehingga aman dijalankan ulang tanpa menimpa nilai yang sudah
 * disesuaikan administrator.
 */
class SettingsSeeder extends Seeder
{
    public function run()
    {
        $now = date('Y-m-d H:i:s');

        // Setiap entri: key, value (string), type, category, label, is_public
        $defaults = [
            // --- BRANDING (publik: dipakai halaman login, sidebar, cetak QR) ---
            ['app_title', 'Survei Kepuasan PTSP', 'string', 'branding', 'Judul Aplikasi', 1],
            ['app_subtitle', 'Masuk ke panel administrator untuk mengelola survei', 'string', 'branding', 'Subjudul Halaman Login', 1],
            ['sidebar_brand', 'Survei PTSP', 'string', 'branding', 'Nama Brand Sidebar', 1],
            ['sidebar_subtitle', 'Admin Panel', 'string', 'branding', 'Subjudul Sidebar', 1],
            ['login_help_text', 'Lupa password? Hubungi pengelola sistem.', 'string', 'branding', 'Teks Bantuan Login', 1],
            ['qr_print_title', 'Survei Kepuasan Pelayanan', 'string', 'branding', 'Judul Cetak QR', 1],
            ['qr_print_instruction', 'Pindai QR code di bawah ini', 'string', 'branding', 'Instruksi Cetak QR', 1],
            ['qr_print_cta', 'Pendapat Anda membantu kami melayani lebih baik.', 'string', 'branding', 'Ajakan Cetak QR', 1],

            // --- KIOSK (publik: dipakai halaman survei) ---
            ['kiosk_reset_timeout', '6000', 'int', 'kiosk', 'Timeout Auto-Reset Kiosk (ms)', 1],
            ['saran_max_length', '1000', 'int', 'kiosk', 'Maksimal Karakter Saran', 1],

            // --- PERFORMANCE (privat: dipakai dashboard & tabel admin) ---
            ['dashboard_poll_interval', '60000', 'int', 'performance', 'Interval Polling Dashboard (ms)', 0],
            ['petugas_page_size', '10', 'int', 'performance', 'Jumlah Baris per Halaman (Petugas)', 0],
            ['dashboard_default_range_days', '30', 'int', 'performance', 'Rentang Tanggal Default Dashboard (hari)', 0],

            // --- IKM (publik: label & ambang batas, mengikuti PermenPAN-RB 14/2017) ---
            ['ikm_label_kecepatan', 'Kecepatan Pelayanan', 'string', 'ikm', 'Label Unsur: Kecepatan', 1],
            ['ikm_label_keramahan', 'Keramahan & Perilaku', 'string', 'ikm', 'Label Unsur: Keramahan', 1],
            ['ikm_label_informasi', 'Kejelasan Informasi', 'string', 'ikm', 'Label Unsur: Informasi', 1],
            ['ikm_label_kenyamanan', 'Kenyamanan', 'string', 'ikm', 'Label Unsur: Kenyamanan', 1],
            ['ikm_threshold_a', '88.31', 'float', 'ikm', 'Ambang Batas Mutu A (Sangat Baik)', 1],
            ['ikm_threshold_b', '76.61', 'float', 'ikm', 'Ambang Batas Mutu B (Baik)', 1],
            ['ikm_threshold_c', '65.0', 'float', 'ikm', 'Ambang Batas Mutu C (Kurang Baik)', 1],
        ];

        $builder = $this->db->table('settings');
        foreach ($defaults as [$key, $value, $type, $category, $label, $isPublic]) {
            $exists = $builder->where('key', $key)->countAllResults(false) > 0;
            // Reset builder state akibat countAllResults(false) tetap menyimpan where.
            $builder->resetQuery();

            if ($exists) {
                continue;
            }

            $builder->insert([
                'key'        => $key,
                'value'      => $value,
                'type'       => $type,
                'category'   => $category,
                'label'      => $label,
                'is_public'  => $isPublic,
                'updated_at' => $now,
            ]);
        }
    }
}
