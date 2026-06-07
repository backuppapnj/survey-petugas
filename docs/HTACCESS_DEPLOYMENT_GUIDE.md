# Panduan `.htaccess` untuk Deployment Production

Dokumen ini menjawab: **"Apa yang harus saya isi di `.htaccess` saat deploy ke
production?"**

## Ringkasan (baca ini dulu)

**`.htaccess` TIDAK berisi nilai konfigurasi yang harus diisi.** File ini hanya
berisi aturan _rewrite_ dan _security headers_, dan semuanya **sudah lengkap &
production-ready**. Kredensial dan konfigurasi (URL, database, kunci rahasia)
diisi di file **`.env`**, bukan `.htaccess`.

> Singkatnya: untuk hosting standar yang document root-nya bisa diarahkan ke
> folder `public/`, **Anda tidak perlu mengubah `.htaccess` sama sekali.**

Daftar file `.htaccess` di proyek (semua sudah benar):

| File | Fungsi |
|------|--------|
| `public/.htaccess` | Front controller, rewrite SPA `/app` + API `/api`, HTTPS redirect, security headers (CSP, HSTS, X-Frame-Options, dll.) |
| `app/.htaccess` | `Deny from all` — blokir akses web langsung |
| `tests/.htaccess` | `Deny from all` |
| `writable/.htaccess` | Blokir akses langsung |
| `writable/uploads/.htaccess` | Blokir eksekusi skrip pada folder upload |

---

## Yang BENAR-BENAR harus Anda isi: `.env` (bukan `.htaccess`)

Salin `.env.production.example` menjadi `.env` di server, lalu isi:

```ini
CI_ENVIRONMENT = production
app.baseURL = 'https://domain-anda.com/'          # WAJIB, akhiri dengan slash
app.forceGlobalSecureRequests = true

# Kunci rahasia
encryption.key = <hex2bin:HASIL_php_spark_key:generate>
JWT_SECRET_KEY = <min. 32 karakter — openssl rand -hex 32>
APP_SALT       = <openssl rand -hex 16>

# Database
database.default.hostname = localhost
database.default.database = <nama_db>
database.default.username = <user_db>
database.default.password = <password_db>
database.default.DBDebug  = false

# CORS (boleh kosong jika frontend & API satu domain via /app)
CORS_ALLOWED_ORIGINS = 'https://domain-anda.com'

# Cookie aman
session.cookieSecure  = true
security.cookieSecure = true
logger.threshold      = 4

# Admin awal (dipakai `php spark db:seed`) — JANGAN biarkan default
ADMIN_DEFAULT_USERNAME = admin
ADMIN_DEFAULT_PASSWORD = <password_admin_kuat>
ADMIN_DEFAULT_NAMA     = Administrator
```

---

## Pilih skenario hosting Anda

### Skenario A — Document root bisa diarahkan ke `public/` (VPS, hosting modern)

**Tindakan `.htaccess`: TIDAK ADA.** Biarkan apa adanya.

1. Arahkan document root domain ke folder `<project>/public`.
2. Pastikan `mod_rewrite`, `mod_headers` aktif (umumnya sudah).
3. Isi `.env` seperti di atas. Selesai.

---

### Skenario B — Shared hosting memaksa root di `public_html`

Hosting cPanel sering memaksa web root = `public_html/`.

1. **Pindahkan isi folder `public/`** ke `public_html/` (termasuk `.htaccess`,
   `index.php`, `robots.txt`, dan folder `app/` hasil build frontend).
2. **Taruh sisanya di LUAR** `public_html/` (satu level di atas), yaitu folder:
   `app/`, `system/` (vendor CI4), `vendor/`, `writable/`, dan file `.env`.

   Struktur menjadi:
   ```
   /home/user/
   ├── ci-app/                 ← folder project (di luar web root)
   │   ├── app/
   │   ├── vendor/
   │   ├── writable/
   │   └── .env
   └── public_html/            ← web root (isi dari folder public/)
       ├── .htaccess           ← TIDAK perlu diubah
       ├── index.php           ← EDIT path-nya (lihat di bawah)
       ├── robots.txt
       └── app/                ← hasil build React (public/app)
   ```
3. **Edit `public_html/index.php`** (BUKAN `.htaccess`) — ubah baris path:
   ```php
   // Dari:
   require FCPATH . '../app/Config/Paths.php';
   // Menjadi (sesuaikan dengan lokasi folder project Anda):
   require FCPATH . '../ci-app/app/Config/Paths.php';
   ```
4. **Edit `ci-app/app/Config/Paths.php`** — pastikan `$systemDirectory`,
   `$appDirectory`, dan `$writableDirectory` menunjuk ke lokasi baru
   (relatif terhadap `Paths.php`, biasanya tetap benar jika seluruh folder
   project dipindah utuh).
5. `.htaccess` tetap **tidak diubah**.

---

### Skenario C — Dipasang di subfolder (mis. `https://domain.com/survei/`)

1. Di **`public/.htaccess`**, tambahkan `RewriteBase` tepat setelah setiap
   `RewriteEngine On` pada blok rewrite utama:
   ```apache
   <IfModule mod_rewrite.c>
       Options +FollowSymlinks
       RewriteEngine On
       RewriteBase /survei/        # <-- TAMBAHKAN baris ini
       ...
   </IfModule>
   ```
2. Di **`.env`**: `app.baseURL = 'https://domain.com/survei/'`
3. **Rebuild frontend** dengan base path yang benar agar aset & React Router
   memakai prefiks `/survei/app`:
   ```bash
   cd frontend
   # Sesuaikan "base" di vite.config.ts ATAU set saat build:
   npm run build -- --base=/survei/app/
   ```
4. Verifikasi: `https://domain.com/survei/app/login` memuat SPA dengan benar.

---

## Catatan CSP: jika mengaktifkan integrasi Antrean PTSP

`public/.htaccess` memakai CSP ketat `connect-src 'self'`. Jika Anda mengisi
`ANTRIAN_PTSP_URL` di `.env` (frontend memanggil domain eksternal), tambahkan
domain tersebut ke `connect-src`:

```apache
Header always set Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' https://antrian.example.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'"
```

> Integrasi antrean dipanggil dari **backend** (server-to-server), jadi pada
> kebanyakan kasus CSP `connect-src 'self'` **tetap cukup** dan tidak perlu
> diubah. Ubah hanya bila ada panggilan dari browser ke domain eksternal.

---

## Verifikasi pasca-deploy

```bash
# Header keamanan ada, tanpa X-Powered-By
curl -I https://domain-anda.com

# HTTP ter-redirect ke HTTPS
curl -I http://domain-anda.com        # harus 301 -> https

# File sensitif diblokir
curl -I https://domain-anda.com/.env  # harus 403/404

# Endpoint settings publik bekerja
curl -s https://domain-anda.com/api/settings/public
```

Checklist lengkap deployment ada di `docs/PRODUCTION_DEPLOYMENT_CHECKLIST.md`.
