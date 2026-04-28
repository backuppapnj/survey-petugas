import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import SurveyPage from './SurveyPage'
import * as apiModule from '@/lib/api'

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/survey/:petugasId" element={<SurveyPage />} />
      </Routes>
    </MemoryRouter>,
  )

describe('SurveyPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('menampilkan data petugas setelah load', async () => {
    vi.spyOn(apiModule, 'getPetugas').mockResolvedValue({
      id: 1,
      nama: 'Budi Santoso',
      foto_url: '/api/uploads/budi.png',
      loket: 'Loket 1',
      unit_kerja: 'Pelayanan Umum',
    })

    renderAt('/survey/1')

    await waitFor(() => {
      expect(screen.getByText('Budi Santoso')).toBeInTheDocument()
    })
    expect(screen.getByText(/Loket 1/i)).toBeInTheDocument()
  })

  it('menonaktifkan submit jika belum semua aspek dirating', async () => {
    vi.spyOn(apiModule, 'getPetugas').mockResolvedValue({
      id: 1,
      nama: 'Budi',
      foto_url: '/api/uploads/budi.png',
      loket: 'Loket 1',
      unit_kerja: 'Umum',
    })

    renderAt('/survey/1')
    await waitFor(() => screen.getByText('Budi'))

    const submit = screen.getByTestId('submit-survey')
    expect(submit).toBeDisabled()
  })

  it('mengirim survei saat semua aspek terisi', async () => {
    vi.spyOn(apiModule, 'getPetugas').mockResolvedValue({
      id: 1,
      nama: 'Budi',
      foto_url: '/api/uploads/budi.png',
      loket: 'Loket 1',
      unit_kerja: 'Umum',
    })
    const submitSpy = vi
      .spyOn(apiModule, 'submitSurvei')
      .mockResolvedValue({ message: 'Terima kasih' })

    renderAt('/survey/1')
    await waitFor(() => screen.getByText('Budi'))

    const user = userEvent.setup()
    // Klik bintang ke-5 untuk semua 4 aspek
    for (const aspek of ['Kecepatan', 'Keramahan', 'Informasi', 'Kenyamanan']) {
      const group = screen.getByText(aspek).closest('div')!
      const stars = group.querySelectorAll('button')
      await user.click(stars[4])
    }

    const submit = screen.getByTestId('submit-survey')
    await user.click(submit)

    await waitFor(() => {
      expect(submitSpy).toHaveBeenCalledWith({
        petugas_id: 1,
        kecepatan: 5,
        keramahan: 5,
        informasi: 5,
        kenyamanan: 5,
        saran: '',
      })
    })
  })
})
