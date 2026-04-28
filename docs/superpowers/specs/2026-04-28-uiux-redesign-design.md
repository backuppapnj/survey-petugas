# UI/UX Redesign Spec — Survei PTSP

**Tanggal:** 2026-04-28
**Pendekatan:** Refined Government — Biru Profesional + Animasi Terukur
**Scope:** Full redesign semua halaman (Login, Survei, Dashboard, Petugas, AdminLayout, NotFound)

---

## 1. Sistem Warna (CSS Variables)

### Tema: Biru Profesional Pemerintah

Semua perubahan di `frontend/src/index.css`.

### Light Mode

| Token | Saat Ini | Baru |
|---|---|---|
| `--primary` | `oklch(0.205 0 0)` (hitam) | `oklch(0.45 0.18 255)` (biru navy) |
| `--primary-foreground` | `oklch(0.985 0 0)` | `oklch(0.985 0 0)` (tetap putih) |
| `--accent` | (tidak ada, default ke secondary) | `oklch(0.95 0.03 255)` (biru muda) |
| `--accent-foreground` | `oklch(0.205 0 0)` | `oklch(0.30 0.10 255)` (biru gelap) |
| `--ring` | `oklch(0.708 0 0)` (abu) | `oklch(0.55 0.18 255)` (biru) |
| `--chart-1..4` | sudah berwarna | tetap (sudah bagus) |
| `--chart-5` | `oklch(0.60 0.20 295)` | tetap |
| `--sidebar` | `oklch(0.985 0 0)` (putih) | `oklch(0.17 0.02 260)` (slate gelap) |
| `--sidebar-foreground` | `oklch(0.145 0 0)` | `oklch(0.93 0.01 260)` (teks terang) |
| `--sidebar-primary` | `oklch(0.205 0 0)` (hitam) | `oklch(0.60 0.18 255)` (biru cerah) |
| `--sidebar-primary-foreground` | `oklch(0.985 0 0)` | `oklch(0.985 0 0)` (tetap putih) |
| `--sidebar-accent` | `oklch(0.97 0 0)` (abu terang) | `oklch(0.25 0.04 255)` (biru gelap transparan) |
| `--sidebar-accent-foreground` | `oklch(0.205 0 0)` | `oklch(0.85 0.05 255)` (biru terang) |
| `--sidebar-border` | `oklch(0.922 0 0)` | `oklch(0.30 0.02 260)` (slate border) |
| `--sidebar-ring` | `oklch(0.708 0 0)` | `oklch(0.55 0.18 255)` (biru) |

### Dark Mode

| Token | Saat Ini | Baru |
|---|---|---|
| `--primary` | `oklch(0.922 0 0)` (putih) | `oklch(0.65 0.18 255)` (biru cerah) |
| `--primary-foreground` | `oklch(0.205 0 0)` | `oklch(0.985 0 0)` (tetap putih) |
| `--accent` | `oklch(0.269 0 0)` | `oklch(0.25 0.05 255)` (biru gelap) |
| `--accent-foreground` | `oklch(0.985 0 0)` | `oklch(0.85 0.05 255)` (biru terang) |
| `--ring` | `oklch(0.556 0 0)` | `oklch(0.65 0.20 255)` (biru) |
| `--sidebar` | `oklch(0.205 0 0)` | `oklch(0.13 0.02 260)` (lebih gelap) |
| `--sidebar-primary` | `oklch(0.488 0.243 264.376)` | `oklch(0.65 0.20 255)` (biru cerah) |
| `--sidebar-primary-foreground` | `oklch(0.985 0 0)` | tetap |
| `--sidebar-accent` | `oklch(0.269 0 0)` | `oklch(0.22 0.04 255)` (biru transparan) |
| `--sidebar-accent-foreground` | `oklch(0.985 0 0)` | `oklch(0.85 0.05 255)` |

---

## 2. Sidebar & AdminLayout

File: `frontend/src/components/layout/AdminLayout.tsx`

### Perubahan

- **Sidebar background:** Gradien vertical (slate-900 → slate-800) via Tailwind classes `bg-gradient-to-b from-slate-900 to-slate-800` dark mode sudah dark jadi hanya override light
- **Item aktif:** `bg-blue-500/15 border-l-3 border-blue-500 text-blue-400` (light: `bg-blue-500/10 text-blue-600`)
- **Item non-aktif hover:** `hover:bg-white/5 hover:text-slate-200 border-l-3 border-transparent`
- **Header logo icon:** Background `bg-blue-500/20` + icon `text-blue-400`
- **Avatar di footer:** Background `bg-blue-600` + teks putih
- **Separator borders:** `border-white/8` (subtle pada dark bg)
- **Header bar (sticky top):** `bg-background/80 backdrop-blur-md border-b`

### Catatan

Sidebar shadcn sudah support dark via CSS variables. Kita set `--sidebar*` variables ke dark slate di light mode sehingga sidebar selalu gelap terlepas dari tema.

---

## 3. Dashboard — SummaryCards & Kartu Metrik

File: `frontend/src/components/dashboard/SummaryCards.tsx`

### Perubahan Row 1 (Headline Metrics)

- **Total Responden:** Card background `bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20` + border `border-blue-200 dark:border-blue-800/40`
- **Nilai IKM:** Card background `bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-900/20` + border `border-emerald-200 dark:border-emerald-800/40`. Circular progress: `gaugePrimaryColor="hsl(142,71%,45%)"` (emerald)
- **Mutu Pelayanan:** Card background `bg-gradient-to-br from-emerald-50 to-green-100/50` + border `border-emerald-200`. Grade text: warna kategori (hijau untuk A/B, amber untuk C, rose untuk D)

### Perubahan Row 2 (4 Aspek)

- **Card style:** Background `bg-card`, border-left 3px berwarna per aspek (`border-l-blue-500`, `border-l-emerald-500`, `border-l-amber-500`, `border-l-violet-500`), rounded `rounded-none rounded-r-xl`
- **Label:** Warna sesuai aspek (`text-blue-600`, `text-emerald-600`, `text-amber-600`, `text-violet-600`) + `font-semibold`
- **Progress bar:** Gradient per aspek (`bg-gradient-to-r from-blue-500 to-blue-400`, dst.)
- **Shadow:** `shadow-sm` per kartu

### Micro-interactions

- **MagicCard hover:** `transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md`
- **Progress bar:** Animasi width dari 0 ke target saat mount via CSS transition

---

## 4. Halaman Login

File: `frontend/src/pages/LoginPage.tsx`

### Perubahan

- **Background:** AnimatedGridPattern menggantikan DotPattern. Props: `numSquares={30}`, `maxOpacity={0.1}`, `duration={3}`, className `mask-image:radial-gradient(500px_circle_at_center,white,transparent)`
- **Card:** Border `border-blue-200 dark:border-blue-800/40`, shadow `shadow-lg shadow-blue-500/10`, rounded `rounded-2xl`
- **Top shimmer bar:** Gradient animated bar (3px) di atas card: `bg-gradient-to-r from-blue-500 via-violet-500 to-blue-500 bg-[length:200%_100%] animate-[shimmer_3s_linear_infinite]`
- **Icon container:** `bg-gradient-to-br from-blue-500 to-blue-700` + shadow `shadow-lg shadow-blue-500/30` + rounded `rounded-xl`
- **Judul:** AnimatedGradientText dengan warna `from-blue-700 to-blue-500`
- **Input:** `bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:ring-blue-500/30 focus:border-blue-500`
- **Tombol Login:** `bg-gradient-to-r from-blue-700 to-blue-500 hover:from-blue-800 hover:to-blue-600 shadow-md shadow-blue-500/25`
- **Hapus:** ShineBorder (diganti shimmer bar yang lebih ringan), DotPattern (diganti AnimatedGridPattern)

---

## 5. Halaman Survei Publik

File: `frontend/src/pages/SurveyPage.tsx`

### Perubahan

- **Background:** AnimatedGridPattern menggantikan DotPattern (sama seperti Login)
- **Card:** Border `border-blue-200/80`, shadow `shadow-lg shadow-blue-500/8`, rounded `rounded-2xl`
- **Top shimmer bar:** Sama seperti Login card
- **Avatar:** Background `bg-gradient-to-br from-blue-500 to-blue-700` + shadow `shadow-lg shadow-blue-500/25`
- **Progress bar:** `bg-gradient-to-r from-blue-500 to-blue-400` + tinggi `h-1.5` → `h-2`
- **Star rating:** Bounce animation saat klik (`transition-transform active:scale-90` sudah ada, tambah `motion.div` spring animation)
- **ShimmerButton:** Tetap dipakai, tambahkan CSS custom property `--shimmer-color` untuk override warna shimmer ke biru (shimmer antara blue-500 dan blue-700)
- **Success state:** Tetap hijau + Confetti (sudah bagus)
- **Hapus:** DotPattern (diganti AnimatedGridPattern)

---

## 6. Chart & Tabel

### Chart (BarChartCard, RadarChartCard)

File: `frontend/src/components/dashboard/BarChartCard.tsx`, `RadarChartCard.tsx`

- **Tooltip:** Dark theme — background `hsl(222.2,84%,4.9%)` (slate-950), border `hsl(215,20%,15%)`, warna teks sesuai aspek
- **Bar:** Gradient fill via Recharts `<defs>` + `<linearGradient>` per aspek
- **Legend:** Font-weight 500, warna sesuai aspek
- **Card wrapper:** Border `border-blue-200/50 dark:border-blue-800/30`
- **Empty state:** Icon + teks biru-tinted

### RekapTable

File: `frontend/src/components/dashboard/RekapTable.tsx`

- **Row hover:** `hover:bg-blue-50/50 dark:hover:bg-blue-950/20`
- **Header row:** `bg-slate-50 dark:bg-slate-800/50`
- **Card:** Border `border-blue-200/50 dark:border-blue-800/30`

### DateFilter

File: `frontend/src/components/dashboard/DateFilter.tsx`

- **Preset chip aktif:** `bg-blue-600 hover:bg-blue-700` (primary biru, bukan default)
- **Card:** Border `border-blue-200/50 dark:border-blue-800/30`

### SaranList

File: `frontend/src/components/dashboard/SaranList.tsx`

- **Filter button aktif:** Biru primary
- **Card:** Border `border-blue-200/50 dark:border-blue-800/30`
- **Marquee:** Tambahkan komponen Marquee di atas list saran, menampilkan saran terbaru bergulir

### RatingDistribution

File: `frontend/src/components/dashboard/RatingDistribution.tsx`

- **Card:** Border `border-blue-200/50 dark:border-blue-800/30`
- **Bar warna:** Konsisten dengan chart (gradient per aspek)

---

## 7. PetugasPage

File: `frontend/src/pages/PetugasPage.tsx`

- **Badge Aktif:** `bg-blue-600 text-white hover:bg-blue-700` (bukan default)
- **Badge Non-aktif:** `bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400`
- **Table row hover:** `hover:bg-blue-50/50 dark:hover:bg-blue-950/20`
- **Empty state:** Icon container `bg-blue-50 dark:bg-blue-950/30` + icon `text-blue-500`
- **Tambah button:** Biru primary gradient

---

## 8. NotFoundPage

File: `frontend/src/pages/NotFoundPage.tsx`

- **Background:** HexagonPattern subtle
- **Heading:** AnimatedGradientText biru
- **Back button:** Gradient biru

---

## 9. Komponen MagicUI Baru (6 komponen)

| Komponen | Lokasi Digunakan | Cara Install |
|---|---|---|
| AnimatedGridPattern | Login, Survei | `npx shadcn@latest add "https://magicui.design/r/animated-grid-pattern"` |
| GridPattern | Dashboard header | `npx shadcn@latest add "https://magicui.design/r/grid-pattern"` |
| Marquee | SaranList | `npx shadcn@latest add "https://magicui.design/r/marquee"` |
| AnimatedGradientText | Login judul, Dashboard heading, NotFound | `npx shadcn@latest add "https://magicui.design/r/animated-gradient-text"` |
| AnimatedShinyText | Subheading penting | `npx shadcn@latest add "https://magicui.design/r/animated-shiny-text"` |
| HexagonPattern | NotFound background | `npx shadcn@latest add "https://magicui.design/r/hexagon-pattern"` |

Semua file akan disimpan di `frontend/src/components/ui/` sesuai konvensi shadcn.

---

## 10. Animasi & Transitions

| Komponen | Animasi | Trigger | Implementasi |
|---|---|---|---|
| MagicCard | `translateY(-2px)` + shadow deeper | hover | Tailwind `hover:-translate-y-0.5 hover:shadow-md transition-all duration-200` |
| TableRow | background blue-tinted | hover | Tailwind `hover:bg-blue-50/50 dark:hover:bg-blue-950/20` |
| Star | `scale(1.2)` bounce spring | click | motion.div `whileTap={{ scale: 0.9 }}` |
| Button | `scale(0.97)` + shadow | active | Tailwind `active:scale-[0.97] transition-transform` |
| BlurFade cards | stagger delay per card | page load | BlurFade `delay={0.05 * index}` |
| Tabs content | fade + slideY | tab switch | motion.div `initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}` |
| Dialog | `scale(0.95→1)` + fade | open/close | Sudah di Radix dialog (overlay animation) |
| ProgressBar | width 0→target ease-out | mount | CSS `transition-all duration-700 ease-out` |

---

## 11. File yang Dimodifikasi (Ringkasan)

| File | Perubahan |
|---|---|
| `frontend/src/index.css` | Override semua CSS variables (light + dark) |
| `frontend/src/components/layout/AdminLayout.tsx` | Dark sidebar styling, header backdrop blur |
| `frontend/src/components/dashboard/SummaryCards.tsx` | Gradient card backgrounds, colored borders/labels |
| `frontend/src/components/dashboard/BarChartCard.tsx` | Gradient bars, dark tooltip, themed card |
| `frontend/src/components/dashboard/RadarChartCard.tsx` | Dark tooltip, themed card |
| `frontend/src/components/dashboard/RekapTable.tsx` | Row hover blue, themed card |
| `frontend/src/components/dashboard/DateFilter.tsx` | Blue active preset, themed card |
| `frontend/src/components/dashboard/SaranList.tsx` | Blue filter, Marquee, themed card |
| `frontend/src/components/dashboard/RatingDistribution.tsx` | Themed card |
| `frontend/src/pages/LoginPage.tsx` | AnimatedGridPattern, gradient elements, shimmer bar |
| `frontend/src/pages/SurveyPage.tsx` | AnimatedGridPattern, gradient avatar, shimmer bar |
| `frontend/src/pages/PetugasPage.tsx` | Blue badges, row hover, gradient button |
| `frontend/src/pages/NotFoundPage.tsx` | HexagonPattern, AnimatedGradientText |
| `frontend/src/components/survey/StarRating.tsx` | Bounce animation via motion |

## 12. File Baru (MagicUI components)

- `frontend/src/components/ui/animated-grid-pattern.tsx`
- `frontend/src/components/ui/grid-pattern.tsx`
- `frontend/src/components/ui/marquee.tsx`
- `frontend/src/components/ui/animated-gradient-text.tsx`
- `frontend/src/components/ui/animated-shiny-text.tsx`
- `frontend/src/components/ui/hexagon-pattern.tsx`

---

## 13. Yang Tidak Berubah

- Struktur routing dan navigasi
- Logika bisnis (API calls, state management, filtering, sorting)
- Type definitions
- Backend (CodeIgniter 4)
- Komponen shadcn yang sudah ada (button, card, dialog, dll — styling otomatis mengikuti CSS variables)
- Chart data structure (Recharts)
- Komponen MagicUI yang sudah ada (BlurFade, BorderBeam, DotPattern, NumberTicker, dll — tetap digunakan di tempat yang sesuai)
- Aksesibilitas (aria-label, role, keyboard navigation)
