# Penyempurnaan Responsivitas Mobile-First — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Memastikan seluruh halaman aplikasi Survei PTSP nyaman & tidak rusak di mobile/tablet/desktop, dengan prioritas mobile-first, tanpa mengubah identitas visual.

**Architecture:** Perbaikan ber-leverage di komponen primitif shadcn (`tabs.tsx`, `dialog.tsx`) + utility `tap-target` (DRY) + penyesuaian terlokalisir (RekapTable sticky, `min-h-dvh`, DateFilter grid). TDD berbasis assertion className (Tailwind tidak diproses jsdom) & regex file-content untuk CSS — mengikuti pola [theme-colors.test.ts](../../../frontend/src/test/theme-colors.test.ts).

**Tech Stack:** React 19, TypeScript, Vite 8, Tailwind CSS v4, shadcn/ui (radix-ui), Vitest + Testing Library + jsdom.

**Working directory:** Semua perintah dijalankan dari `frontend/`. Branch: `feature/responsivitas-mobile-first`.

**Spec:** [docs/superpowers/specs/2026-06-06-responsivitas-mobile-first-design.md](../specs/2026-06-06-responsivitas-mobile-first-design.md)

---

### Task 0: Baseline hijau

**Files:** — (verifikasi saja)

- [ ] **Step 1: Pastikan suite & lint hijau sebelum mulai**

Run (dari `frontend/`):
```bash
npm run test && npm run lint
```
Expected: semua test PASS, lint tanpa error. Jika ada yang merah sejak awal, hentikan & laporkan — jangan lanjut di atas baseline merah.

---

### Task 1: TabsList dapat di-scroll horizontal (K-1)

**Files:**
- Modify: `frontend/src/components/ui/tabs.tsx` (string base `tabsListVariants`, ~baris 26)
- Test: `frontend/src/components/ui/tabs.test.tsx` (create)

- [ ] **Step 1: Tulis test gagal**

Buat `frontend/src/components/ui/tabs.test.tsx`:
```tsx
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Tabs, TabsList, TabsTrigger } from './tabs'

describe('TabsList responsif (mobile-first)', () => {
  it('dapat di-scroll horizontal saat tab melebihi lebar (overflow-x-auto + max-w-full)', () => {
    const { container } = render(
      <Tabs defaultValue="a">
        <TabsList>
          <TabsTrigger value="a">Ringkasan</TabsTrigger>
          <TabsTrigger value="b">Distribusi Rating</TabsTrigger>
          <TabsTrigger value="c">Tabel Detail</TabsTrigger>
        </TabsList>
      </Tabs>,
    )
    const list = container.querySelector('[data-slot="tabs-list"]')
    expect(list).not.toBeNull()
    expect(list!.className).toContain('overflow-x-auto')
    expect(list!.className).toContain('max-w-full')
  })
})
```

- [ ] **Step 2: Jalankan test, pastikan GAGAL**

Run: `npx vitest run src/components/ui/tabs.test.tsx`
Expected: FAIL (`overflow-x-auto` belum ada di className).

- [ ] **Step 3: Implementasi minimal**

Di `tabs.tsx`, pada string pertama `tabsListVariants` (saat ini):
```
"group/tabs-list inline-flex w-fit items-center justify-center rounded-lg p-[3px] text-muted-foreground group-data-horizontal/tabs:h-8 group-data-vertical/tabs:h-fit group-data-vertical/tabs:flex-col data-[variant=line]:rounded-none"
```
Ubah menjadi (tambah `max-w-full`, `overflow-x-auto`, sembunyikan scrollbar):
```
"group/tabs-list inline-flex w-fit max-w-full items-center justify-center overflow-x-auto rounded-lg p-[3px] text-muted-foreground group-data-horizontal/tabs:h-8 group-data-vertical/tabs:h-fit group-data-vertical/tabs:flex-col data-[variant=line]:rounded-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
```

- [ ] **Step 4: Jalankan test, pastikan LULUS**

Run: `npx vitest run src/components/ui/tabs.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/tabs.tsx src/components/ui/tabs.test.tsx
git commit -m "fix(tabs): TabsList scroll horizontal di layar sempit (K-1)"
```

---

### Task 2: DialogContent dibatasi tinggi & dapat di-scroll (K-2)

**Files:**
- Modify: `frontend/src/components/ui/dialog.tsx` (string base `DialogContent`, ~baris 62)
- Test: `frontend/src/components/ui/dialog.test.tsx` (create)

- [ ] **Step 1: Tulis test gagal**

Buat `frontend/src/components/ui/dialog.test.tsx`:
```tsx
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Dialog, DialogContent, DialogTitle } from './dialog'

describe('DialogContent responsif (mobile-first)', () => {
  it('membatasi tinggi 90dvh & dapat di-scroll di layar pendek', () => {
    render(
      <Dialog open onOpenChange={() => {}}>
        <DialogContent>
          <DialogTitle>Judul</DialogTitle>
        </DialogContent>
      </Dialog>,
    )
    // DialogContent dirender lewat Portal ke document.body
    const content = document.querySelector('[data-slot="dialog-content"]')
    expect(content).not.toBeNull()
    expect(content!.className).toContain('overflow-y-auto')
    expect(content!.className).toContain('max-h-[90dvh]')
  })
})
```

- [ ] **Step 2: Jalankan test, pastikan GAGAL**

Run: `npx vitest run src/components/ui/dialog.test.tsx`
Expected: FAIL (`max-h-[90dvh]` belum ada).

- [ ] **Step 3: Implementasi minimal**

Di `dialog.tsx`, pada string base `DialogContent`, sisipkan `max-h-[90dvh] overflow-y-auto` tepat setelah `gap-4`. Sebelum:
```
"fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl bg-popover p-4 ...
```
Sesudah:
```
"fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 max-h-[90dvh] overflow-y-auto rounded-xl bg-popover p-4 ...
```
(sisanya tidak diubah).

- [ ] **Step 4: Jalankan test, pastikan LULUS**

Run: `npx vitest run src/components/ui/dialog.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/dialog.tsx src/components/ui/dialog.test.tsx
git commit -m "fix(dialog): DialogContent max-h-[90dvh] + scroll di layar pendek (K-2)"
```

---

### Task 3: Definisi utility `tap-target` (P-1a)

**Files:**
- Modify: `frontend/src/index.css` (tambah setelah blok `@layer base { … }`, sebelum `@media print`)
- Test: `frontend/src/test/tap-target.test.ts` (create)

- [ ] **Step 1: Tulis test gagal (regex file-content, pola theme-colors)**

Buat `frontend/src/test/tap-target.test.ts`:
```ts
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const css = readFileSync(resolve(process.cwd(), 'src/index.css'), 'utf8')

describe('utility tap-target', () => {
  it('terdefinisi sebagai @utility', () => {
    expect(css).toMatch(/@utility\s+tap-target\s*\{/)
  })
  it('menetapkan area sentuh 44px (2.75rem) hanya pada layar kecil (<768px)', () => {
    expect(css).toContain('2.75rem')
    expect(css).toMatch(/width\s*<\s*768px|max-width:\s*767px/)
  })
})
```

- [ ] **Step 2: Jalankan test, pastikan GAGAL**

Run: `npx vitest run src/test/tap-target.test.ts`
Expected: FAIL (`@utility tap-target` belum ada).

- [ ] **Step 3: Implementasi minimal**

Di `index.css`, tepat setelah blok `@layer base { … }` ditutup (sebelum `@media print {`), tambahkan:
```css
/* Area sentuh minimal 44px khusus layar kecil (mobile-first); desktop tetap ringkas. */
@utility tap-target {
  @media (width < 768px) {
    min-height: 2.75rem; /* 44px */
    min-width: 2.75rem;
  }
}
```

- [ ] **Step 4: Jalankan test + pastikan dev build memproses CSS**

Run: `npx vitest run src/test/tap-target.test.ts`
Expected: PASS.

Lalu verifikasi Tailwind v4 meng-compile utility tanpa error:
```bash
npm run build
```
Expected: build sukses. **Jika** muncul error CSS terkait `@utility`/`@media`, terapkan fallback: ganti blok di atas menjadi
```css
@layer utilities {
  @media (max-width: 767px) {
    .tap-target { min-height: 2.75rem; min-width: 2.75rem; }
  }
}
```
lalu jalankan ulang `npm run build` (test Step 1 tetap lulus karena memuat `2.75rem` & `767px`).

- [ ] **Step 5: Commit**

```bash
git add src/index.css src/test/tap-target.test.ts
git commit -m "feat(css): utility tap-target >=44px untuk layar kecil (P-1a)"
```

---

### Task 4: Terapkan `tap-target` pada kontrol komponen kecil (P-1b)

**Files:**
- Modify: `frontend/src/components/layout/ThemeToggle.tsx:33`
- Modify: `frontend/src/components/petugas/QrCodeDialog.tsx:170` (tombol salin URL)
- Test: `frontend/src/components/layout/ThemeToggle.test.tsx` (create)
- Test: `frontend/src/components/petugas/QrCodeDialog.test.tsx` (tambah 1 `it`)

- [ ] **Step 1: Tulis test gagal**

Buat `frontend/src/components/layout/ThemeToggle.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import { ThemeProvider } from 'next-themes'
import { describe, expect, it } from 'vitest'
import { ThemeToggle } from './ThemeToggle'

describe('ThemeToggle', () => {
  it('tombol ubah tema punya area sentuh nyaman (tap-target)', () => {
    render(
      <ThemeProvider attribute="class">
        <ThemeToggle />
      </ThemeProvider>,
    )
    expect(screen.getByRole('button', { name: /ubah tema/i })).toHaveClass('tap-target')
  })
})
```

Tambahkan `it` baru ke `frontend/src/components/petugas/QrCodeDialog.test.tsx` (di dalam `describe('QrCodeDialog', …)`):
```tsx
  it('tombol salin URL punya area sentuh nyaman (tap-target)', () => {
    render(<QrCodeDialog open onOpenChange={() => {}} petugas={petugas} />)
    expect(screen.getByRole('button', { name: /salin url/i })).toHaveClass('tap-target')
  })
```

- [ ] **Step 2: Jalankan test, pastikan GAGAL**

Run: `npx vitest run src/components/layout/ThemeToggle.test.tsx src/components/petugas/QrCodeDialog.test.tsx`
Expected: 2 test baru FAIL (class `tap-target` belum ada).

- [ ] **Step 3: Implementasi minimal**

`ThemeToggle.tsx:33` — tambahkan `className="tap-target"`:
```tsx
<Button variant="ghost" size="icon" aria-label="Ubah tema" className="tap-target">
```

`QrCodeDialog.tsx:170` — tambahkan `className="tap-target"` pada tombol salin:
```tsx
<Button
  type="button"
  variant="outline"
  size="icon"
  onClick={handleCopy}
  aria-label="Salin URL"
  className="tap-target"
>
```

- [ ] **Step 4: Jalankan test, pastikan LULUS**

Run: `npx vitest run src/components/layout/ThemeToggle.test.tsx src/components/petugas/QrCodeDialog.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/ThemeToggle.tsx src/components/layout/ThemeToggle.test.tsx src/components/petugas/QrCodeDialog.tsx src/components/petugas/QrCodeDialog.test.tsx
git commit -m "fix(a11y): tap-target pada ThemeToggle & salin URL QR (P-1b)"
```

---

### Task 5: Terapkan `tap-target` pada kontrol di halaman (P-1c)

**Files:**
- Modify: `frontend/src/pages/LoginPage.tsx:130-135` (toggle password)
- Modify: `frontend/src/pages/PetugasPage.tsx:283` (menu aksi ⋯), `:332-352` (pagination prev & next)
- Modify: `frontend/src/pages/DashboardPage.tsx:240-249` (tombol refresh)
- Modify: `frontend/src/components/layout/AdminLayout.tsx:134` (SidebarTrigger)
- Test: `frontend/src/pages/LoginPage.test.tsx` (tambah 1 `it`)
- Test: `frontend/src/pages/PetugasPage.test.tsx` (tambah 1 `it`)

- [ ] **Step 1: Tulis test gagal**

Tambahkan `it` ke `frontend/src/pages/LoginPage.test.tsx` (di dalam `describe('LoginPage', …)`):
```tsx
  it('tombol tampilkan password punya area sentuh nyaman (tap-target)', () => {
    renderPage()
    expect(screen.getByRole('button', { name: /tampilkan kata sandi/i })).toHaveClass('tap-target')
  })
```

Tambahkan `it` ke `frontend/src/pages/PetugasPage.test.tsx` (di dalam `describe('PetugasPage', …)`):
```tsx
  it('tombol menu aksi per baris punya area sentuh nyaman (tap-target)', async () => {
    vi.spyOn(apiModule, 'getAdminPetugas').mockResolvedValue(fakePetugas)
    render(
      <MemoryRouter>
        <PetugasPage />
      </MemoryRouter>,
    )
    const aksi = await screen.findByRole('button', { name: /aksi untuk budi/i })
    expect(aksi).toHaveClass('tap-target')
  })
```

- [ ] **Step 2: Jalankan test, pastikan GAGAL**

Run: `npx vitest run src/pages/LoginPage.test.tsx src/pages/PetugasPage.test.tsx`
Expected: 2 test baru FAIL.

- [ ] **Step 3: Implementasi minimal**

`LoginPage.tsx` — tombol toggle password (`<button type="button" onClick={() => setShowPassword…}`), tambahkan `tap-target` di awal daftar className-nya:
```tsx
className="tap-target absolute top-1/2 right-1.5 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-blue-500/10 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:text-blue-300"
```

`PetugasPage.tsx:283` — menu aksi:
```tsx
<Button variant="ghost" size="icon" aria-label={`Aksi untuk ${p.nama}`} className="tap-target">
```

`PetugasPage.tsx` — kedua tombol pagination (prev & next), tambahkan `className="tap-target"`:
```tsx
<Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage === 1} className="tap-target">
…
<Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(pageCount, p + 1))} disabled={safePage === pageCount} className="tap-target">
```

`DashboardPage.tsx` — tombol refresh (`variant="ghost" size="sm" onClick={() => fetchData(false)}`), tambahkan `className="tap-target"`:
```tsx
<Button variant="ghost" size="sm" onClick={() => fetchData(false)} disabled={refreshing} title="Muat ulang data" className="tap-target">
```

`AdminLayout.tsx:134` — SidebarTrigger:
```tsx
<SidebarTrigger className="tap-target" />
```

- [ ] **Step 4: Jalankan test, pastikan LULUS**

Run: `npx vitest run src/pages/LoginPage.test.tsx src/pages/PetugasPage.test.tsx`
Expected: PASS. (Refresh, pagination prev/next, & SidebarTrigger diverifikasi visual di Task 9.)

- [ ] **Step 5: Commit**

```bash
git add src/pages/LoginPage.tsx src/pages/LoginPage.test.tsx src/pages/PetugasPage.tsx src/pages/PetugasPage.test.tsx src/pages/DashboardPage.tsx src/components/layout/AdminLayout.tsx
git commit -m "fix(a11y): tap-target pada kontrol kunci halaman admin (P-1c)"
```

---

### Task 6: RekapTable — kolom Petugas sticky (P-2)

**Files:**
- Modify: `frontend/src/components/dashboard/RekapTable.tsx:139` (TableHead pertama) & `:176` (TableCell pertama)
- Test: `frontend/src/components/dashboard/RekapTable.test.tsx` (create)

- [ ] **Step 1: Tulis test gagal**

Buat `frontend/src/components/dashboard/RekapTable.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { RekapTable } from './RekapTable'
import type { RekapPerPetugas } from '@/types'

const data: RekapPerPetugas[] = [
  {
    petugas_id: 1,
    nama: 'Budi',
    foto_url: null,
    total_responden: 12,
    rata_rata: { kecepatan: 3.8, keramahan: 3.9, informasi: 4, kenyamanan: 3.7 },
  },
]

describe('RekapTable sticky kolom Petugas (P-2)', () => {
  it('sel nama petugas sticky di kiri saat scroll horizontal', () => {
    render(<RekapTable data={data} />)
    const cell = screen.getByText('Budi').closest('td')
    expect(cell).not.toBeNull()
    expect(cell!.className).toContain('sticky')
    expect(cell!.className).toContain('left-0')
  })
})
```
(Tipe terverifikasi: `RekapPerPetugas = { petugas_id, nama, foto_url: string|null, total_responden, rata_rata: RataRata }`, `RataRata = { kecepatan, keramahan, informasi, kenyamanan }`.)

- [ ] **Step 2: Jalankan test, pastikan GAGAL**

Run: `npx vitest run src/components/dashboard/RekapTable.test.tsx`
Expected: FAIL (`sticky` belum ada).

- [ ] **Step 3: Implementasi minimal**

`RekapTable.tsx:139` — TableHead pertama (kolom Petugas), beri sticky + background header + penanda tepi:
```tsx
<TableHead className="sticky left-0 z-20 bg-slate-100/80 shadow-[1px_0_0_0_var(--border)] dark:bg-slate-900/60">
  {sortHeader('nama', 'Petugas')}
</TableHead>
```

`RekapTable.tsx:176` — TableCell pertama (nama), beri sticky + background solid:
```tsx
<TableCell className="sticky left-0 z-10 bg-card shadow-[1px_0_0_0_var(--border)]">
  <div className="flex items-center gap-2">
    <Avatar className="size-8">
      <AvatarImage src={p.foto_url ?? undefined} alt={p.nama} />
      <AvatarFallback>{p.nama.charAt(0)}</AvatarFallback>
    </Avatar>
    <span className="font-medium">{p.nama}</span>
  </div>
</TableCell>
```

- [ ] **Step 4: Jalankan test, pastikan LULUS**

Run: `npx vitest run src/components/dashboard/RekapTable.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/dashboard/RekapTable.tsx src/components/dashboard/RekapTable.test.tsx
git commit -m "fix(table): kolom Petugas sticky saat scroll horizontal (P-2)"
```

---

### Task 7: `min-h-screen` → `min-h-dvh` pada halaman full-screen (P-3)

**Files:**
- Modify: `frontend/src/pages/SurveyPage.tsx:113`, `frontend/src/pages/LoginPage.tsx:42`, `frontend/src/pages/NotFoundPage.tsx:13`, `frontend/src/App.tsx:18`
- Test: `frontend/src/pages/LoginPage.test.tsx` (tambah 1 `it`)

- [ ] **Step 1: Tulis test gagal**

Tambahkan `it` ke `frontend/src/pages/LoginPage.test.tsx`:
```tsx
  it('kontainer halaman memakai min-h-dvh (mobile address-bar friendly)', () => {
    const { container } = renderPage()
    const root = container.firstChild as HTMLElement
    expect(root.className).toContain('min-h-dvh')
    expect(root.className).not.toContain('min-h-screen')
  })
```

- [ ] **Step 2: Jalankan test, pastikan GAGAL**

Run: `npx vitest run src/pages/LoginPage.test.tsx`
Expected: test baru FAIL (masih `min-h-screen`).

- [ ] **Step 3: Implementasi minimal**

Ganti `min-h-screen` → `min-h-dvh` pada keempat lokasi (hanya token kelas itu, sisanya tetap):
- `SurveyPage.tsx:113` — `className="relative flex min-h-dvh w-full items-center justify-center overflow-hidden …"`
- `LoginPage.tsx:42` — `className="relative flex min-h-dvh w-full items-center justify-center overflow-hidden …"`
- `NotFoundPage.tsx:13` — `className="relative flex min-h-dvh items-center justify-center overflow-hidden …"`
- `App.tsx:18` (PageFallback) — `className="flex min-h-dvh items-center justify-center text-muted-foreground"`

- [ ] **Step 4: Jalankan test, pastikan LULUS**

Run: `npx vitest run src/pages/LoginPage.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/pages/SurveyPage.tsx src/pages/LoginPage.tsx src/pages/NotFoundPage.tsx src/App.tsx src/pages/LoginPage.test.tsx
git commit -m "fix(layout): min-h-dvh ganti min-h-screen di halaman full-screen (P-3)"
```

---

### Task 8: DateFilter — tanggal 2 kolom di HP + tap-target reset (Minor + P-1)

**Files:**
- Modify: `frontend/src/components/dashboard/DateFilter.tsx:144-166` (wrapper tanggal) & `:188` (tombol reset)
- Test: `frontend/src/components/dashboard/DateFilter.test.tsx` (create)

- [ ] **Step 1: Tulis test gagal**

Buat `frontend/src/components/dashboard/DateFilter.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DateFilter } from './DateFilter'

const noop = () => {}

describe('DateFilter responsif (mobile-first)', () => {
  it('menata tanggal Mulai & Selesai dalam 2 kolom di layar kecil', () => {
    const { container } = render(
      <DateFilter start="2026-06-01" end="2026-06-06" onStartChange={noop} onEndChange={noop} onExport={noop} />,
    )
    const grid = container.querySelector('.grid-cols-2')
    expect(grid).not.toBeNull()
    expect(grid!.querySelector('#start')).not.toBeNull()
    expect(grid!.querySelector('#end')).not.toBeNull()
  })

  it('tombol reset punya area sentuh nyaman (tap-target)', () => {
    render(
      <DateFilter start="2026-06-01" end="2026-06-06" onStartChange={noop} onEndChange={noop} onExport={noop} />,
    )
    expect(screen.getByRole('button', { name: /reset/i })).toHaveClass('tap-target')
  })
})
```

- [ ] **Step 2: Jalankan test, pastikan GAGAL**

Run: `npx vitest run src/components/dashboard/DateFilter.test.tsx`
Expected: 2 test FAIL.

- [ ] **Step 3: Implementasi minimal**

Di `DateFilter.tsx`, bungkus DUA blok `<div className="space-y-1">` (field "Mulai" dan "Selesai") dalam satu wrapper grid. Sebelum:
```tsx
      <div className="flex flex-col gap-3 md:flex-row md:items-end">
        <div className="space-y-1">
          <Label htmlFor="start">Mulai</Label>
          <Input id="start" type="date" … />
        </div>
        <div className="space-y-1">
          <Label htmlFor="end">Selesai</Label>
          <Input id="end" type="date" … />
        </div>
```
Sesudah (tambahkan wrapper `grid grid-cols-2` yang menjadi `md:contents` agar di desktop kembali sejajar dalam flex-row induk):
```tsx
      <div className="flex flex-col gap-3 md:flex-row md:items-end">
        <div className="grid grid-cols-2 gap-3 md:contents">
          <div className="space-y-1">
            <Label htmlFor="start">Mulai</Label>
            <Input id="start" type="date" … />
          </div>
          <div className="space-y-1">
            <Label htmlFor="end">Selesai</Label>
            <Input id="end" type="date" … />
          </div>
        </div>
```
(Tutup `</div>` wrapper tambahan tepat setelah blok "Selesai". Bagian Unit Kerja & tombol tetap di luar wrapper, tidak diubah.)

Tombol reset (`DateFilter.tsx:188`) — tambahkan `tap-target`:
```tsx
<Button onClick={reset} variant="ghost" size="sm" type="button" title="Reset ke 30 hari terakhir" className="tap-target">
```

- [ ] **Step 4: Jalankan test, pastikan LULUS**

Run: `npx vitest run src/components/dashboard/DateFilter.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/dashboard/DateFilter.tsx src/components/dashboard/DateFilter.test.tsx
git commit -m "fix(datefilter): tanggal 2 kolom di HP + tap-target reset (Minor/P-1)"
```

---

### Task 9: Verifikasi penuh — suite, lint, & screenshot multi-viewport

**Files:** — (verifikasi, tanpa perubahan kode kecuali perbaikan regresi)

- [ ] **Step 1: Seluruh suite & lint hijau**

Run (dari `frontend/`):
```bash
npm run test && npm run lint
```
Expected: semua PASS, lint bersih. Perbaiki regresi bila ada, lalu jalankan ulang.

- [ ] **Step 2: Build produksi sukses**

Run: `npm run build`
Expected: sukses (memastikan `@utility tap-target` & arbitrary class ter-compile).

- [ ] **Step 3: Verifikasi visual multi-viewport**

Jalankan dev server (`npm run dev`) lalu gunakan skill `chrome-devtools` / `webapp-testing` untuk screenshot pada **375px**, **768px**, **1280px**:
- `/login` — kartu rapi, toggle password mudah disentuh.
- `/survey/<token-dummy>` — tampilan "petugas tidak ditemukan" tidak terpotong; uji juga viewport landscape pendek (mis. 667×375).
- `/dashboard` — TabsList dapat di-geser di 375px, semua 5 tab terjangkau (buka tab "Anomali" & "Tabel Detail"); kolom Petugas RekapTable tetap terlihat saat scroll horizontal.
- `/petugas` — buka dialog Tambah/Edit, QR, dan Detail; pastikan tidak terpotong & tombol footer terjangkau (uji landscape pendek). Menu aksi ⋯ & pagination nyaman disentuh.

Kriteria lulus (sesuai spec §6): tidak ada scroll horizontal `<body>` tak disengaja di 375px; kontrol kunci ≥44px di 375px; dialog & tab fungsional; desktop 1280px tidak berubah.

- [ ] **Step 4: Commit dokumentasi hasil (opsional)**

Jika menyimpan screenshot/catatan verifikasi, commit:
```bash
git add docs/superpowers/plans/2026-06-06-responsivitas-mobile-first.md
git commit -m "docs: catatan verifikasi visual responsivitas mobile-first"
```

---

## Self-Review (diisi penulis plan)

**1. Spec coverage:**
- K-1 → Task 1 ✓ · K-2 → Task 2 ✓ · P-1 (utility) → Task 3 ✓ · P-1 (terapan) → Task 4 & 5 & 8 ✓ · P-2 → Task 6 ✓ · P-3 → Task 7 ✓ · DateFilter grid → Task 8 ✓ · Verifikasi visual §6 → Task 9 ✓.
- Tap-target kontrol "sr-only": SidebarTrigger, ThemeToggle, menu aksi, pagination, password, salin QR, refresh, reset — semua tercakup (Task 4/5/8); SidebarTrigger & refresh & pagination prev/next diverifikasi visual (Task 9) karena render halaman kompleks.

**2. Placeholder scan:** Tidak ada TBD/TODO; setiap step memuat kode/perintah konkret & expected output.

**3. Type consistency:** Nama kelas konsisten (`tap-target`, `overflow-x-auto`, `overflow-y-auto`, `max-h-[90dvh]`, `sticky`, `left-0`, `min-h-dvh`, `grid-cols-2`); `data-slot` mengikuti shadcn (`tabs-list`, `dialog-content`); aria-label sesuai kode sumber (`/ubah tema/i`, `/salin url/i`, `/tampilkan kata sandi/i`, `/aksi untuk budi/i`, `/reset/i`).
