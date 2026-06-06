import { render, screen } from '@testing-library/react'
import { ThemeProvider } from 'next-themes'
import { beforeAll, describe, expect, it } from 'vitest'
import { ThemeToggle } from './ThemeToggle'

// next-themes memanggil window.matchMedia; jsdom tidak mengimplementasikannya
beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  })
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
