import '@testing-library/jest-dom'
import { vi } from 'vitest'
import React from 'react'

// Polyfill IntersectionObserver untuk komponen seperti BlurFade (motion/react)
class MockIntersectionObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
  takeRecords(): IntersectionObserverEntry[] {
    return []
  }
  readonly root: Element | null = null
  readonly rootMargin: string = ''
  readonly thresholds: ReadonlyArray<number> = []
}
;(globalThis as unknown as { IntersectionObserver: typeof MockIntersectionObserver }).IntersectionObserver =
  MockIntersectionObserver

// Mock Confetti karena jsdom tidak mendukung HTMLCanvasElement.getContext
// canvas-confetti akan crash saat kita unmount komponen
vi.mock('@/components/ui/confetti', () => ({
  Confetti: React.forwardRef<unknown, { className?: string; children?: React.ReactNode }>(
    function MockConfetti(_props, _ref) {
      // Stub minimal: tidak merender canvas
      return null
    },
  ),
  ConfettiButton: ({ children }: { children?: React.ReactNode }) =>
    React.createElement('button', null, children),
}))

// Mock NumberTicker — di jsdom, useInView tidak pernah trigger sehingga
// text content tidak pernah ter-update dari startValue. Render value langsung.
vi.mock('@/components/ui/number-ticker', () => ({
  NumberTicker: ({ value, decimalPlaces = 0 }: { value: number; decimalPlaces?: number }) =>
    React.createElement(
      'span',
      null,
      Intl.NumberFormat('en-US', {
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces,
      }).format(Number(value.toFixed(decimalPlaces))),
    ),
}))

// Mock Recharts ResponsiveContainer — di jsdom tidak ada layout sehingga
// chart tidak akan ter-render. Stub jadi div pembungkus saja.
vi.mock('recharts', async () => {
  const actual = await vi.importActual<typeof import('recharts')>('recharts')
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) =>
      React.createElement('div', { style: { width: 800, height: 400 } }, children),
  }
})
