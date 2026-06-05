import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

// Test verifikasi CSS variable tema biru profesional.
// Dibaca langsung dari file index.css sebagai string dari filesystem
// karena vitest dikonfigurasi css: false, sehingga import stylesheet
// tidak diproses seperti runtime browser/Vite biasa.
const css = readFileSync(resolve(process.cwd(), 'src/index.css'), 'utf8')

// Ambil blok :root { ... } pertama saja.
const rootBlockMatch = css.match(/:root\s*\{([\s\S]*?)\n\}/)
const rootBlock = rootBlockMatch ? rootBlockMatch[1] : ''

// Ambil blok .dark { ... } pertama.
const darkBlockMatch = css.match(/\.dark\s*\{([\s\S]*?)\n\}/)
const darkBlock = darkBlockMatch ? darkBlockMatch[1] : ''

function getVar(block: string, name: string): string {
  const re = new RegExp(`--${name}\\s*:\\s*([^;]+);`)
  const m = block.match(re)
  return m ? m[1].trim() : ''
}

function parseOklch(value: string): { l: number; c: number; h: number } | null {
  const m = value.match(/oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)/)
  if (!m) return null
  return { l: parseFloat(m[1]), c: parseFloat(m[2]), h: parseFloat(m[3]) }
}

describe('CSS theme variables', () => {
  it('light mode primary menggunakan hue biru (oklch chroma > 0)', () => {
    const primary = getVar(rootBlock, 'primary')
    const parsed = parseOklch(primary)
    expect(parsed).not.toBeNull()
    expect(parsed!.c).toBeGreaterThan(0)
  })

  it('light mode sidebar menggunakan background gelap', () => {
    const sidebar = getVar(rootBlock, 'sidebar')
    const parsed = parseOklch(sidebar)
    expect(parsed).not.toBeNull()
    expect(parsed!.l).toBeLessThan(0.3)
  })

  it('light mode sidebar-primary menggunakan hue biru', () => {
    const sp = getVar(rootBlock, 'sidebar-primary')
    const parsed = parseOklch(sp)
    expect(parsed).not.toBeNull()
    expect(parsed!.c).toBeGreaterThan(0)
  })

  it('dark mode primary juga memiliki hue (chroma > 0)', () => {
    const primary = getVar(darkBlock, 'primary')
    const parsed = parseOklch(primary)
    expect(parsed).not.toBeNull()
    expect(parsed!.c).toBeGreaterThan(0)
  })
})
