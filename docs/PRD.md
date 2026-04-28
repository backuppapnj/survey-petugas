# PRODUCT REQUIREMENTS DOCUMENT (PRD)
## Aplikasi Survei Kepuasan Masyarakat terhadap Petugas PTSP  
**Versi 1.0**

| | |
|---|---|
| **Nama Produk** | Survei PTSP |
| **Platform** | Web (Responsive), Backend: CodeIgniter 4 |
| **Target Pengguna** | Masyarakat pengguna layanan PTSP (survei), Admin/Atasan PTSP (dashboard) |
| **Tanggal** | (isi tanggal) |
| **Status** | Draft Final |

---

## 1. Executive Summary
Aplikasi ini bertujuan menyediakan sarana cepat, anonim, dan real-time bagi masyarakat untuk menilai kinerja petugas PTSP setelah mendapatkan layanan.  
Dari sisi pengelola, aplikasi menyajikan dashboard IKM (Indeks Kepuasan Masyarakat) lengkap dengan grafik dan laporan, yang seluruhnya didukung oleh REST API yang dibangun menggunakan **CodeIgniter 4**.

---

## 2. Latar Belakang & Masalah
- Proses survei manual memakan waktu dan sulit memperoleh data harian.
- Belum ada alat ukur objektif per petugas secara langsung.
- Diperlukan sistem yang mudah diakses via smartphone tanpa instalasi.
- Pelaporan IKM sesuai PermenPAN-RB memerlukan perhitungan indeks yang terstruktur.

---

## 3. Tujuan Produk
1. Mengumpulkan **penilaian 4 unsur** pelayanan (kecepatan, keramahan, informasi, kenyamanan) secara digital.
2. Menyediakan **dashboard real-time** untuk monitoring kinerja petugas.
3. Menghitung **Indeks Kepuasan Masyarakat (IKM)** otomatis sesuai standar.
4. Memudahkan pembuatan **laporan resmi** dengan fitur ekspor.

---

## 4. Ruang Lingkup
### Termasuk
- **Survei Page** : Halaman publik yang diakses via QR unik per petugas.
- **Admin Dashboard** : Autentikasi, ringkasan IKM, grafik, tabel per petugas, ekspor.
- **REST API Backend** : Menggunakan CodeIgniter 4, menyediakan endpoint untuk data petugas, submit survei, dan rekap.
- **Manajemen Petugas** : API untuk CRUD petugas (bisa di-backend, opsional GUI admin).

### Tidak Termasuk (Versi 1.0)
- Manajemen pengguna masyarakat (registrasi/login).
- Notifikasi otomatis (email/WA).
- Integrasi SSO.
- Aplikasi mobile native (hanya web responsive).

---

## 5. Persona Pengguna
1. **Masyarakat** – Mengakses via scan QR, tidak perlu login, cukup klik bintang dan kirim.
2. **Admin PTSP** – Login, akses dashboard, filter data, unduh laporan.
3. **Super Admin (opsional)** – Mengelola akun admin dan master data petugas.

---

## 6. User Stories
### Masyarakat
- Saya dapat *scan* kode QR di meja petugas untuk membuka survei.
- Saya melihat foto dan nama petugas yang melayani saya.
- Saya memberikan rating 1–5 bintang untuk 4 aspek pelayanan.
- Saya bisa menambahkan saran (tidak wajib).
- Setelah mengirim, saya mendapat konfirmasi dan halaman siap untuk pengguna berikutnya.

### Admin
- Saya login dengan username & password.
- Saya melihat dashboard IKM hari ini, total responden, rata-rata per aspek.
- Saya melihat radar chart dan bar chart perbandingan petugas.
- Saya dapat memfilter data survei berdasarkan tanggal.
- Saya mengunduh laporan IKM dalam format Excel.

---

## 7. Alur Utama (Flow)

### 7.1 Alur Submit Survei
1. Masyarakat scan QR → buka halaman `survey.html?petugas=<id>`.
2. Halaman memanggil `GET /api/petugas/{id}` untuk menampilkan foto & nama.
3. Masyarakat mengisi rating bintang (4 item) + saran (opsional).
4. Validasi semua bintang harus dipilih.
5. Kirim `POST /api/survei` dengan data JSON.
6. Respons sukses → tampilkan pesan terima kasih, auto-reset ke tampilan awal setelah 3 detik.

### 7.2 Alur Dashboard Admin
1. Admin mengakses `admin.html` → jika belum login, tampilkan form login.
2. `POST /api/login` dengan kredensial → terima token JWT.
3. Token disimpan di localStorage, setiap permintaan berikutnya menyertakan header `Authorization: Bearer <token>`.
4. Dashboard memuat `GET /api/survei/rekap?start=YYYY-MM-DD&end=YYYY-MM-DD` (default hari ini).
5. Tampilan diperbarui: kartu IKM, chart, tabel.
6. Admin dapat mengubah filter tanggal untuk melihat rentang tertentu.
7. Ekspor laporan melalui endpoint `GET /api/survei/export?start=...&end=...` (mengembalikan file Excel).

---

## 8. Spesifikasi Fungsional

### 8.1 Frontend
- **Survei Page** (`survey.html`) :  
  - Responsif (max-width 420px card style).  
  - Interaksi bintang dengan CSS (tanpa library).  
  - Kirim data via fetch API.  
  - Tahan mode kiosk (auto-reset 3 detik setelah submit).
- **Admin Dashboard** (`admin.html`) :  
  - Grafik menggunakan Chart.js 4.  
  - Radar chart 4 sumbu, bar chart per petugas.  
  - Tabel daftar petugas dengan rata-rata nilai & jumlah responden.  
  - Fitur filter tanggal (dua input date) & tombol unduh.

### 8.2 Backend (CodeIgniter 4)
#### Struktur Direktori Penting
```
app/
├── Config/
│   ├── Routes.php
│   ├── Filters.php       // tambahkan JWT filter
│   └── JWT.php           // konfigurasi kunci JWT (jika tidak di .env)
├── Controllers/
│   ├── Api/
│   │   ├── Auth.php      // login, logout
│   │   ├── Petugas.php   // daftar & detail petugas
│   │   ├── Survei.php    // submit & rekap
│   │   └── Export.php    // ekspor laporan (opsional)
├── Models/
│   ├── PetugasModel.php
│   ├── SurveiModel.php
│   └── AdminModel.php
├── Filters/
│   └── JwtFilter.php     // validasi token
├── Database/
│   └── Migrations/       // file migrasi tabel
└── Libraries/
    └── JwtLibrary.php    // encode/decode JWT (pakai firebase/php-jwt via Composer)
```

#### Endpoint API
| Method | URL | Deskripsi | Auth |
|--------|-----|-----------|------|
| POST | `/api/login` | Login admin, return JWT token | - |
| GET | `/api/petugas` | Dapatkan semua petugas | - |
| GET | `/api/petugas/{id}` | Detail satu petugas | - |
| POST | `/api/survei` | Mengirim data survei | - |
| GET | `/api/survei/rekap?start=YYYY-MM-DD&end=YYYY-MM-DD` | Data rekap (semua baris + per_petugas) | JWT |
| GET | `/api/survei/export?start=...&end=...` | Ekspor Excel | JWT |

**Catatan**:  
- Endpoint petugas terbuka untuk kebutuhan survei (tanpa token).  
- Untuk keamanan tambahan, bisa dibatasi origin atau IP internal jika perlu.

#### Skema Data
- **petugas** (id, nama, foto_url, loket, unit_kerja, created_at)  
- **survei** (id, petugas_id, kecepatan, keramahan, informasi, kenyamanan, saran, created_at)  
- **admin** (id, username, password_hash, created_at)

#### Fitur Backend Kunci
1. **JWT Authentication**  
   - Pustaka: `firebase/php-jwt` (composer).  
   - Filter `JwtFilter.php` memeriksa header `Authorization`, extract token, dan validasi.  
   - Konfigurasi secret key di `.env`.
2. **Validasi Survei**  
   - Menggunakan CI4 Validation: setiap rating wajib integer antara 1-5, petugas_id harus ada di database.
3. **Rekap Survei**  
   - Mengembalikan dua set data:  
     * `semua` : seluruh baris survei dalam rentang tanggal (untuk radar chart).  
     * `per_petugas` : agregasi per petugas (AVG tiap aspek, total responden).
4. **Ekspor Excel** (opsional)  
   - Gunakan `PhpOffice/PhpSpreadsheet` untuk membuat file .xlsx yang langsung diunduh.

---

## 9. Kebutuhan Non-Fungsional
- **Performa** : Halaman survei harus dimuat < 2 detik pada koneksi 3G.
- **Keamanan** : Transaksi lewat HTTPS; token admin expired 24 jam; data survei anonim (tidak ada IP logging wajib).
- **Kompatibilitas** : Mendukung browser modern (Chrome, Firefox, Safari) di perangkat Android/iOS.
- **Ketersediaan** : Backend CI4 di-deploy di server yang stabil (uptime 99%).
- **Kemudahan Deployment** : Menggunakan migration untuk setup tabel, seeding untuk admin default.

---

## 10. Rencana Rilis & Milestone

| Tahap | Kegiatan | Estimasi |
|-------|----------|----------|
| 1 | Setup CI4 project, migrasi tabel, konfigurasi JWT | 3 hari |
| 2 | Buat model dan controller API (petugas, login) | 5 hari |
| 3 | Buat controller survei (submit & rekap) | 5 hari |
| 4 | Integrasi dengan frontend (survey & admin) | 5 hari |
| 5 | Pengujian internal (end-to-end) | 3 hari |
| 6 | UAT dengan admin PTSP & perbaikan | 3 hari |
| 7 | Go-live dan training | 2 hari |

---

## 11. Persetujuan

| Nama | Jabatan | Tanda Tangan | Tanggal |
|------|--------|--------------|---------|
| | Pimpinan PTSP | | |
| | Pengembang Backend | | |
| | Analis Sistem | | |

---

Dokumen ini menjadi acuan utama pengembangan aplikasi **Survei Kepuasan Masyarakat PTSP** berbasis CodeIgniter 4. Setiap perubahan setelah persetujuan harus dicatat dalam amandemen.