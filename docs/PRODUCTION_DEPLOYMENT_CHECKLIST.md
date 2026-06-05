# Checklist Deployment Production — Survey Petugas

Dokumen ini merangkum langkah dan verifikasi untuk men-deploy aplikasi
(CodeIgniter 4 + React) ke **shared hosting** secara aman. Mencerminkan kondisi
nyata kode setelah audit kesiapan production (lihat
`docs/superpowers/plans/2026-06-05-production-audit.md`).

> Status uji: backend 67 test PASS, frontend 47 test PASS, `tsc -b` bersih.

---

## 1. Persiapan Rahasia (WAJIB sebelum deploy)

Buat `.env` di server dari template `.env.production.example`, lalu isi:

- [ ] `CI_ENVIRONMENT = production`
- [ ] `app.baseURL` = domain HTTPS Anda (akhiri slash)
- [ ] `app.forceGlobalSecureRequests = true`
- [ ] `encryption.key` — `php spark key:generate` atau `hex2bin:` + `openssl rand -hex 32`
- [ ] `JWT_SECRET_KEY` — **minimal 32 karakter** (`openssl rand -hex 32`).
      JwtLibrary akan **menolak (throw)** bila kosong/terlalu pendek — ini disengaja.
- [ ] `APP_SALT` — `openssl rand -hex 16`
- [ ] Kredensial database (`database.default.*`), `DBDebug = false`
- [ ] `CORS_ALLOWED_ORIGINS` — origin frontend (boleh kosong bila satu domain `/app`)
- [ ] Cookie aman: `session.cookieSecure = true`, `security.cookieSecure = true`
- [ ] `logger.threshold = 4` (hanya error)

> `.env` JANGAN di-commit (sudah di `.gitignore`).

---

## 2. Build & Migrasi

- [ ] Backend deps tanpa dev: `composer install --no-dev --optimize-autoloader`
- [ ] Build frontend: `cd frontend && npm ci && npm run build`
      (output otomatis ke `public/app/`, asset di-lazy-load per rute)
- [ ] Jalankan test sebelum rilis: `php vendor/bin/phpunit` (harus hijau)
- [ ] Migrasi database: `php spark migrate`
- [ ] Seed data awal (admin & petugas): `php spark db:seed DatabaseSeeder`
      lalu **ganti password admin default** segera.

---

## 3. Struktur File di Server (shared hosting)

- [ ] Document root domain menunjuk ke folder `public/` (BUKAN root project).
      Jika hosting memaksa root di `public_html`, taruh isi `public/` di sana dan
      arahkan path `system`/`app`/`writable` ke luar web root.
- [ ] `writable/` writable oleh web server (cache, logs, session, uploads).
- [ ] `.env`, `app/`, `system/`, `vendor/`, `writable/` **di luar** atau tidak
      dapat diakses langsung dari web.
- [ ] Permission: file `644`, direktori `755` (atau sesuai kebijakan hosting).

---

## 4. Keamanan (sudah diterapkan di kode — verifikasi aktif)

- [x] **Autentikasi JWT** dengan validasi kekuatan secret (≥32 char) + `jti` unik.
- [x] **Rate limiting** brute-force pada `POST /api/login` via Throttler bawaan
      CI4 (5 percobaan/menit/IP, cache-backed, aman race condition).
- [x] **XSS**: field `saran` di-sanitasi (`strip_tags` + `htmlspecialchars`) saat simpan.
- [x] **Mass assignment**: controller hanya menerima field eksplisit dari user.
- [x] **Upload file**: verifikasi MIME asli (`finfo`) + `getimagesize` (anti polyglot),
      nama file acak, proteksi path traversal, `.htaccess` blok eksekusi skrip.
- [x] **Enkripsi field-level** tersedia (`App\Libraries\DataEncryption`, OpenSSL AES-256).
- [x] **CSRF**: sengaja TIDAK aktif global — API stateless berbasis Bearer token
      (kebal CSRF). Jangan aktifkan `csrf` di `Filters::$globals` (memblokir API).
- [x] **Security headers** & **HTTPS redirect** di `public/.htaccess`
      (HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy,
      Permissions-Policy, CSP). Header rate limit TIDAK diekspos.
- [x] **DBDebug** otomatis `false` di production (tidak membocorkan error SQL).
- [x] **display_errors = 0** di production (CI4 `Boot/production.php`).

Verifikasi pasca-deploy:

- [ ] `curl -I https://domain-anda.com` → ada `Strict-Transport-Security`,
      `X-Frame-Options`, `X-Content-Type-Options: nosniff`, **tanpa** `X-Powered-By`.
- [ ] Akses `http://` ter-redirect ke `https://`.
- [ ] Login >5x dengan password salah → balasan `429` + header `Retry-After`.
- [ ] Coba buka `/.env` via browser → ditolak (403/404).
- [ ] Database user diberi hak minimal (tanpa `DROP`/`FILE`/`GRANT`).

---

## 5. Performa (shared hosting)

- [x] Query rekap **sargable** (memakai index `created_at`, tanpa `DATE()` wrapping).
- [x] Index `petugas_id` & `created_at` + FK sudah ada di migrasi `survei`.
- [x] Frontend: halaman admin **lazy-loaded** → bundle awal survey publik ringan
      (recharts hanya diunduh saat dashboard dibuka).
- [ ] Aktifkan kompresi (gzip/Brotli) & cache statis di panel hosting bila tersedia.
- [ ] (Opsional) Jika trafik rekap tinggi, pertimbangkan cache hasil rekap
      dengan TTL pendek + invalidasi saat ada survei baru.

---

## 6. Pasca-Deploy

- [ ] Uji alur: submit survey publik, login admin, lihat dashboard, kelola petugas,
      upload foto, export Excel.
- [ ] Cek `writable/logs/` tidak berisi error tak terduga.
- [ ] Siapkan **backup terjadwal** database + folder `writable/uploads/`.
- [ ] Pastikan sertifikat SSL valid & auto-renew aktif.
- [ ] Catat rencana **rotasi kunci** (encryption `previousKeys`, JWT secret).

---

## Catatan Rollback

Branch fitur: `feature/production-readiness`. Bila perlu rollback cepat,
deploy ulang commit stabil sebelumnya dan jalankan `php spark migrate:rollback`
bila ada migrasi baru. Simpan `.env` lama secara aman sebelum mengganti kunci.
