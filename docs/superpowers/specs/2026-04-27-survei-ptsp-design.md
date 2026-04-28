# Design Spec: Aplikasi Survei Kepuasan Masyarakat PTSP

**Tanggal**: 2026-04-27
**Status**: Draft — Menunggu persetujuan
**Referensi**: docs/PRD.md

---

## 1. Ringkasan

Aplikasi survei kepuasan masyarakat terhadap petugas PTSP. Masyarakat scan QR code di loket petugas, memberikan rating 1-5 bintang untuk 4 aspek pelayanan, lalu submit. Admin login ke dashboard untuk melihat IKM real-time, grafik perbandingan, dan ekspor laporan Excel.

**Tech Stack:**
- **Backend**: CodeIgniter 4 (REST API only)
- **Frontend**: React (Vite + TypeScript)
- **UI Library**: shadcn/ui + Magic UI
- **Chart**: Recharts (via shadcn chart wrapper)
- **Database**: MySQL
- **Auth**: JWT (firebase/php-jwt)

---

## 2. Arsitektur

### Monorepo Structure

```
survey-petugas/                  # Root CI4
├── app/                         # CI4 Backend (API only)
│   ├── Config/
│   │   ├── Routes.php
│   │   └── Filters.php
│   ├── Controllers/Api/
│   │   ├── AuthController.php
│   │   ├── PetugasController.php
│   │   ├── SurveiController.php
│   │   └── ExportController.php
│   ├── Models/
│   │   ├── PetugasModel.php
│   │   ├── SurveiModel.php
│   │   └── AdminModel.php
│   ├── Filters/
│   │   └── JwtFilter.php
│   ├── Libraries/
│   │   └── JwtLibrary.php
│   └── Database/
│       ├── Migrations/
│       └── Seeds/
├── frontend/                    # React App (Vite + TypeScript)
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/              # shadcn/ui + Magic UI components
│   │   │   ├── survey/          # StarRating, SurveyForm
│   │   │   ├── dashboard/       # ChartCards, RekapTable
│   │   │   └── petugas/         # PetugasForm, PetugasTable
│   │   ├── pages/
│   │   │   ├── SurveyPage.tsx
│   │   │   ├── LoginPage.tsx
│   │   │   ├── DashboardPage.tsx
│   │   │   └── PetugasPage.tsx
│   │   ├── lib/
│   │   │   ├── api.ts           # Axios/fetch wrapper
│   │   │   └── utils.ts
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   └── useApi.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── components.json          # shadcn config
│   ├── tailwind.config.ts
│   ├── vite.config.ts
│   └── package.json
├── public/
│   ├── index.php                # CI4 front controller
│   └── app/                     # React build output (production)
├── writable/uploads/            # Foto petugas
├── composer.json
└── docs/
```

### Development Flow

- React dev server (Vite) di port 5173
- CI4 dev server (`php spark serve`) di port 8080
- Vite proxy: `/api/*` → `http://localhost:8080`
- Production: `npm run build` → output ke `public/app/`, CI4 serve semua

### Routing

- CI4 handle semua request `/api/*`
- Semua route lain → fallback ke `public/app/index.html` (React SPA)

---

## 3. Skema Database

### Tabel `petugas`

| Kolom | Tipe | Constraint |
|-------|------|------------|
| id | INT | AUTO_INCREMENT, PK |
| nama | VARCHAR(100) | NOT NULL |
| foto | VARCHAR(255) | NOT NULL, nama file di writable/uploads/ |
| loket | VARCHAR(50) | NOT NULL |
| unit_kerja | VARCHAR(100) | NOT NULL |
| is_active | TINYINT(1) | DEFAULT 1 |
| created_at | DATETIME | NOT NULL |
| updated_at | DATETIME | NOT NULL |

### Tabel `survei`

| Kolom | Tipe | Constraint |
|-------|------|------------|
| id | INT | AUTO_INCREMENT, PK |
| petugas_id | INT | NOT NULL, FK → petugas.id |
| kecepatan | TINYINT | NOT NULL, CHECK 1-5 |
| keramahan | TINYINT | NOT NULL, CHECK 1-5 |
| informasi | TINYINT | NOT NULL, CHECK 1-5 |
| kenyamanan | TINYINT | NOT NULL, CHECK 1-5 |
| saran | TEXT | NULL |
| created_at | DATETIME | NOT NULL |

### Tabel `admin`

| Kolom | Tipe | Constraint |
|-------|------|------------|
| id | INT | AUTO_INCREMENT, PK |
| username | VARCHAR(50) | UNIQUE, NOT NULL |
| password_hash | VARCHAR(255) | NOT NULL |
| nama | VARCHAR(100) | NOT NULL |
| created_at | DATETIME | NOT NULL |

### Index

- `survei.petugas_id` — FK index
- `survei.created_at` — untuk filter tanggal
- `admin.username` — unique index

### Seeder

- 1 admin default: `admin` / `admin123` (bcrypt hash)
- 3-5 petugas contoh dengan foto placeholder

---

## 4. API Endpoints

### Public Endpoints (tanpa auth)

| Method | URL | Body/Params | Response |
|--------|-----|-------------|----------|
| GET | `/api/petugas/{id}` | - | `{ id, nama, foto_url, loket, unit_kerja }` |
| POST | `/api/survei` | `{ petugas_id, kecepatan, keramahan, informasi, kenyamanan, saran? }` | `{ message: "Terima kasih" }` |

### Auth Endpoint

| Method | URL | Body | Response |
|--------|-----|------|----------|
| POST | `/api/login` | `{ username, password }` | `{ token, admin: { id, nama } }` |

### Protected Endpoints (JWT required)

| Method | URL | Params | Response |
|--------|-----|--------|----------|
| GET | `/api/admin/petugas` | - | `[{ id, nama, foto_url, loket, unit_kerja, is_active }]` |
| POST | `/api/admin/petugas` | multipart: nama, loket, unit_kerja, foto (file) | `{ id, nama, ... }` |
| PUT | `/api/admin/petugas/{id}` | multipart: nama?, loket?, unit_kerja?, foto? (file) | `{ id, nama, ... }` |
| DELETE | `/api/admin/petugas/{id}` | - | `{ message }` (soft delete: is_active=0) |
| GET | `/api/admin/petugas/{id}/qrcode` | - | PNG image (QR code) |
| GET | `/api/admin/survei/rekap` | `?start=YYYY-MM-DD&end=YYYY-MM-DD` | `{ summary, per_petugas[], semua[] }` |
| GET | `/api/admin/survei/export` | `?start=YYYY-MM-DD&end=YYYY-MM-DD` | .xlsx file download |

### Response Format Rekap

```json
{
  "summary": {
    "total_responden": 150,
    "rata_rata": {
      "kecepatan": 4.2,
      "keramahan": 4.5,
      "informasi": 4.1,
      "kenyamanan": 4.3
    },
    "ikm": 85.5
  },
  "per_petugas": [
    {
      "petugas_id": 1,
      "nama": "Budi",
      "foto_url": "/uploads/budi.jpg",
      "total_responden": 50,
      "rata_rata": {
        "kecepatan": 4.3,
        "keramahan": 4.6,
        "informasi": 4.0,
        "kenyamanan": 4.4
      }
    }
  ],
  "semua": [
    {
      "id": 1,
      "petugas_id": 1,
      "kecepatan": 5,
      "keramahan": 4,
      "informasi": 4,
      "kenyamanan": 5,
      "saran": "Pelayanan bagus",
      "created_at": "2026-04-27 10:00:00"
    }
  ]
}
```

### Perhitungan IKM

IKM dihitung dari rata-rata keseluruhan 4 aspek, dikonversi ke skala 100:

```
rata_rata_total = (AVG(kecepatan) + AVG(keramahan) + AVG(informasi) + AVG(kenyamanan)) / 4
IKM = (rata_rata_total / 5) * 100
```

### Validasi

- **POST /api/survei**: petugas_id wajib ada & aktif di DB, setiap rating integer 1-5
- **POST /api/admin/petugas**: nama wajib, foto wajib (jpg/png, max 2MB), loket wajib, unit_kerja wajib
- **PUT /api/admin/petugas/{id}**: minimal satu field berubah, foto opsional

### JWT

- Secret key dari `.env` (`JWT_SECRET_KEY`)
- Expiry: 24 jam
- Header: `Authorization: Bearer <token>`
- JwtFilter diterapkan pada semua route `/api/admin/*`

### Upload Foto

- Disimpan di `writable/uploads/` dengan nama unik (UUID + ekstensi asli)
- Response `foto_url` mengembalikan path relatif yang bisa diakses via endpoint CI4
- Endpoint serve foto: `GET /api/uploads/{filename}` (public, tanpa auth)

---

## 5. Frontend — Halaman & Komponen

### React Router Routes

| Path | Component | Auth | Deskripsi |
|------|-----------|------|-----------|
| `/survey/:petugasId` | SurveyPage | - | Halaman publik survei |
| `/login` | LoginPage | - | Login admin |
| `/dashboard` | DashboardPage | JWT | Dashboard IKM |
| `/petugas` | PetugasPage | JWT | CRUD petugas |

### 5.1 Halaman Survei (`/survey/:petugasId`)

**Alur:**
1. Load petugas data dari `GET /api/petugas/{id}`
2. Tampilkan foto, nama, loket petugas
3. User isi 4 rating bintang + saran opsional
4. Validasi: semua bintang harus dipilih
5. Submit → `POST /api/survei`
6. Tampilkan "Terima Kasih" + efek Confetti
7. Auto-reset 3 detik (mode kiosk)

**Komponen:**
| Kebutuhan | Komponen | Sumber |
|-----------|----------|--------|
| Background | `DotPattern` (glow) | Magic UI |
| Card survei | `Card` + `BorderBeam` | shadcn + Magic UI |
| Foto petugas | `Avatar` (size lg) | shadcn |
| Nama petugas | `BlurFade` animasi | Magic UI |
| Rating bintang | Custom `StarRating` | Custom |
| Input saran | `Textarea` | shadcn |
| Tombol kirim | `ShimmerButton` | Magic UI |
| Sukses submit | `Confetti` + `Sonner` | Magic UI + shadcn |
| Loading | `Skeleton` | shadcn |

**Desain:**
- Mobile-first, max-width 420px card centered
- Background: DotPattern dengan radial gradient mask
- Card dengan BorderBeam animated border
- StarRating: 5 bintang per aspek, label di atas (Kecepatan, Keramahan, Informasi, Kenyamanan)

### 5.2 Halaman Login (`/login`)

**Alur:**
1. Form username + password
2. Submit → `POST /api/login`
3. Simpan JWT di localStorage
4. Redirect ke `/dashboard`

**Komponen:**
| Kebutuhan | Komponen | Sumber |
|-----------|----------|--------|
| Background | `DotPattern` | Magic UI |
| Card login | `Card` + `ShineBorder` | shadcn + Magic UI |
| Form | `Input`, `Label`, `Form` | shadcn |
| Tombol login | `Button` | shadcn |
| Error | `Sonner` toast | shadcn |

### 5.3 Halaman Dashboard (`/dashboard`)

**Alur:**
1. Load rekap dari `GET /api/admin/survei/rekap?start=today&end=today`
2. Render kartu ringkasan, charts, tabel
3. User bisa ubah filter tanggal → re-fetch data
4. User bisa klik tombol ekspor → download Excel

**Komponen:**
| Kebutuhan | Komponen | Sumber |
|-----------|----------|--------|
| Layout | `Sidebar` (collapsible) | shadcn |
| Kartu IKM | `MagicCard` + `NumberTicker` | Magic UI |
| Gauge IKM | `AnimatedCircularProgressBar` | Magic UI |
| Radar chart | `ChartContainer` + Recharts RadarChart | shadcn chart |
| Bar chart | `ChartContainer` + Recharts BarChart | shadcn chart |
| Tabel petugas | `Table` (DataTable pattern) | shadcn |
| Filter tanggal | `DatePicker` (Calendar + Popover) | shadcn |
| Tombol ekspor | `Button` | shadcn |
| Tab konten | `Tabs` | shadcn |
| Animasi masuk | `BlurFade` | Magic UI |
| Loading | `Skeleton` + `Spinner` | shadcn |

**Layout Dashboard:**
- Sidebar kiri: navigasi (Dashboard, Petugas, Logout)
- Area utama:
  - Baris atas: 3-4 MagicCard (Total Responden, IKM, Rata-rata per aspek) dengan NumberTicker
  - Baris tengah: Radar Chart (kiri) + Bar Chart (kanan)
  - Baris bawah: Tabel ranking petugas

### 5.4 Halaman Petugas (`/petugas`)

**Alur:**
1. Load daftar petugas dari `GET /api/admin/petugas`
2. Tampilkan tabel dengan foto, nama, loket, unit kerja, status, aksi
3. Tombol "Tambah Petugas" → buka Dialog form
4. Aksi per baris: Edit, Hapus, Download QR
5. CRUD via API endpoints

**Komponen:**
| Kebutuhan | Komponen | Sumber |
|-----------|----------|--------|
| Tabel | `Table` (DataTable) | shadcn |
| Modal CRUD | `Dialog` + `Form` | shadcn |
| Input fields | `Input`, `Label`, `Select` | shadcn |
| Upload foto | Custom file input + preview | Custom |
| Foto di tabel | `Avatar` | shadcn |
| Konfirmasi hapus | `AlertDialog` | shadcn |
| Status badge | `Badge` | shadcn |
| Menu aksi | `DropdownMenu` | shadcn |
| QR preview | `Dialog` + qrcode.react | shadcn + lib |
| Notifikasi | `Sonner` | shadcn |

---

## 6. Daftar Komponen

### shadcn/ui (20 komponen)

```
card, button, input, label, textarea, form, avatar, badge,
table, dialog, alert-dialog, dropdown-menu, sidebar, tabs,
calendar, popover, skeleton, spinner, sonner, chart
```

### Magic UI (9 komponen)

```
number-ticker, magic-card, animated-circular-progress-bar,
blur-fade, border-beam, shimmer-button, confetti,
dot-pattern, shine-border
```

### Library Tambahan

| Library | Kegunaan |
|---------|----------|
| recharts | Chart (via shadcn chart wrapper) |
| qrcode.react | Generate QR code per petugas |
| react-router-dom | Client-side routing SPA |
| axios | HTTP client untuk API calls |
| motion | Animasi (dependency Magic UI) |
| next-themes | Theme provider dark/light (dependency Magic UI, kompatibel dengan Vite) |

### Backend Dependencies (Composer)

| Package | Kegunaan |
|---------|----------|
| firebase/php-jwt | Encode/decode JWT token |
| phpoffice/phpspreadsheet | Generate file Excel (.xlsx) |
| ramsey/uuid | Generate UUID untuk nama file upload |

---

## 7. Keputusan Desain

1. **Satu role admin** — tidak ada Super Admin. Semua admin bisa akses dashboard + kelola petugas.
2. **Soft delete petugas** — petugas yang dihapus hanya di-set `is_active=0`, data survei tetap ada.
3. **Upload foto ke server** — disimpan di `writable/uploads/` dengan nama UUID.
4. **Auto-generate QR** — QR code di-generate on-demand saat admin klik download, berisi URL `{baseUrl}/survey/{petugasId}`.
5. **Mode kiosk survei** — setelah submit, halaman auto-reset ke tampilan awal 3 detik kemudian.
6. **Monorepo** — React app di folder `frontend/`, build output ke `public/app/`.
7. **Filter tanggal default** — dashboard default menampilkan data hari ini.
8. **Ekspor Excel wajib** — menggunakan PhpSpreadsheet untuk generate .xlsx.

---

## 8. Error Handling

### Frontend
- API error → tampilkan toast via Sonner dengan pesan Bahasa Indonesia
- Network error → tampilkan pesan "Koneksi terputus, coba lagi"
- 401 Unauthorized → redirect ke `/login`, hapus token
- Loading state → Skeleton placeholder di semua halaman
- Form validation → inline error di bawah input field

### Backend
- Validasi input → return 422 dengan detail error per field
- Resource not found → return 404 dengan pesan
- Auth failed → return 401
- Server error → return 500 dengan pesan generic (log detail ke writable/logs/)

### Response Format Error

```json
{
  "status": 422,
  "error": "Validation Error",
  "messages": {
    "kecepatan": "Rating kecepatan wajib diisi (1-5)",
    "petugas_id": "Petugas tidak ditemukan"
  }
}
```

---

## 9. Keamanan

- JWT token expired 24 jam, secret key dari `.env`
- Password admin di-hash dengan bcrypt (password_hash bawaan PHP)
- Upload foto: validasi tipe file (jpg/png only), max 2MB
- CORS: hanya izinkan origin frontend (development: localhost:5173)
- Endpoint publik (survei + petugas detail) tidak memerlukan auth
- Rate limiting pada POST /api/survei untuk mencegah spam (opsional, bisa ditambahkan nanti)
- Semua query menggunakan CI4 Query Builder (parameterized, aman dari SQL injection)

---

## 10. Testing Strategy

- **Backend**: PHPUnit — unit test untuk model, integration test untuk API endpoint
- **Frontend**: Vitest + React Testing Library — unit test komponen, integration test halaman
- **TDD**: Setiap fitur dimulai dengan test terlebih dahulu (RED → GREEN → REFACTOR)
