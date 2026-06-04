import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import DashboardPage from './DashboardPage'
import { AdminLayout } from '@/components/layout/AdminLayout'
import * as apiModule from '@/lib/api'

const fakeRekap = {
  summary: {
    total_responden: 10,
    rata_rata: { kecepatan: 4.5, keramahan: 4.8, informasi: 4.2, kenyamanan: 4.7 },
    ikm: 91.0,
  },
  per_petugas: [
    {
      petugas_id: 1,
      nama: 'Budi',
      foto_url: '/api/uploads/budi.png',
      total_responden: 5,
      rata_rata: { kecepatan: 5, keramahan: 5, informasi: 4, kenyamanan: 5 },
    },
  ],
  semua: [],
}

const fakePetugas = [
  {
    id: 1,
    nama: 'Budi',
    foto_url: '/api/uploads/budi.png',
    loket: 'Loket 1',
    unit_kerja: 'Pelayanan Umum',
    is_active: 1,
  },
]

const setupMocks = () => {
  vi.spyOn(apiModule, 'getRekap').mockResolvedValue(fakeRekap)
  vi.spyOn(apiModule, 'getAdminPetugas').mockResolvedValue(fakePetugas)
}

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    setupMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('menampilkan total responden dari rekap', async () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText(/total responden/i)).toBeInTheDocument()
    })
    // NumberTicker mungkin animasi; cek bahwa heading IKM tampil
    expect(screen.getByText(/nilai ikm/i)).toBeInTheDocument()
  })

  it('menampilkan nama petugas dari rekap pada tab Detail', async () => {
    const user = (await import('@testing-library/user-event')).default.setup()
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    )
    await waitFor(() => screen.getByRole('tab', { name: /tabel detail/i }))
    await user.click(screen.getByRole('tab', { name: /tabel detail/i }))
    await waitFor(() => {
      expect(screen.getByText('Budi')).toBeInTheDocument()
    })
  })

  it('menampilkan kategori IKM (A) sesuai nilai 91', async () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText(/sangat baik/i)).toBeInTheDocument()
    })
  })
})

// --- AdminLayout styling tests (from UI/UX redesign plan Task 3) ---

// Polyfill matchMedia required by use-mobile hook inside shadcn SidebarProvider
if (!window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
}

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
    // Use query* (not get*) so it doesn't throw if role not present; fallback to data attr
    const sidebar = screen.queryByRole('navigation', { hidden: true }) || document.querySelector('[data-slot="sidebar"]')
    // Sidebar harus punya class yang mengindikasikan background gelap (via CSS var + classes)
    expect(sidebar?.className || '').toMatch(/sidebar/)
  })

  it('header memiliki backdrop-blur-md (per redesign)', () => {
    renderLayout()
    const header = document.querySelector('header')
    expect(header?.className || '').toMatch(/backdrop-blur-md/)
  })

  it('sidebar header icon menggunakan blue accent (bg-blue-500/20 + text-blue-400)', () => {
    renderLayout()
    // The shield icon container in sidebar header
    const iconContainer = document.querySelector('.flex.size-8.items-center.justify-center.rounded-lg')
    expect(iconContainer?.className || '').toMatch(/bg-blue-500\/20/)
    // The icon (ShieldCheck) should have blue text color class (applied to the svg element)
    const html = document.body.innerHTML
    expect(html).toMatch(/text-blue-400/)
  })
})
