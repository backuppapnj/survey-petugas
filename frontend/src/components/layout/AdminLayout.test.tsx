import { render } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { AdminLayout } from './AdminLayout'

// SidebarProvider memakai useIsMobile → window.matchMedia; jsdom tidak mengimplementasikannya
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

describe('AdminLayout', () => {
  it('kontainer <main> memakai min-w-0 agar konten lebar (tab/tabel) tidak memicu overflow horizontal di mobile', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route element={<AdminLayout />}>
            <Route path="/dashboard" element={<div>Konten</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )
    const main = container.querySelector('main')
    expect(main).not.toBeNull()
    // Tanpa min-w-0, flex item <main> tidak menyusut di bawah min-content anak
    // (mis. TabsList whitespace-nowrap) sehingga melebar & memicu scroll horizontal halaman.
    expect(main!.className).toContain('min-w-0')
  })
})
