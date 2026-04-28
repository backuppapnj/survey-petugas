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
