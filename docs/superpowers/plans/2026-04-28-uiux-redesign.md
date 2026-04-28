# UI/UX Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform Survei PTSP UI from monochrome/rigid to modern blue-professional theme with dark sidebar, colored metric cards, gradient elements, 6 new MagicUI components, and 8 micro-interactions.

**Architecture:** CSS variable overrides drive the theme change across all shadcn components. New MagicUI components installed via shadcn CLI. Motion library (already installed) powers interactive animations. All changes are visual/styling only — no business logic changes.

**Tech Stack:** React 19, Tailwind CSS v4, shadcn/ui, MagicUI, motion (framer-motion), Radix UI, Recharts, Vitest + Testing Library

**Design Spec:** `docs/superpowers/specs/2026-04-28-uiux-redesign-design.md`

---

## File Structure

### Modified Files
| File | Responsibility |
|---|---|
| `frontend/src/index.css` | All CSS variable overrides (light + dark) |
| `frontend/src/components/layout/AdminLayout.tsx` | Dark sidebar styling, header backdrop blur |
| `frontend/src/components/dashboard/SummaryCards.tsx` | Gradient card backgrounds, colored borders/labels |
| `frontend/src/components/dashboard/BarChartCard.tsx` | Gradient bars, dark tooltip, themed card |
| `frontend/src/components/dashboard/RadarChartCard.tsx` | Dark tooltip, themed card |
| `frontend/src/components/dashboard/RekapTable.tsx` | Row hover blue, themed card |
| `frontend/src/components/dashboard/DateFilter.tsx` | Blue active preset, themed card |
| `frontend/src/components/dashboard/SaranList.tsx` | Blue filter, Marquee, themed card |
| `frontend/src/components/dashboard/RatingDistribution.tsx` | Themed card, gradient bars |
| `frontend/src/pages/LoginPage.tsx` | AnimatedGridPattern, gradient elements, shimmer bar |
| `frontend/src/pages/SurveyPage.tsx` | AnimatedGridPattern, gradient avatar, shimmer bar |
| `frontend/src/pages/PetugasPage.tsx` | Blue badges, row hover, gradient button |
| `frontend/src/pages/NotFoundPage.tsx` | HexagonPattern, AnimatedGradientText |
| `frontend/src/components/survey/StarRating.tsx` | Bounce animation via motion |

### New Files (MagicUI components via CLI)
| File | Source |
|---|---|
| `frontend/src/components/ui/animated-grid-pattern.tsx` | `npx shadcn@latest add "https://magicui.design/r/animated-grid-pattern"` |
| `frontend/src/components/ui/grid-pattern.tsx` | `npx shadcn@latest add "https://magicui.design/r/grid-pattern"` |
| `frontend/src/components/ui/marquee.tsx` | `npx shadcn@latest add "https://magicui.design/r/marquee"` |
| `frontend/src/components/ui/animated-gradient-text.tsx` | `npx shadcn@latest add "https://magicui.design/r/animated-gradient-text"` |
| `frontend/src/components/ui/animated-shiny-text.tsx` | `npx shadcn@latest add "https://magicui.design/r/animated-shiny-text"` |
| `frontend/src/components/ui/hexagon-pattern.tsx` | `npx shadcn@latest add "https://magicui.design/r/hexagon-pattern"` |

---

## Task 1: Install 6 MagicUI Components

**Files:**
- Create: `frontend/src/components/ui/animated-grid-pattern.tsx`
- Create: `frontend/src/components/ui/grid-pattern.tsx`
- Create: `frontend/src/components/ui/marquee.tsx`
- Create: `frontend/src/components/ui/animated-gradient-text.tsx`
- Create: `frontend/src/components/ui/animated-shiny-text.tsx`
- Create: `frontend/src/components/ui/hexagon-pattern.tsx`

- [ ] **Step 1: Install animated-grid-pattern**

Run:
```bash
cd /home/moohard/dev/project/survey-petugas/frontend && npx shadcn@latest add "https://magicui.design/r/animated-grid-pattern"
```
Expected: File created at `src/components/ui/animated-grid-pattern.tsx`

- [ ] **Step 2: Install grid-pattern**

Run:
```bash
cd /home/moohard/dev/project/survey-petugas/frontend && npx shadcn@latest add "https://magicui.design/r/grid-pattern"
```
Expected: File created at `src/components/ui/grid-pattern.tsx`

- [ ] **Step 3: Install marquee**

Run:
```bash
cd /home/moohard/dev/project/survey-petugas/frontend && npx shadcn@latest add "https://magicui.design/r/marquee"
```
Expected: File created at `src/components/ui/marquee.tsx`

- [ ] **Step 4: Install animated-gradient-text**

Run:
```bash
cd /home/moohard/dev/project/survey-petugas/frontend && npx shadcn@latest add "https://magicui.design/r/animated-gradient-text"
```
Expected: File created at `src/components/ui/animated-gradient-text.tsx`

- [ ] **Step 5: Install animated-shiny-text**

Run:
```bash
cd /home/moohard/dev/project/survey-petugas/frontend && npx shadcn@latest add "https://magicui.design/r/animated-shiny-text"
```
Expected: File created at `src/components/ui/animated-shiny-text.tsx`

- [ ] **Step 6: Install hexagon-pattern**

Run:
```bash
cd /home/moohard/dev/project/survey-petugas/frontend && npx shadcn@latest add "https://magicui.design/r/hexagon-pattern"
```
Expected: File created at `src/components/ui/hexagon-pattern.tsx`

- [ ] **Step 7: Verify all components exist and TypeScript compiles**

Run:
```bash
cd /home/moohard/dev/project/survey-petugas/frontend && npx tsc --noEmit 2>&1 | head -20
```
Expected: No errors (or only pre-existing errors unrelated to new components)

- [ ] **Step 8: Commit**

```bash
git add frontend/src/components/ui/animated-grid-pattern.tsx frontend/src/components/ui/grid-pattern.tsx frontend/src/components/ui/marquee.tsx frontend/src/components/ui/animated-gradient-text.tsx frontend/src/components/ui/animated-shiny-text.tsx frontend/src/components/ui/hexagon-pattern.tsx
git commit -m "feat: install 6 komponen MagicUI baru (animated-grid-pattern, grid-pattern, marquee, animated-gradient-text, animated-shiny-text, hexagon-pattern)"
```

---

## Task 2: Override CSS Variables — Blue Professional Theme

**Files:**
- Modify: `frontend/src/index.css`

This is the most impactful single change — it transforms the entire app's color palette via CSS variables that all shadcn components consume.

- [ ] **Step 1: Write test that verifies CSS variables are set correctly**

Create `frontend/src/test/theme-colors.test.ts`:

```typescript
import { describe, expect, it } from 'vitest'

describe('CSS theme variables', () => {
  it('light mode primary menggunakan hue biru (oklch chroma > 0)', () => {
    const style = getComputedStyle(document.documentElement)
    const primary = style.getPropertyValue('--primary').trim()
    // oklch(0.45 0.18 255) — chroma 0.18 > 0 berarti ada warna
    const match = primary.match(/oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)/)
    expect(match).not.toBeNull()
    const chroma = parseFloat(match![2])
    expect(chroma).toBeGreaterThan(0)
  })

  it('light mode sidebar menggunakan background gelap', () => {
    const style = getComputedStyle(document.documentElement)
    const sidebar = style.getPropertyValue('--sidebar').trim()
    const match = sidebar.match(/oklch\(([\d.]+)/)
    expect(match).not.toBeNull()
    const lightness = parseFloat(match![1])
    expect(lightness).toBeLessThan(0.3)
  })

  it('light mode sidebar-primary menggunakan hue biru', () => {
    const style = getComputedStyle(document.documentElement)
    const sp = style.getPropertyValue('--sidebar-primary').trim()
    const match = sp.match(/oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)/)
    expect(match).not.toBeNull()
    const chroma = parseFloat(match![2])
    expect(chroma).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /home/moohard/dev/project/survey-petugas/frontend && npx vitest run src/test/theme-colors.test.ts`
Expected: FAIL — current primary is `oklch(0.205 0 0)` with chroma 0

- [ ] **Step 3: Override CSS variables in index.css**

In `frontend/src/index.css`, replace the `:root { ... }` block with updated values. Key changes:

```css
:root {
  color-scheme: light dark;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;

  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0 0);

  --primary: oklch(0.45 0.18 255);
  --primary-foreground: oklch(0.985 0 0);

  --secondary: oklch(0.97 0 0);
  --secondary-foreground: oklch(0.205 0 0);

  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);

  --accent: oklch(0.95 0.03 255);
  --accent-foreground: oklch(0.30 0.10 255);

  --destructive: oklch(0.577 0.245 27.325);

  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.55 0.18 255);

  /* Palet chart distinctive untuk membedakan 4 aspek IKM */
  --chart-1: oklch(0.62 0.19 250);
  --chart-2: oklch(0.66 0.16 145);
  --chart-3: oklch(0.74 0.16 70);
  --chart-4: oklch(0.62 0.22 25);
  --chart-5: oklch(0.60 0.20 295);

  --radius: 0.625rem;

  --sidebar: oklch(0.17 0.02 260);
  --sidebar-foreground: oklch(0.93 0.01 260);
  --sidebar-primary: oklch(0.60 0.18 255);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.25 0.04 255);
  --sidebar-accent-foreground: oklch(0.85 0.05 255);
  --sidebar-border: oklch(0.30 0.02 260);
  --sidebar-ring: oklch(0.55 0.18 255);
}
```

Replace the `.dark { ... }` block:

```css
.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.205 0 0);
  --card-foreground: oklch(0.985 0 0);
  --popover: oklch(0.205 0 0);
  --popover-foreground: oklch(0.985 0 0);
  --primary: oklch(0.65 0.18 255);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.269 0 0);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.269 0 0);
  --muted-foreground: oklch(0.708 0 0);
  --accent: oklch(0.25 0.05 255);
  --accent-foreground: oklch(0.85 0.05 255);
  --destructive: oklch(0.704 0.191 22.216);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.65 0.20 255);
  --chart-1: oklch(0.72 0.18 250);
  --chart-2: oklch(0.74 0.17 145);
  --chart-3: oklch(0.80 0.17 70);
  --chart-4: oklch(0.70 0.22 25);
  --chart-5: oklch(0.70 0.20 295);
  --sidebar: oklch(0.13 0.02 260);
  --sidebar-foreground: oklch(0.93 0.01 260);
  --sidebar-primary: oklch(0.65 0.20 255);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.22 0.04 255);
  --sidebar-accent-foreground: oklch(0.85 0.05 255);
  --sidebar-border: oklch(1 0 0 / 10%);
  --sidebar-ring: oklch(0.65 0.20 255);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /home/moohard/dev/project/survey-petugas/frontend && npx vitest run src/test/theme-colors.test.ts`
Expected: PASS

- [ ] **Step 5: Run full test suite to check for regressions**

Run: `cd /home/moohard/dev/project/survey-petugas/frontend && npx vitest run`
Expected: All tests pass

- [ ] **Step 6: Commit**

```bash
git add frontend/src/index.css frontend/src/test/theme-colors.test.ts
git commit -m "feat: override CSS variables ke tema biru profesional pemerintah

Ganti palet monokrom (chroma=0) dengan biru navy (hue 255, chroma 0.18)
untuk primary, ring, dan sidebar. Dark sidebar di light mode via
--sidebar oklch(0.17 0.02 260). Sidebar-primary biru cerah."
```

---

## Task 3: Redesign AdminLayout — Dark Sidebar & Header Blur

**Files:**
- Modify: `frontend/src/components/layout/AdminLayout.tsx`

- [ ] **Step 1: Write test for sidebar dark styling**

Add to `frontend/src/pages/DashboardPage.test.tsx` or create `frontend/src/components/layout/AdminLayout.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { AdminLayout } from '@/components/layout/AdminLayout'

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    admin: { id: 1, username: 'admin', nama: 'Admin' },
    logout: vi.fn(),
  }),
}))

const renderLayout = () =>
  render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <AdminLayout />
    </MemoryRouter>,
  )

describe('AdminLayout', () => {
  it('sidebar memiliki class dark background', () => {
    renderLayout()
    const sidebar = screen.getByRole('navigation', { hidden: true }) || document.querySelector('[data-slot="sidebar"]')
    // Sidebar harus punya class yang mengindikasikan background gelap
    expect(sidebar?.className).toMatch(/sidebar/)
  })

  it('header memiliki backdrop-blur', () => {
    renderLayout()
    const header = document.querySelector('header')
    expect(header?.className).toMatch(/backdrop-blur/)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /home/moohard/dev/project/survey-petugas/frontend && npx vitest run src/components/layout/AdminLayout.test.tsx`
Expected: FAIL — header doesn't have backdrop-blur class yet

- [ ] **Step 3: Update AdminLayout.tsx**

Key changes to `frontend/src/components/layout/AdminLayout.tsx`:

1. **Sidebar header** — icon container blue gradient:
   Change `<div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">` to:
   ```tsx
   <div className="flex size-8 items-center justify-center rounded-lg bg-blue-500/20">
   ```
   Change `<ShieldCheck className="size-4 text-primary" aria-hidden />` to:
   ```tsx
   <ShieldCheck className="size-4 text-blue-400" aria-hidden />
   ```

2. **Sidebar menu button active state** — add border-left indicator:
   Change `<SidebarMenuButton isActive={location.pathname === item.url} onClick={() => navigate(item.url)}>` to:
   ```tsx
   <SidebarMenuButton
     isActive={location.pathname === item.url}
     onClick={() => navigate(item.url)}
     className={location.pathname === item.url
       ? 'bg-blue-500/15 border-l-3 border-blue-500 text-blue-400 font-medium'
       : 'border-l-3 border-transparent'
     }
   >
   ```

3. **Avatar in footer** — blue background:
   Change `<Avatar className="size-8">` wrapper — change `<AvatarFallback>` to:
   ```tsx
   <AvatarFallback className="bg-blue-600 text-white text-sm font-semibold">
   ```

4. **Footer border** — subtle on dark bg:
   Change `<div className="flex items-center gap-2 rounded-md border p-2">` to:
   ```tsx
   <div className="flex items-center gap-2 rounded-md border border-white/8 p-2">
   ```

5. **Header bar** — add backdrop blur:
   Change `<header className="sticky top-0 z-10 flex items-center gap-3 border-b bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60">` to:
   ```tsx
   <header className="sticky top-0 z-10 flex items-center gap-3 border-b bg-background/80 px-4 py-3 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
   ```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /home/moohard/dev/project/survey-petugas/frontend && npx vitest run src/components/layout/AdminLayout.test.tsx`
Expected: PASS

- [ ] **Step 5: Run full test suite**

Run: `cd /home/moohard/dev/project/survey-petugas/frontend && npx vitest run`
Expected: All tests pass

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/layout/AdminLayout.tsx frontend/src/components/layout/AdminLayout.test.tsx
git commit -m "feat: redesign AdminLayout — dark sidebar, blue accent, header backdrop blur

Sidebar icon dan avatar biru, item aktif dengan border-left biru,
header bar dengan backdrop-blur-md."
```

---

## Task 4: Redesign SummaryCards — Gradient Cards & Colored Aspek

**Files:**
- Modify: `frontend/src/components/dashboard/SummaryCards.tsx`

- [ ] **Step 1: Update SummaryCards.tsx**

Replace the current `SummaryCards` component in `frontend/src/components/dashboard/SummaryCards.tsx` with gradient-colored cards. Key changes:

1. **ASPEK_META** — add `borderColor` and `gradientFrom`/`gradientTo` for each aspek:
```typescript
const ASPEK_META: Array<{
  key: 'kecepatan' | 'keramahan' | 'informasi' | 'kenyamanan'
  label: string
  color: string
  borderColor: string
  gradientFrom: string
  gradientTo: string
  labelColor: string
}> = [
  { key: 'kecepatan', label: 'Kecepatan', color: 'var(--chart-1)', borderColor: 'border-l-blue-500', gradientFrom: 'from-blue-500', gradientTo: 'to-blue-400', labelColor: 'text-blue-600 dark:text-blue-400' },
  { key: 'keramahan', label: 'Keramahan', color: 'var(--chart-2)', borderColor: 'border-l-emerald-500', gradientFrom: 'from-emerald-500', gradientTo: 'to-emerald-400', labelColor: 'text-emerald-600 dark:text-emerald-400' },
  { key: 'informasi', label: 'Informasi', color: 'var(--chart-3)', borderColor: 'border-l-amber-500', gradientFrom: 'from-amber-500', gradientTo: 'to-amber-400', labelColor: 'text-amber-600 dark:text-amber-400' },
  { key: 'kenyamanan', label: 'Kenyamanan', color: 'var(--chart-4)', borderColor: 'border-l-violet-500', gradientFrom: 'from-violet-500', gradientTo: 'to-violet-400', labelColor: 'text-violet-600 dark:text-violet-400' },
]
```

2. **Row 1 — Total Responden card**: Change `<MagicCard className="p-6">` to:
```tsx
<MagicCard className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200 p-6 dark:from-blue-950/30 dark:to-blue-900/20 dark:border-blue-800/40 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
```

3. **Row 1 — Nilai IKM card**: Change `<MagicCard className="p-6">` to:
```tsx
<MagicCard className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200 p-6 dark:from-emerald-950/30 dark:to-emerald-900/20 dark:border-emerald-800/40 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
```
And change `gaugePrimaryColor` from `"var(--primary)"` to `"hsl(142,71%,45%)"` (emerald green).

4. **Row 1 — Mutu Pelayanan card**: Change `<MagicCard className={cn('p-6', kategori.bg)}>` to:
```tsx
<MagicCard className={cn('bg-gradient-to-br from-emerald-50 to-green-100/50 border-emerald-200 p-6 dark:from-emerald-950/30 dark:to-green-900/20 dark:border-emerald-800/40 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200', kategori.bg)}>
```

5. **Row 2 — 4 Aspek cards**: Change each `<MagicCard key={key} className="p-4">` to:
```tsx
<MagicCard key={key} className={cn('p-4 border-l-3 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 rounded-none rounded-r-xl', borderColor)}>
```
Change the label to use `labelColor`:
```tsx
<p className={cn('text-xs font-semibold', labelColor)}>{label}</p>
```
Change the progress bar from solid to gradient:
```tsx
<div
  className="h-full rounded-full bg-gradient-to-r transition-all duration-700 ease-out"
  style={{
    width: `${Math.min(100, (summary.rata_rata[key] / 5) * 100)}%`,
    backgroundImage: `linear-gradient(to right, var(--chart-${index + 1}), color-mix(in oklch, var(--chart-${index + 1}) 70%, white))`,
  }}
/>
```

- [ ] **Step 2: Run full test suite**

Run: `cd /home/moohard/dev/project/survey-petugas/frontend && npx vitest run`
Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/dashboard/SummaryCards.tsx
git commit -m "feat: redesign SummaryCards — gradient card backgrounds, colored borders, hover lift

Row 1 kartu menggunakan gradient biru/hijau/emerald sesuai metric.
Row 2 aspek menggunakan border-left berwarna + label berwarna +
progress bar gradient. Micro-interaction hover lift + shadow."
```

---

## Task 5: Redesign LoginPage — AnimatedGridPattern, Gradient, Shimmer Bar

**Files:**
- Modify: `frontend/src/pages/LoginPage.tsx`

- [ ] **Step 1: Update LoginPage.tsx**

Key changes:

1. **Import replacement**: Replace `DotPattern` import with `AnimatedGridPattern`:
```tsx
import { AnimatedGridPattern } from '@/components/ui/animated-grid-pattern'
import { AnimatedGradientText } from '@/components/ui/animated-gradient-text'
```
Remove `import { DotPattern } from '@/components/ui/dot-pattern'`
Remove `import { ShineBorder } from '@/components/ui/shine-border'`

2. **Background**: Replace `<DotPattern className={cn('[mask-image:radial-gradient(400px_circle_at_center,white,transparent)]')} />` with:
```tsx
<AnimatedGridPattern
  numSquares={30}
  maxOpacity={0.1}
  duration={3}
  className="absolute inset-0 [mask-image:radial-gradient(500px_circle_at_center,white,transparent)]"
/>
```

3. **Card wrapper**: Replace `<Card className="relative w-full max-w-sm overflow-hidden">` with:
```tsx
<Card className="relative w-full max-w-sm overflow-hidden rounded-2xl border-blue-200 shadow-lg shadow-blue-500/10 dark:border-blue-800/40">
```

4. **Remove ShineBorder**: Delete `<ShineBorder shineColor={['#A07CFE', '#FE8FB5', '#FFBE7B']} />`

5. **Add shimmer bar**: Right after the Card tag, add:
```tsx
<div className="h-[3px] w-full bg-gradient-to-r from-blue-500 via-violet-500 to-blue-500 bg-[length:200%_100%] animate-[shimmer_3s_linear_infinite]" />
```

6. **Icon container**: Replace `<div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10">` with:
```tsx
<div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-lg shadow-blue-500/30">
```
Change `<ShieldCheck className="size-6 text-primary" aria-hidden />` to:
```tsx
<ShieldCheck className="size-6 text-white" aria-hidden />
```

7. **Title**: Replace `<CardTitle className="text-xl">Survei Kepuasan PTSP</CardTitle>` with:
```tsx
<CardTitle className="text-xl">
  <AnimatedGradientText className="bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text text-transparent dark:from-blue-400 dark:to-blue-300">
    Survei Kepuasan PTSP
  </AnimatedGradientText>
</CardTitle>
```

8. **Input styling**: Add classes to each Input:
```tsx
className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:ring-blue-500/30 focus:border-blue-500"
```

9. **Login button**: Replace `<Button type="submit" className="w-full" disabled={submitting}>` with:
```tsx
<Button type="submit" className="w-full bg-gradient-to-r from-blue-700 to-blue-500 hover:from-blue-800 hover:to-blue-600 shadow-md shadow-blue-500/25 text-white" disabled={submitting}>
```

- [ ] **Step 2: Add shimmer keyframe to index.css (if not exists)**

Add to `frontend/src/index.css` inside the `@theme inline` block (after existing keyframes):

```css
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

- [ ] **Step 3: Run full test suite**

Run: `cd /home/moohard/dev/project/survey-petugas/frontend && npx vitest run`
Expected: All tests pass (LoginPage tests test form behavior, not styling)

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/LoginPage.tsx frontend/src/index.css
git commit -m "feat: redesign LoginPage — AnimatedGridPattern, gradient biru, shimmer bar

Ganti DotPattern → AnimatedGridPattern, ShineBorder → shimmer bar,
icon container gradient biru, judul AnimatedGradientText, tombol gradient,
input focus ring biru."
```

---

## Task 6: Redesign SurveyPage — AnimatedGridPattern, Gradient Avatar, Shimmer Blue

**Files:**
- Modify: `frontend/src/pages/SurveyPage.tsx`

- [ ] **Step 1: Update SurveyPage.tsx**

Key changes:

1. **Import replacement**: Replace `DotPattern` with `AnimatedGridPattern`:
```tsx
import { AnimatedGridPattern } from '@/components/ui/animated-grid-pattern'
```
Remove `import { DotPattern } from '@/components/ui/dot-pattern'`

2. **Background**: Replace `<DotPattern className={cn('[mask-image:radial-gradient(400px_circle_at_center,white,transparent)]')} />` with:
```tsx
<AnimatedGridPattern
  numSquares={30}
  maxOpacity={0.1}
  duration={3}
  className="absolute inset-0 [mask-image:radial-gradient(500px_circle_at_center,white,transparent)]"
/>
```

3. **Card wrapper**: Replace `<Card className="relative w-full max-w-md overflow-hidden">` with:
```tsx
<Card className="relative w-full max-w-md overflow-hidden rounded-2xl border-blue-200/80 shadow-lg shadow-blue-500/8 dark:border-blue-800/40">
```

4. **Add shimmer bar**: Right after the Card tag, add:
```tsx
<div className="h-[3px] w-full bg-gradient-to-r from-blue-500 via-emerald-500 to-blue-500 bg-[length:200%_100%] animate-[shimmer_3s_linear_infinite]" />
```

5. **Avatar fallback**: Replace `<AvatarFallback>{petugas.nama.charAt(0)}</AvatarFallback>` with:
```tsx
<AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-700 text-white text-2xl font-bold shadow-lg shadow-blue-500/25">{petugas.nama.charAt(0)}</AvatarFallback>
```

6. **Progress bar**: Change `className="h-full bg-primary transition-all duration-300"` to:
```tsx
className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-700 ease-out"
```
And change the outer bar from `className="h-1.5 w-full overflow-hidden rounded-full bg-muted"` to `className="h-2 w-full overflow-hidden rounded-full bg-muted"`

7. **ShimmerButton**: Change `<ShimmerButton onClick={handleSubmit} disabled={!isReady || submitting} className="w-full" data-testid="submit-survey"` to:
```tsx
<ShimmerButton
  onClick={handleSubmit}
  disabled={!isReady || submitting}
  className="w-full"
  background="linear-gradient(to right, #1d4ed8, #3b82f6)"
  shimmerColor="#93c5fd"
  data-testid="submit-survey"
```

- [ ] **Step 2: Run full test suite**

Run: `cd /home/moohard/dev/project/survey-petugas/frontend && npx vitest run`
Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/SurveyPage.tsx
git commit -m "feat: redesign SurveyPage — AnimatedGridPattern, gradient avatar, shimmer biru

Ganti DotPattern → AnimatedGridPattern, avatar fallback gradient biru,
progress bar gradient biru, ShimmerButton background biru, shimmer bar."
```

---

## Task 7: Redesign BarChartCard & RadarChartCard — Gradient Bars, Dark Tooltip

**Files:**
- Modify: `frontend/src/components/dashboard/BarChartCard.tsx`
- Modify: `frontend/src/components/dashboard/RadarChartCard.tsx`

- [ ] **Step 1: Update BarChartCard.tsx**

Key changes:

1. **Card border**: Change `<Card>` to `<Card className="border-blue-200/50 dark:border-blue-800/30">`

2. **Dark tooltip style**: Replace `tooltipStyle` with:
```typescript
const tooltipStyle: React.CSSProperties = {
  background: 'hsl(222.2,84%,4.9%)',
  border: '1px solid hsl(215,20%,15%)',
  borderRadius: 8,
  color: 'hsl(210,40%,96.1%)',
  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
}
```

3. **Add gradient defs**: Inside the `<BarChart>` component, before `<CartesianGrid>`, add:
```tsx
<defs>
  <linearGradient id="fillKecepatan" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={1} />
    <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.6} />
  </linearGradient>
  <linearGradient id="fillKeramahan" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={1} />
    <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0.6} />
  </linearGradient>
  <linearGradient id="fillInformasi" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stopColor="var(--chart-3)" stopOpacity={1} />
    <stop offset="100%" stopColor="var(--chart-3)" stopOpacity={0.6} />
  </linearGradient>
  <linearGradient id="fillKenyamanan" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stopColor="var(--chart-4)" stopOpacity={1} />
    <stop offset="100%" stopColor="var(--chart-4)" stopOpacity={0.6} />
  </linearGradient>
</defs>
```

4. **Bar fill**: Change each `<Bar>` fill from `"var(--chart-N)"` to gradient:
```tsx
<Bar dataKey="Kecepatan" fill="url(#fillKecepatan)" radius={[4, 4, 0, 0]} />
<Bar dataKey="Keramahan" fill="url(#fillKeramahan)" radius={[4, 4, 0, 0]} />
<Bar dataKey="Informasi" fill="url(#fillInformasi)" radius={[4, 4, 0, 0]} />
<Bar dataKey="Kenyamanan" fill="url(#fillKenyamanan)" radius={[4, 4, 0, 0]} />
```

5. **Legend**: Add font-weight to legend wrapper:
```tsx
<Legend wrapperStyle={{ fontSize: 12, fontWeight: 500 }} />
```

- [ ] **Step 2: Update RadarChartCard.tsx**

Key changes:

1. **Card border**: Change `<Card>` to `<Card className="border-blue-200/50 dark:border-blue-800/30">`

2. **Dark tooltip**: Replace `contentStyle` with:
```typescript
contentStyle={{
  background: 'hsl(222.2,84%,4.9%)',
  border: '1px solid hsl(215,20%,15%)',
  borderRadius: 8,
  color: 'hsl(210,40%,96.1%)',
  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
}}
```

3. **Radar fill**: Change `fill="var(--primary)"` to `fill="hsl(142,71%,45%)"` and `stroke` to match:
```tsx
<Radar
  name="Rata-rata"
  dataKey="nilai"
  stroke="hsl(142,71%,45%)"
  fill="hsl(142,71%,45%)"
  fillOpacity={0.35}
/>
```

- [ ] **Step 3: Run full test suite**

Run: `cd /home/moohard/dev/project/survey-petugas/frontend && npx vitest run`
Expected: All tests pass

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/dashboard/BarChartCard.tsx frontend/src/components/dashboard/RadarChartCard.tsx
git commit -m "feat: redesign charts — gradient bars, dark tooltip, emerald radar

BarChart gradient fill per aspek via linearGradient defs.
RadarChart emerald hijau. Tooltip dark theme (slate-950).
Card border biru-tinted."
```

---

## Task 8: Redesign Tabel & Filter Components — Blue Hover, Themed Cards

**Files:**
- Modify: `frontend/src/components/dashboard/RekapTable.tsx`
- Modify: `frontend/src/components/dashboard/DateFilter.tsx`
- Modify: `frontend/src/components/dashboard/SaranList.tsx`
- Modify: `frontend/src/components/dashboard/RatingDistribution.tsx`

- [ ] **Step 1: Update RekapTable.tsx**

Key changes:

1. **Card border**: `<Card>` → `<Card className="border-blue-200/50 dark:border-blue-800/30">`
2. **Header row**: Add to `<TableHeader>` → `<TableHeader className="bg-slate-50 dark:bg-slate-800/50">`
3. **Row hover**: Change `<TableRow key={p.petugas_id} className={cn(onSelectPetugas && 'cursor-pointer hover:bg-muted/50')}>` to:
```tsx
<TableRow key={p.petugas_id} className={cn(onSelectPetugas && 'cursor-pointer hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-colors')}>
```

- [ ] **Step 2: Update DateFilter.tsx**

Key changes:

1. **Card border**: Change `<div className="space-y-3 rounded-lg border bg-card p-4">` to `<div className="space-y-3 rounded-lg border border-blue-200/50 bg-card p-4 dark:border-blue-800/30">`

- [ ] **Step 3: Update SaranList.tsx**

Key changes:

1. **Card border**: `<Card>` → `<Card className="border-blue-200/50 dark:border-blue-800/30">`
2. **Add Marquee**: Import `Marquee` from `@/components/ui/marquee`. Before the `<ScrollArea>` in the items section, add a horizontal Marquee of latest saran:
```tsx
{items.length > 0 && (
  <Marquee pauseOnHover className="mb-4 py-2">
    {items.slice(0, 10).map((r) => (
      <div key={r.id} className="mx-2 rounded-lg border bg-muted/50 px-3 py-2 text-xs">
        <span className="font-medium">{namaPetugas.get(r.petugas_id) ?? `Petugas #${r.petugas_id}`}</span>
        <span className="text-muted-foreground">: {r.saran?.slice(0, 80)}{r.saran && r.saran.length > 80 ? '...' : ''}</span>
      </div>
    ))}
  </Marquee>
)}
```

- [ ] **Step 4: Update RatingDistribution.tsx**

Key changes:

1. **Card border**: `<Card>` → `<Card className="border-blue-200/50 dark:border-blue-800/30">`

- [ ] **Step 5: Run full test suite**

Run: `cd /home/moohard/dev/project/survey-petugas/frontend && npx vitest run`
Expected: All tests pass

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/dashboard/RekapTable.tsx frontend/src/components/dashboard/DateFilter.tsx frontend/src/components/dashboard/SaranList.tsx frontend/src/components/dashboard/RatingDistribution.tsx
git commit -m "feat: redesign tabel & filter — blue hover, themed cards, Marquee saran

RekapTable row hover blue, header row slate background.
DateFilter card border biru. SaranList tambah Marquee saran.
RatingDistribution card border biru."
```

---

## Task 9: Redesign PetugasPage — Blue Badges, Row Hover, Gradient Button

**Files:**
- Modify: `frontend/src/pages/PetugasPage.tsx`

- [ ] **Step 1: Update PetugasPage.tsx**

Key changes:

1. **Badge Aktif**: Change `<Badge>Aktif</Badge>` to `<Badge className="bg-blue-600 text-white hover:bg-blue-700 border-0">Aktif</Badge>`
2. **Badge Non-aktif**: Change `<Badge variant="secondary">Non-aktif</Badge>` to `<Badge className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-0">Non-aktif</Badge>`
3. **Table row hover**: Add `hover:bg-blue-50/50 dark:hover:bg-blue-950/20` to the table's `<TableBody>` rows by wrapping in a custom class or using CSS. Simplest: add a className to the Table wrapper container: `<div className="overflow-hidden rounded-lg border [&_tbody_tr]:hover:bg-blue-50/50 [&_tbody_tr]:dark:hover:bg-blue-950/20 [&_tbody_tr]:transition-colors">`
4. **Empty state icon container**: Change `<div className="rounded-full bg-muted p-3">` to `<div className="rounded-full bg-blue-50 p-3 dark:bg-blue-950/30">`
5. **Empty state icon**: Change `<Users className="size-6 text-muted-foreground" aria-hidden />` to `<Users className="size-6 text-blue-500" aria-hidden />`
6. **Tambah Petugas button**: Change `<Button onClick={...}>` to `<Button className="bg-gradient-to-r from-blue-700 to-blue-500 hover:from-blue-800 hover:to-blue-600 shadow-md shadow-blue-500/25" onClick={...}>`

- [ ] **Step 2: Run full test suite**

Run: `cd /home/moohard/dev/project/survey-petugas/frontend && npx vitest run`
Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/PetugasPage.tsx
git commit -m "feat: redesign PetugasPage — blue badges, row hover, gradient button

Badge Aktif biru, Non-aktif slate. Table row hover blue-tinted.
Empty state icon biru. Tambah button gradient biru."
```

---

## Task 10: Redesign NotFoundPage — HexagonPattern, AnimatedGradientText

**Files:**
- Modify: `frontend/src/pages/NotFoundPage.tsx`

- [ ] **Step 1: Update NotFoundPage.tsx**

Replace the entire component with:

```tsx
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, FileSearch } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { HexagonPattern } from '@/components/ui/hexagon-pattern'
import { AnimatedGradientText } from '@/components/ui/animated-gradient-text'
import { cn } from '@/lib/utils'

export default function NotFoundPage() {
  const navigate = useNavigate()
  const isAuthenticated = !!localStorage.getItem('token')

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background p-4">
      <HexagonPattern
        className="absolute inset-0 [mask-image:radial-gradient(500px_circle_at_center,white,transparent)]"
      />
      <div className="relative max-w-md space-y-4 rounded-2xl border border-blue-200/50 bg-card p-8 text-center shadow-lg shadow-blue-500/8 dark:border-blue-800/30">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950/30">
          <FileSearch className="size-8 text-blue-500" aria-hidden />
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Error 404</p>
          <h1 className="mt-1 text-2xl font-bold">
            <AnimatedGradientText className="bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text text-transparent dark:from-blue-400 dark:to-blue-300">
              Halaman tidak ditemukan
            </AnimatedGradientText>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            URL yang Anda akses tidak tersedia. Periksa kembali tautan atau gunakan tombol di
            bawah untuk kembali.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 size-4" />
            Kembali
          </Button>
          <Button className="bg-gradient-to-r from-blue-700 to-blue-500 hover:from-blue-800 hover:to-blue-600 shadow-md shadow-blue-500/25 text-white" onClick={() => navigate(isAuthenticated ? '/dashboard' : '/login')}>
            {isAuthenticated ? 'Ke Dashboard' : 'Ke Halaman Login'}
          </Button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Run full test suite**

Run: `cd /home/moohard/dev/project/survey-petugas/frontend && npx vitest run`
Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/NotFoundPage.tsx
git commit -m "feat: redesign NotFoundPage — HexagonPattern, AnimatedGradientText, gradient biru

Background HexagonPattern subtle. Judul gradient biru.
Icon container biru. Tombol gradient biru."
```

---

## Task 11: Add Micro-interactions — StarRating Bounce, Button Press, Tab Transition

**Files:**
- Modify: `frontend/src/components/survey/StarRating.tsx`

- [ ] **Step 1: Update StarRating.tsx — add motion bounce**

Add `motion` import:
```tsx
import { motion } from 'motion/react'
```

Replace each star `<button>` wrapper with motion.div for bounce animation. Change the button element:
```tsx
<motion.button
  key={n}
  type="button"
  role="radio"
  aria-checked={value === n}
  data-active={active}
  onMouseEnter={() => setHover(n)}
  onMouseLeave={() => setHover(0)}
  onFocus={() => setHover(n)}
  onBlur={() => setHover(0)}
  onClick={() => onChange(n)}
  aria-label={`${DESKRIPSI[n]} (${n} bintang)`}
  whileTap={{ scale: 0.85 }}
  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
  className={cn(
    'rounded-full p-1 transition-transform hover:scale-110',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
  )}
>
```

Close with `</motion.button>` instead of `</button>`.

- [ ] **Step 2: Add Button active scale to global CSS**

In `frontend/src/index.css`, add inside the `@layer base` block:
```css
button[class*="bg-gradient"] {
  @apply active:scale-[0.97] transition-transform duration-150;
}
```

- [ ] **Step 3: Run full test suite**

Run: `cd /home/moohard/dev/project/survey-petugas/frontend && npx vitest run`
Expected: All tests pass

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/survey/StarRating.tsx frontend/src/index.css
git commit -m "feat: tambah micro-interactions — StarRating bounce, button active scale

StarRating menggunakan motion.button dengan whileTap spring.
Gradient buttons aktif scale 0.97."
```

---

## Task 12: Update DashboardPage — AnimatedGradientText Heading, Themed Tabs

**Files:**
- Modify: `frontend/src/pages/DashboardPage.tsx`

- [ ] **Step 1: Update DashboardPage.tsx**

Key changes:

1. **Import AnimatedGradientText + GridPattern**: Add:
```tsx
import { AnimatedGradientText } from '@/components/ui/animated-gradient-text'
import { GridPattern } from '@/components/ui/grid-pattern'
```

2. **Dashboard heading**: Replace `<h1 className="text-2xl font-bold tracking-tight">Dashboard IKM</h1>` with:
```tsx
<h1 className="text-2xl font-bold tracking-tight">
  <AnimatedGradientText className="bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text text-transparent dark:from-blue-400 dark:to-blue-300">
    Dashboard IKM
  </AnimatedGradientText>
</h1>
```

3. **Dashboard header GridPattern**: Add a subtle GridPattern background to the page header section. In the `<BlurFade delay={0.05}>` wrapper that contains the title/buttons, add a relative positioned GridPattern:
```tsx
<BlurFade delay={0.05}>
  <div className="relative overflow-hidden rounded-xl border border-blue-200/50 bg-gradient-to-r from-blue-50/50 to-transparent p-4 dark:border-blue-800/30 dark:from-blue-950/20">
    <GridPattern
      width={20}
      height={20}
      x="-1"
      y="-1"
      className="absolute inset-0 [mask-image:radial-gradient(300px_circle_at_center,white,transparent)] opacity-30"
    />
    <div className="relative flex flex-wrap items-center justify-between gap-3">
      {/* existing title + buttons content */}
    </div>
  </div>
</BlurFade>
```

4. **Tab transition**: Wrap the `<TabsContent>` content with a motion.div for fade+slide animation. Import `motion` from `motion/react`. For each `<TabsContent>`, wrap children:
```tsx
<TabsContent value="overview" className="space-y-4">
  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
    {/* existing content */}
  </motion.div>
</TabsContent>
```

- [ ] **Step 2: Run full test suite**

Run: `cd /home/moohard/dev/project/survey-petugas/frontend && npx vitest run`
Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/DashboardPage.tsx
git commit -m "feat: redesign DashboardPage — AnimatedGradientText heading, tab transitions

Heading menggunakan AnimatedGradientText biru. Tab content
fade+slideY transition via motion.div."
```

---

## Task 13: Final Verification — Visual Review & Regression Check

**Files:**
- None (verification only)

- [ ] **Step 1: Run full test suite**

Run: `cd /home/moohard/dev/project/survey-petugas/frontend && npx vitest run`
Expected: All tests pass

- [ ] **Step 2: Run TypeScript type check**

Run: `cd /home/moohard/dev/project/survey-petugas/frontend && npx tsc --noEmit`
Expected: No type errors

- [ ] **Step 3: Run production build**

Run: `cd /home/moohard/dev/project/survey-petugas/frontend && npm run build`
Expected: Build succeeds

- [ ] **Step 4: Start dev server and visually verify all pages**

Run: `cd /home/moohard/dev/project/survey-petugas/frontend && npm run dev`

Check each page in browser:
1. `/login` — AnimatedGridPattern background, gradient biru card, shimmer bar, gradient button
2. `/survey/1` — AnimatedGridPattern, gradient avatar, blue progress, shimmer button
3. `/dashboard` — Blue heading, gradient summary cards, colored aspek cards, dark tooltip charts, blue-tinted table hover, Marquee saran
4. `/petugas` — Blue badges, blue row hover, gradient tambah button
5. `/nonexistent` — HexagonPattern, gradient heading, gradient button
6. Toggle dark mode — verify all pages work in dark theme
7. Toggle sidebar collapse — verify dark sidebar styling persists

- [ ] **Step 5: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "fix: perbaikan minor dari visual review UI/UX redesign"
```
