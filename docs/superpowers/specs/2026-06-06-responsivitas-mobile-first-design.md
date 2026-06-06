# Desain: Penyempurnaan Responsivitas Mobile-First

- **Tanggal:** 2026-06-06
- **Branch:** `feature/responsivitas-mobile-first`
- **Status:** Disetujui (menunggu review spec)
- **Penulis:** Tim (via brainstorming)

## 1. Konteks & Tujuan

Aplikasi Survei Kepuasan PTSP (React 19 + Vite 8 + Tailwind v4 + shadcn/ui) sudah memiliki
fondasi mobile-first yang baik (viewport meta benar, sidebar drawer di HP, chart
`ResponsiveContainer`, pola `flex-col → md:flex-row`). Review komprehensif menemukan
**2 isu fungsional** dan beberapa isu UX di area admin saat diakses dari layar kecil.

Tujuan: memastikan seluruh halaman nyaman dan tidak rusak di **mobile (375px)**,
**tablet (768px)**, dan **desktop (1280px)**, dengan prioritas mobile-first — tanpa
mengubah identitas visual yang sudah ada.

## 2. Ruang Lingkup

### Termasuk
- K-1: Tab Dashboard dapat di-scroll horizontal di layar sempit.
- K-2: Semua dialog dibatasi tinggi & dapat di-scroll di layar pendek.
- P-1: Tap target ≥44px (selektif) untuk kontrol ikon kunci di layar kecil.
- P-2: Kolom "Petugas" pada RekapTable sticky saat scroll horizontal.
- P-3: `min-h-screen` → `min-h-dvh` pada halaman full-screen.
- Minor: DateFilter — tanggal Mulai/Selesai jadi 2 kolom di HP.

### Tidak termasuk (YAGNI)
- Bottom-sheet dialog di mobile.
- Card-view tabel di mobile (tetap tabel + sticky kolom).
- Dropdown-tab di mobile (pakai scroll horizontal).
- Perombakan palet warna, tipografi, atau animasi.
- Refactor yang tidak terkait responsivitas.
- Perubahan tap target pada tabel Petugas (5 kolom, tidak kritis).

## 3. Keputusan Desain

| Isu | Pilihan | Alasan |
|---|---|---|
| K-1 Tab mobile | **Scroll horizontal** (ubah primitif `tabs.tsx`) | Paling ringkas; 1 file menyembuhkan semua `TabsList`; pola familiar |
| K-2 Dialog | **Center + `max-h-[90dvh]` + scroll** (ubah primitif `dialog.tsx`) | 1 file menyembuhkan semua dialog; risiko rendah |
| P-1 Tap target | **Selektif ≥44px via utility `tap-target`** (hanya <768px) | DRY; estetika compact desktop dipertahankan |
| P-2 Tabel | **Sticky kolom Nama** (hanya RekapTable) | Konteks nama tak hilang; kode sedang; tabel desktop tak berubah |

## 4. Perubahan Detail per File

### 4.1 `frontend/src/components/ui/tabs.tsx` (K-1)
Pada `tabsListVariants` (base string, baris ~26), tambahkan agar list dapat
di-scroll horizontal ketika konten melebihi lebar kontainer:
- Tambah: `max-w-full overflow-x-auto`
- Sembunyikan scrollbar: `[scrollbar-width:none] [&::-webkit-scrollbar]:hidden`

Pendekatan arbitrary dipilih (bukan `scrollbar-none` v4.3) agar aman di Tailwind
`^4.2.4` tanpa bergantung versi minor. `w-fit` dipertahankan; kombinasi
`w-fit max-w-full` membuat lebar = `min(konten, 100%)` sehingga di desktop tetap
selebar konten, di HP ter-clamp ke 100% lalu scroll.

### 4.2 `frontend/src/components/ui/dialog.tsx` (K-2)
Pada `DialogContent` (base string, baris ~62), tambahkan:
- `max-h-[90dvh] overflow-y-auto`

`dvh` (dynamic viewport height) mengikuti tinggi viewport saat address-bar mobile
muncul/hilang. Posisi tetap center; konten lebih tinggi dari 90% layar akan
scroll di dalam dialog. Tidak mengubah `DialogFooter`/`DialogHeader`.

### 4.3 `frontend/src/index.css` (P-1)
Tambahkan custom utility (sintaks Tailwind v4 `@utility`):
```css
@utility tap-target {
  /* Area sentuh minimal 44px khusus layar kecil (mobile-first); desktop tetap ringkas. */
  @media (width < 768px) {
    min-height: 2.75rem; /* 44px */
    min-width: 2.75rem;
  }
}
```
*Fallback bila `@media` di dalam `@utility` tidak ter-compile:* pindahkan ke
`@layer utilities { @media (max-width: 767px) { .tap-target { … } } }` (plain CSS,
pasti bekerja). Diverifikasi saat screenshot 375px.

### 4.4 Penerapan `tap-target` pada kontrol ikon kunci (P-1)
Tambahkan `className="tap-target"` (atau gabung ke className yang ada) pada:

| Kontrol | File | Baris (≈) | Ukuran kini |
|---|---|---|---|
| `SidebarTrigger` (buka drawer mobile) | `components/layout/AdminLayout.tsx` | 134 | icon-sm 28px |
| `ThemeToggle` (tombol) | `components/layout/ThemeToggle.tsx` | 33 | icon 32px |
| Menu aksi ⋯ (per baris) | `pages/PetugasPage.tsx` | 283 | icon 32px |
| Pagination prev/next | `pages/PetugasPage.tsx` | 334, 346 | sm 28px |
| Toggle password (👁) | `pages/LoginPage.tsx` | 133 | 32px |
| Salin URL QR | `components/petugas/QrCodeDialog.tsx` | 170 | icon 32px |
| Refresh data (header) | `pages/DashboardPage.tsx` | 242 | sm 28px |
| Reset rentang tanggal | `components/dashboard/DateFilter.tsx` | 188 | sm 28px |

Tombol ber-teks lebar (mis. "Cetak PDF", "Lihat detail", preset tanggal) **tidak**
wajib — lebar horizontalnya sudah memadai; boleh ditambah hanya bila tidak menambah
kompleksitas. Fokus daftar di atas: ikon kecil dengan label `sr-only`.

### 4.5 `frontend/src/components/dashboard/RekapTable.tsx` (P-2)
Kolom pertama "Petugas" (TableHead & TableCell, baris ~139 & ~176):
- Tambah `sticky left-0 z-10` + background solid (`bg-card`; header ikut warna
  header `bg-slate-100/80 dark:bg-slate-900/60`).
- Penanda tepi: `shadow-[1px_0_0_0_var(--border)]` atau border kanan tipis pada sel sticky.
- Catatan hover: warna hover baris (`hover:bg-blue-500/8`) tidak menembus sel sticky
  yang punya bg sendiri — diterima sebagai trade-off minor (konteks > efek hover).

### 4.6 `min-h-screen` → `min-h-dvh` (P-3)
- `pages/SurveyPage.tsx` (baris 113)
- `pages/LoginPage.tsx` (baris 42)
- `pages/NotFoundPage.tsx` (baris 13)
- `App.tsx` — `PageFallback` (baris 18)

### 4.7 `frontend/src/components/dashboard/DateFilter.tsx` (Minor)
Bungkus field tanggal Mulai & Selesai dalam `grid grid-cols-2 gap-3` agar
berdampingan di HP (hemat ruang vertikal), tetap selaras saat `md:flex-row`.

## 5. Strategi Testing (TDD)

Ikuti RED → GREEN → REFACTOR. Mengikuti pola test berbasis kelas yang sudah ada di
`frontend/src/test/theme-colors.test.ts`. Untuk setiap perubahan, tulis test gagal
lebih dulu, lalu implementasi minimal.

Test yang ditambahkan:
- **tabs:** render `TabsList`, assert kelas mengandung `overflow-x-auto`.
- **dialog:** render `DialogContent` terbuka, assert kelas mengandung `overflow-y-auto`
  dan `max-h-[90dvh]`.
- **RekapTable:** assert sel header/sel pertama mengandung `sticky` dan `left-0`.
- **halaman full-screen:** assert kontainer akar memakai `min-h-dvh` (bukan `min-h-screen`).
- **tap-target:** assert kontrol kunci (mis. `SidebarTrigger`, toggle password,
  menu aksi) memuat kelas `tap-target`.
- **DateFilter:** assert wrapper tanggal memuat `grid-cols-2`.

Catatan: test kelas memverifikasi *intent* perubahan; bukti *visual* dipenuhi di §6.
Seluruh suite (`npm run test`) harus hijau tanpa regresi.

## 6. Verifikasi Visual

Jalankan dev server, ambil screenshot pada 3 viewport untuk tiap layar kunci:

| Viewport | Lebar | Layar yang dicek |
|---|---|---|
| Mobile | 375px | Login, Survey, Dashboard (5 tab + buka tab Anomali), Petugas + dialog Form/QR/Detail |
| Tablet | 768px | Dashboard, Petugas |
| Desktop | 1280px | Dashboard, Petugas (pastikan tak ada regresi) |

Kriteria lulus:
- Tab Dashboard dapat di-geser, semua tab terjangkau (375px).
- Dialog Form/Detail/QR tidak terpotong; tombol footer selalu terjangkau (uji juga landscape pendek).
- Kontrol kunci terukur ≥44px di 375px (inspeksi).
- RekapTable: kolom Petugas tetap terlihat saat scroll horizontal.
- Tidak ada scroll horizontal tak disengaja pada `<body>` di 375px.
- Tampilan desktop 1280px tidak berubah dari sebelumnya.

## 7. Risiko & Mitigasi
- **`@utility` + `@media`**: bila tidak ter-compile → fallback `@layer utilities` (§4.3).
- **Sticky + hover**: efek hover hilang pada sel sticky → diterima (trade-off minor).
- **Perubahan primitif** (`tabs`, `dialog`) berdampak ke semua pemakai → mitigasi:
  pemakai saat ini terbatas (tab hanya Dashboard; dialog Form/Detail/QR), diverifikasi via screenshot.

## 8. Kriteria Keberhasilan
1. Semua test (lama + baru) hijau.
2. Keenam butir verifikasi visual (§6) terpenuhi pada 375/768/1280px.
3. Tidak ada regresi visual di desktop.
4. Lint (`npm run lint`) bersih.
