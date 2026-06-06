import { render, screen } from '@testing-library/react'
import { ThemeProvider } from 'next-themes'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { ThemeToggle } from './ThemeToggle'

// next-themes memanggil window.matchMedia; jsdom tidak mengimplementasikannya
beforeAll(() => {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }))
})
afterAll(() => {
  vi.unstubAllGlobals()
})

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
