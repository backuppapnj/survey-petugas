import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import DashboardPage from './DashboardPage'
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

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('menampilkan total responden dari rekap', async () => {
    vi.spyOn(apiModule, 'getRekap').mockResolvedValue(fakeRekap)

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText(/10/)).toBeInTheDocument()
    })
  })

  it('menampilkan nama petugas dari rekap', async () => {
    vi.spyOn(apiModule, 'getRekap').mockResolvedValue(fakeRekap)

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText('Budi')).toBeInTheDocument()
    })
  })
})
