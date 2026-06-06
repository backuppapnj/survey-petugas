# Design: Token Statis untuk URL Survei (anti-enumeration)

- **Tanggal:** 2026-06-06
- **Status:** Disetujui (siap masuk tahap rencana implementasi)
- **Topik:** Mengganti `petugas_id` mentah di URL survei publik dengan token statis acak, agar ID berurutan tidak bisa ditebak/dienumerasi.

---

## 1. Latar Belakang & Tujuan

URL survei publik saat ini memakai ID berurutan: `/app/survey/3`. ID ini mudah ditebak (1, 2, 3, …), sehingga seseorang dapat menjelajah semua petugas dan mengirim survei tanpa memindai QR fisik, serta menyimpulkan jumlah petugas.

`petugas_id` bukan data rahasia (petugas dinilai publik), namun ID berurutan memperbesar permukaan penyalahgunaan. Solusi: **token statis acak** per petugas sebagai kunci publik di URL. ID internal tetap dipakai untuk relasi DB.

**Catatan penting (sifat QR statis):** QR dicetak sekali & ditempel permanen (tidak ada layar digital). Token bersifat **statis/permanen** — digenerate sekali per petugas, tidak berubah pada operasi normal. Frekuensi penggantian QR sama seperti memakai ID. Token rotating/sekali-pakai TIDAK dipakai (butuh layar dinamis).

**Batas manfaat:** menyamarkan ID mencegah enumerasi, tetapi tidak mencegah submit berulang setelah token diketahui (QR publik). Pelindung utama tetap **rate limit** (`ratelimit:survey`, sudah aktif) + validasi server. Fitur ini = defense-in-depth + URL lebih bersih.

## 2. Keputusan Desain (hasil brainstorming)

| Aspek | Keputusan |
|---|---|
| Cakupan | **Penuh** — token dipakai di endpoint publik GET petugas DAN submit survei. Endpoint admin tetap by id (JWT). |
| Format token | **Acak ~16 char hex** (`bin2hex(random_bytes(8))`, 64-bit). |
| Strategi migrasi | **Token-only** (QR belum tersebar) — endpoint publik tidak menerima id mentah. |
| Regenerate | **Ya** — admin dapat membuat ulang token (mematikan QR lama). |

## 3. Skema Database

Tabel `petugas` menambah kolom:
- `survey_token` : `VARCHAR(32)`, `UNIQUE`, `NOT NULL`.

Migration baru:
1. Tambah kolom `survey_token` (nullable sementara).
2. **Backfill**: isi token acak unik untuk setiap baris petugas existing.
3. Jadikan `NOT NULL` + tambah unique index.

`down()`: drop kolom `survey_token`.

## 4. Rancangan Teknis — Backend (CodeIgniter 4)

### 4.1 PetugasModel (`app/Models/PetugasModel.php`)
- **JANGAN** menambah `survey_token` ke `$allowedFields` (cegah mass-assignment; token disetel sistem).
- Tambah callback `$beforeInsert` untuk generate token bila belum ada:
  - `generateUniqueToken(): string` → `bin2hex(random_bytes(8))`, ulangi bila sudah ada di tabel (cek unik).
- Method `getActiveByToken(string $token): ?array` — petugas aktif berdasarkan token (mirip `getActiveDetail`, filter `is_active = 1`).
- Method `regenerateToken(int $id): ?string` — generate token unik baru, update kolom `survey_token` baris itu **langsung via Query Builder** (bukan mass-assign), kembalikan token baru; `null` jika petugas tidak ada.

### 4.2 PetugasController (`app/Controllers/Api/PetugasController.php`)
- `show($token)` (PUBLIK): lookup `getActiveByToken($token)`; 404 bila tidak ada. (Sebelumnya by id.)
- `serialize()`: sertakan `survey_token` pada output (agar QR dialog & daftar admin punya token).
- Method baru `regenerateToken($id)` (ADMIN/JWT): panggil `PetugasModel::regenerateToken`, kembalikan `{ survey_token }` (200) atau 404.
- Endpoint admin lain (`index`, `create`, `update`, `delete`, `restore`) tetap by id.

### 4.3 SurveiController (`app/Controllers/Api/SurveiController.php`)
- `submit()`: body memakai `token` (ganti `petugas_id`). Aturan validasi:
  - `token` → `required|string`
  - empat unsur → tetap `required|integer|greater_than[0]|less_than[5]`
  - `saran` → tetap `permit_empty|string|max_length[1000]`
- Resolusi: `getActiveByToken($json['token'])`; bila null → 422 (`token` => 'Petugas tidak ditemukan atau tidak aktif'). Simpan survei dengan `petugas_id` internal dari hasil resolve.

### 4.4 Routes (`app/Config/Routes.php`)
- Publik: ganti `GET petugas/(:num) → show/$1` menjadi `GET petugas/(:segment) → show/$1` (menerima token).
- Publik: `POST survei` tetap, body kini `{ token, ... }`.
- Admin (grup `admin`, filter `jwt`): tambah `POST petugas/(:num)/regenerate-token → PetugasController::regenerateToken/$1`. Endpoint admin lain tetap by id.

## 5. Rancangan Teknis — Frontend (React + TypeScript)

### 5.1 Types (`frontend/src/types/index.ts`)
- `Petugas` tambah `survey_token: string`.
- `SurveiPayload`: ganti `petugas_id: number` → `token: string`.

### 5.2 API (`frontend/src/lib/api.ts`)
- `getPetugas(token: string)` → `GET /petugas/{token}`.
- `submitSurvei(payload)` → `POST /survei` dengan `{ token, ... }`.
- Tambah `regenerateToken(id: number): Promise<{ survey_token: string }>` → `POST /admin/petugas/{id}/regenerate-token` (memakai instance ber-auth admin).

### 5.3 SurveyPage (`frontend/src/pages/SurveyPage.tsx`)
- `useParams<{ token: string }>()` (ganti `petugasId`).
- `getPetugas(token)`; submit memakai `token` (bukan `petugas.id`).

### 5.4 QrCodeDialog (`frontend/src/components/petugas/QrCodeDialog.tsx`)
- URL: `${window.location.origin}${import.meta.env.BASE_URL}survey/${petugas.survey_token}` (ganti `petugas.id`).
- Tambah tombol **"Buat ulang token"** dengan **AlertDialog konfirmasi** + peringatan: "QR lama tidak akan berlaku lagi dan harus dicetak ulang." Pada konfirmasi: panggil `regenerateToken(petugas.id)`. Mekanisme update (ditetapkan, bukan opsional): `QrCodeDialog` menerima prop callback `onTokenRegenerated(petugasId: number, newToken: string)`; setelah sukses, panggil callback tersebut agar parent (`PetugasPage`) memperbarui token petugas di state-nya, sehingga `petugas.survey_token` yang diteruskan kembali ke dialog berubah dan QR/URL ter-render ulang otomatis. Dialog tidak menyimpan token di state lokal (sumber kebenaran tunggal ada di parent).

### 5.5 Router (`frontend/src/App.tsx`)
- Route survei: `path="/survey/:token"` (ganti `:petugasId`).

## 6. Alur Data

```
Admin buat petugas → token digenerate otomatis (beforeInsert) → tersimpan
QR dialog → URL /app/survey/{token}
Responden scan → SurveyPage(token) → getPetugas(token) → tampil data
   → submit { token, nilai } → backend resolve token→petugas aktif
   → simpan survei (petugas_id internal). Endpoint publik tak pernah memakai id mentah.
Regenerate: admin klik "Buat ulang token" → konfirmasi → token baru → QR lama mati.
```

## 7. Penanganan Error & Edge Case
- Token tidak ditemukan / petugas non-aktif: `getPetugas` → 404; `submit` → 422.
- Petugas existing sebelum migrasi: token diisi via backfill.
- Bentrokan token saat generate: ulangi hingga unik (peluang sangat kecil pada 64-bit).
- Regenerate pada id tidak ada: 404.

## 8. Pengujian (TDD)
**Backend:**
- `PetugasModelTest`: token auto-generate saat insert & unik; `getActiveByToken` (ketemu / non-aktif → null / tidak ada → null); `regenerateToken` menghasilkan token berbeda & tetap unik.
- `PetugasControllerTest`: `show` by token (200 valid / 404 token asal); `regenerateToken` butuh JWT (401 tanpa) & 200 dengan token berubah.
- `SurveiControllerTest`: submit `{token}` valid → 201; token asal → 422; petugas non-aktif → 422; nilai >4 tetap 422.
- `MigrationTest` (jika ada): kolom `survey_token` ada & unik.

**Frontend:**
- `SurveyPage.test`: memakai param `token`; memanggil `getPetugas(token)`; submit mengirim `token`.
- `QrCodeDialog.test`: URL memakai `survey_token`; tombol regenerate memunculkan konfirmasi; konfirmasi memanggil `regenerateToken`.

## 9. Acceptance Criteria
1. URL survei berbentuk `/app/survey/{token16hex}`; tidak ada id berurutan.
2. Endpoint publik (`GET /api/petugas/{token}`, `POST /api/survei`) bekerja **hanya** dengan token; id mentah ditolak (404/422).
3. Tiap petugas punya `survey_token` unik (existing via backfill, baru via auto-generate).
4. QR code memuat URL berbasis token.
5. Admin dapat membuat ulang token (dengan konfirmasi); token lama berhenti berlaku.
6. Submit survei tetap tersimpan dengan `petugas_id` internal yang benar.
7. Endpoint admin lain tetap by id (JWT) — tidak berubah.
8. Seluruh test backend & frontend hijau.

## 10. Di Luar Lingkup
- Dukungan id lama (dual) — tidak perlu (QR belum tersebar).
- Token rotating/kedaluwarsa (butuh layar dinamis).
- Rate limit tambahan (sudah ada `ratelimit:survey`).
