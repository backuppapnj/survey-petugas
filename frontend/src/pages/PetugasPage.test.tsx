import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import PetugasPage from './PetugasPage'
import * as apiModule from '@/lib/api'

const fakePetugas = [
  { id: 1, nama: 'Budi', foto_url: '/api/uploads/budi.png', loket: 'Loket 1', unit_kerja: 'Umum', is_active: 1 },
  { id: 2, nama: 'Siti', foto_url: '/api/uploads/siti.png', loket: 'Loket 2', unit_kerja: 'Perizinan', is_active: 0 },
]

describe('PetugasPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('menampilkan daftar petugas dari API', async () => {
    vi.spyOn(apiModule, 'getAdminPetugas').mockResolvedValue(fakePetugas)

    render(
      <MemoryRouter>
        <PetugasPage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText('Budi')).toBeInTheDocument()
      expect(screen.getByText('Siti')).toBeInTheDocument()
    })
  })

  it('menampilkan tombol tambah petugas', async () => {
    vi.spyOn(apiModule, 'getAdminPetugas').mockResolvedValue([])

    render(
      <MemoryRouter>
        <PetugasPage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /tambah petugas/i })).toBeInTheDocument()
    })
  })

  it('menampilkan badge status non-aktif', async () => {
    vi.spyOn(apiModule, 'getAdminPetugas').mockResolvedValue(fakePetugas)

    render(
      <MemoryRouter>
        <PetugasPage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText(/non-aktif/i)).toBeInTheDocument()
    })
  })

  it('menampilkan aksen biru pada badge aktif dan hover row', async () => {
    vi.spyOn(apiModule, 'getAdminPetugas').mockResolvedValue(fakePetugas)

    render(
      <MemoryRouter>
        <PetugasPage />
      </MemoryRouter>,
    )

    const aktifBadge = await screen.findByText('Aktif')
    expect(aktifBadge).toHaveClass('bg-blue-500/15', 'text-blue-700')
    expect(screen.getByText('Non-aktif')).toHaveClass('bg-slate-500/15', 'text-slate-600')
    expect(screen.getByText('Budi').closest('tr')).toHaveClass('hover:bg-blue-500/5')
  })

  it('menampilkan empty state dan tombol tambah petugas dengan aksen biru', async () => {
    vi.spyOn(apiModule, 'getAdminPetugas').mockResolvedValue([])

    render(
      <MemoryRouter>
        <PetugasPage />
      </MemoryRouter>,
    )

    expect(await screen.findByText(/belum ada petugas/i)).toBeInTheDocument()
    expect(screen.getByTestId('petugas-empty-icon')).toHaveClass('bg-blue-500/10')
    expect(screen.getAllByRole('button', { name: /tambah petugas/i })[1]).toHaveClass(
      'from-sky-500',
      'to-blue-600',
    )
  })
})
