import { describe, expect, it, beforeAll } from 'vitest'

// Per redesign plan (Task 2): verify that CSS custom properties for the
// professional blue government theme are correctly set in :root and .dark.
// We inject the raw CSS into JSDOM so getComputedStyle can read the vars
// (vitest css: true + this setup makes it reliable).

import indexCss from '../index.css?raw'

beforeAll(() => {
  // Inject the theme CSS so getComputedStyle(document.documentElement)
  // can resolve our --primary, --sidebar etc.
  const styleEl = document.createElement('style')
  styleEl.textContent = indexCss
  document.head.appendChild(styleEl)
})

describe('CSS theme variables', () => {
  it('light mode primary menggunakan hue biru (oklch chroma > 0)', () => {
    const style = getComputedStyle(document.documentElement)
    const primary = style.getPropertyValue('--primary').trim()
    // oklch(0.45 0.18 255) — chroma 0.18 > 0 berarti ada warna (bukan grayscale)
    const match = primary.match(/oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)/)
    expect(match).not.toBeNull()
    const chroma = parseFloat(match![2])
    expect(chroma).toBeGreaterThan(0)
  })

  it('light mode sidebar menggunakan background gelap', () => {
    const style = getComputedStyle(document.documentElement)
    const sidebar = style.getPropertyValue('--sidebar').trim()
    const match = sidebar.match(/oklch\(\s*([\d.]+)/)
    expect(match).not.toBeNull()
    const lightness = parseFloat(match![1])
    expect(lightness).toBeLessThan(0.3)
  })

  it('light mode sidebar-primary menggunakan hue biru', () => {
    const style = getComputedStyle(document.documentElement)
    const sp = style.getPropertyValue('--sidebar-primary').trim()
    const match = sp.match(/oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)/)
    expect(match).not.toBeNull()
    const chroma = parseFloat(match![2])
    expect(chroma).toBeGreaterThan(0)
  })

  it('dark mode primary juga memiliki hue (chroma > 0)', () => {
    // In dark mode the :root vars are overridden by .dark block
    // We check on <html class="dark"> simulation
    document.documentElement.classList.add('dark')
    const style = getComputedStyle(document.documentElement)
    const primary = style.getPropertyValue('--primary').trim()
    document.documentElement.classList.remove('dark')

    const match = primary.match(/oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)/)
    expect(match).not.toBeNull()
    const chroma = parseFloat(match![2])
    expect(chroma).toBeGreaterThan(0)
  })
})
