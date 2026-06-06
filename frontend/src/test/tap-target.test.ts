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
