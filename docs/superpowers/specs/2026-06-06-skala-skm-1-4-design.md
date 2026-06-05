# Design: Penyesuaian Skala Penilaian Survei ke 1–4 (PermenPAN-RB 14/2017)

- **Tanggal:** 2026-06-06
- **Status:** Disetujui (siap masuk tahap rencana implementasi)
- **Topik:** Mengubah skala penilaian survei kepuasan dari 1–5 (bintang) menjadi 1–4 (skala persepsi resmi) agar patuh penuh pada metodologi SKM.

---

## 1. Latar Belakang & Motivasi

Aplikasi menilai **petugas pelayanan individu** (QR per petugas) memakai skala bintang **1–5**, lalu mengonversi ke skala 1–4 untuk menghitung IKM. Hasil research sumber primer menunjukkan ini menyimpang dari standar.

**Bukti primer** — PermenPAN-RB No. 14 Tahun 2017 (Berita Negara No.708/2017), Lampiran BAB I huruf H angka 2:

> "Indeks Kepuasan Masyarakat adalah hasil pengukuran dari kegiatan Survei Kepuasan Masyarakat berupa angka. **Angka ditetapkan dengan skala 1 (satu) sampai dengan 4 (empat).**"

Diperkuat BAB II: metode pengukuran memakai **Skala Likert** 4 poin.

**Masalah skala 5 + konversi:**
1. Skala 5 (ganjil) memiliki titik tengah netral (nilai 3 "Cukup") yang tidak ada pada skala 4. Skala 4 (genap) sengaja memaksa responden condong — properti psikometrik yang **tidak dapat dipulihkan** dengan konversi matematis.
2. Label `StarRating` ("Sangat Tidak Puas … Sangat Puas") bukan label persepsi resmi.

## 2. Keputusan Desain (hasil brainstorming)

| Aspek | Keputusan |
|---|---|
| Skala | **1–4** dengan label persepsi resmi |
| Unsur | **4 unsur dipertahankan** (kolom DB tidak berubah), label tampilan disempurnakan |
| Data historis | **Fresh start** — kosongkan tabel `survei` (hanya data uji) |
| UI penilaian | **Tombol berlabel resmi** (4 pill horizontal), bukan bintang |

### Catatan keputusan unsur
9 unsur PermenPAN dirancang untuk menilai **unit pelayanan**, bukan **petugas individu**. Hanya U6 (Kompetensi) & U7 (Perilaku) yang melekat pada petugas. Karena itu memaksakan 9 unsur tidak relevan; 4 unsur aplikasi sudah merupakan adaptasi sah untuk konteks petugas (PermenPAN catatan **) hal. 9 membolehkan penyesuaian unsur).

## 3. Skala & Label Persepsi (sumber kebenaran tunggal)

Konstanta bersama baru (frontend) — dipakai komponen rating, distribusi, dan dokumentasi:

| Nilai | Label resmi |
|:---:|---|
| 1 | Tidak Baik |
| 2 | Kurang Baik |
| 3 | Baik |
| 4 | Sangat Baik |

## 4. Unsur — Label Tampilan (kolom DB tetap)

Kolom `kecepatan`, `keramahan`, `informasi`, `kenyamanan` **tidak berubah** (tanpa migrasi skema). Label tampilan (UI form, dashboard, header export):

| Kolom DB | Label baru | Selaras PermenPAN |
|---|---|---|
| `kecepatan` | Kecepatan Pelayanan | U3 Waktu Penyelesaian |
| `keramahan` | Keramahan & Perilaku | U7 Perilaku Pelaksana |
| `informasi` | Kejelasan Informasi | U6 Kompetensi Pelaksana |
| `kenyamanan` | Kenyamanan | U9 Sarana & Prasarana |

## 5. Rancangan Teknis

### 5.1 Backend (CodeIgniter 4)
- **Validasi** `app/Controllers/Api/SurveiController.php`: `greater_than[0]|less_than[6]` → `greater_than[0]|less_than[5]` untuk keempat unsur (terima 1–4, tolak ≥5).
- **Helper** `app/Helpers/ikm_helper.php`:
  - **Hapus** fungsi `rata5_ke_nrr` (tidak ada konversi skala lagi).
  - `hitung_ikm(kecepatan, keramahan, informasi, kenyamanan)` = rata-rata keempat nilai (skala 1–4) **× 25**, dibulatkan 2 desimal. Seluruh unsur 0 → IKM 0.
- `app/Models/SurveiModel.php`: pemanggilan `hitung_ikm` tetap; komentar IKM disesuaikan (NRR 1–4 × 25, tanpa konversi).
- Migrasi skema **tidak diubah** (TINYINT cukup menampung 1–4).

### 5.2 Frontend (React + TypeScript)
- **Komponen baru** `RatingScale` (mis. `src/components/survey/RatingScale.tsx`) menggantikan `StarRating`:
  - Render 4 tombol/pill berlabel persepsi resmi; `value` 1–4; `onChange`.
  - Aksesibilitas setara `StarRating`: `role="radiogroup"`, `aria-checked`, navigasi panah keyboard.
  - `StarRating.tsx` dan `StarRating.test.tsx` **dihapus**.
- **Konstanta** `NILAI_PERSEPSI` di `src/lib/ikm.ts` (rumah logika SKM/IKM yang sudah ada) sebagai sumber label tunggal, diekspor untuk dipakai `RatingScale` & `RatingDistribution`.
- `src/lib/ikm.ts`:
  - **Hapus** `rata5ToNrr`.
  - `hitungIkm` = rata-rata 4 unsur (1–4) × 25.
  - `categorizeIkm` **tetap** (rentang 25–100 tidak berubah).
- `src/pages/SurveyPage.tsx`: pakai `RatingScale`; array `ASPEK` memakai label unsur baru.
- Dashboard:
  - `SummaryCards.tsx` & `PetugasDetailDialog.tsx`: pembagi `/5` → `/4` (bar & teks "/4.00").
  - `RatingDistribution.tsx`: buckets `[0,0,0,0]`, label sumbu "1–4", loop nilai 1–4 (memakai `NILAI_PERSEPSI`).
  - `DashboardPage.tsx`: ambang "rating rendah" untuk daftar saran → nilai ≤ 2 (Tidak Baik/Kurang Baik); sesuaikan teksnya.

### 5.3 Data — Fresh Start
- Kosongkan tabel `survei` saat rilis (`TRUNCATE survei` atau `php spark migrate:refresh` + reseed). **Petugas & admin dipertahankan.**
- Langkah operasional terdokumentasi, **bukan** kode migrasi data.

## 6. Dampak pada Nilai IKM (skala 1–4, IKM = NRR × 25)

| Rata-rata unsur | IKM | Mutu |
|:---:|:---:|:---:|
| 4,0 (semua "Sangat Baik") | 100,00 | A Sangat Baik |
| 3,5 | 87,50 | B Baik |
| 3,0 (semua "Baik") | 75,00 | C Kurang Baik |
| 2,5 | 62,50 | D Tidak Baik |
| 2,0 | 50,00 | D Tidak Baik |
| 1,0 (semua "Tidak Baik") | 25,00 | D Tidak Baik |

Catatan: jawaban seragam "Baik" (3) → IKM 75 → mutu **C**, sesuai tabel PermenPAN (ambang B mulai NRR ≈ 3,06). Ini perilaku yang benar dari skala 4.

## 7. Pengujian (TDD: RED → GREEN → REFACTOR)

**Backend:**
- `IkmHelperTest`: `hitung_ikm(4,4,4,4)=100`, `(3,3,3,3)=75`, `(2,2,2,2)=50`, `(1,1,1,1)=25`, asimetris `(1,2,3,4)=62.5`. Pastikan `rata5_ke_nrr` sudah tidak ada.
- `SurveiModelTest`: data uji skala 1–4, IKM mengikuti rumus baru.
- `SurveiControllerTest`: nilai `5` ditolak (422), nilai `4` diterima (201), `0` ditolak.

**Frontend:**
- `RatingScale.test.tsx` (baru): render 4 opsi berlabel resmi, `onChange` mengirim 1–4, a11y radiogroup + keyboard.
- Perbarui seluruh test yang berasumsi skala 5 (mis. yang menyentuh `lib/ikm.ts`, dashboard).

## 8. Acceptance Criteria
1. Form survei menampilkan 4 pilihan berlabel resmi (Tidak Baik/Kurang Baik/Baik/Sangat Baik); tidak ada opsi ke-5.
2. Backend menolak nilai > 4 (422) dan menerima 1–4.
3. IKM dihitung `rata-rata(1–4) × 25` tanpa konversi; nilai sesuai tabel Bagian 6.
4. Dashboard (kartu, radar/bar, distribusi, detail petugas) konsisten memakai basis skala 4.
5. Label unsur tampil sesuai Bagian 4 (kolom DB tetap).
6. Tabel `survei` dikosongkan dari data uji sebelum rilis.
7. Seluruh test backend & frontend hijau; tidak ada sisa referensi skala 5 / `rata5*`.

## 9. Di Luar Lingkup (Out of Scope)
- Mengubah 4 unsur menjadi 9 unsur baku PermenPAN (proyek terpisah bila diperlukan).
- Migrasi/konversi nilai mentah data lama 5→4 (ditolak: tidak bijektif, merusak data).
- Perubahan skema kolom unsur.
