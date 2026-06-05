import { render, screen, waitFor, within, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
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

const fakePetugas = {
  id: 1,
  nama: 'Budi Santoso',
  foto_url: '/api/uploads/budi.png',
  loket: 'Loket 1',
  unit_kerja: 'Pelayanan Umum',
}

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

describe('SurveyPage', () => {
  beforeAll(() => {
    vi.stubGlobal('ResizeObserver', ResizeObserverMock)
  })

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterAll(() => {
    vi.unstubAllGlobals()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('menampilkan data petugas setelah load', async () => {
    vi.spyOn(apiModule, 'getPetugas').mockResolvedValue(fakePetugas)

    renderAt('/survey/1')

    await waitFor(() => {
      expect(screen.getByText('Budi Santoso')).toBeInTheDocument()
    })
    expect(screen.getByText(/Loket 1/i)).toBeInTheDocument()
  })

  it('menonaktifkan submit jika belum semua aspek dirating', async () => {
    vi.spyOn(apiModule, 'getPetugas').mockResolvedValue(fakePetugas)

    renderAt('/survey/1')
    await waitFor(() => screen.getByText('Budi Santoso'))

    const submit = screen.getByTestId('submit-survey')
    expect(submit).toBeDisabled()
  })

  it('menampilkan progress aspek', async () => {
    vi.spyOn(apiModule, 'getPetugas').mockResolvedValue(fakePetugas)
    renderAt('/survey/1')
    await waitFor(() => screen.getByText('Budi Santoso'))
    expect(screen.getByText('0 / 4 aspek')).toBeInTheDocument()
  })

  it('menampilkan styling premium biru pada elemen utama', async () => {
    vi.spyOn(apiModule, 'getPetugas').mockResolvedValue(fakePetugas)

    renderAt('/survey/1')

    await waitFor(() => screen.getByText('Budi Santoso'))

    expect(screen.getByTestId('survey-grid-pattern')).toBeInTheDocument()
    expect(screen.getByTestId('survey-card')).toHaveClass('rounded-[32px]', 'border-blue-500/20')
    expect(screen.getByTestId('survey-avatar-fallback')).toHaveClass(
      'from-sky-500',
      'to-blue-600',
    )
    expect(screen.getByRole('progressbar')).toHaveClass('bg-gradient-to-r', 'from-sky-500')
    expect(screen.getByTestId('submit-survey')).toHaveClass('border-blue-300/40')
  })

  it('mengirim survei saat semua aspek terisi', async () => {
    vi.spyOn(apiModule, 'getPetugas').mockResolvedValue(fakePetugas)
    const submitSpy = vi
      .spyOn(apiModule, 'submitSurvei')
      .mockResolvedValue({ message: 'Terima kasih' })

    renderAt('/survey/1')
    await waitFor(() => screen.getByText('Budi Santoso'))

    // Pilih "Sangat Baik (nilai 4)" pada setiap radiogroup RatingScale (skala 1-4)
    const groups = screen.getAllByRole('radiogroup')
    groups.forEach((g) => {
      fireEvent.click(within(g).getByRole('radio', { name: /sangat baik \(nilai 4\)/i }))
    })

    const submit = screen.getByTestId('submit-survey')
    expect(submit).toBeEnabled()

    const user = userEvent.setup()
    await user.click(submit)

    await waitFor(() => {
      expect(submitSpy).toHaveBeenCalledWith({
        petugas_id: 1,
        kecepatan: 4,
        keramahan: 4,
        informasi: 4,
        kenyamanan: 4,
        saran: '',
      })
    })
  })

  it('mencegah submit ganda saat tombol ditekan berulang ketika request masih berjalan', async () => {
    vi.spyOn(apiModule, 'getPetugas').mockResolvedValue(fakePetugas)
    const submitSpy = vi.spyOn(apiModule, 'submitSurvei').mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve({ message: 'Terima kasih' }), 50)
        }),
    )

    renderAt('/survey/1')
    await waitFor(() => screen.getByText('Budi Santoso'))

    // Pilih "Sangat Baik (nilai 4)" pada setiap radiogroup RatingScale (skala 1-4)
    const groups = screen.getAllByRole('radiogroup')
    groups.forEach((g) => {
      fireEvent.click(within(g).getByRole('radio', { name: /sangat baik \(nilai 4\)/i }))
    })

    const user = userEvent.setup()
    const submit = screen.getByTestId('submit-survey')
    await user.click(submit)
    await user.click(submit)

    expect(submitSpy).toHaveBeenCalledTimes(1)
  })

  it('menampilkan empty state ketika petugas tidak ditemukan', async () => {
    vi.spyOn(apiModule, 'getPetugas').mockRejectedValue(new Error('not found'))
    renderAt('/survey/999')
    await waitFor(() => {
      expect(screen.getByText(/petugas tidak ditemukan/i)).toBeInTheDocument()
    })
  })

  it('membersihkan timer reset lama saat pengguna memilih beri penilaian lagi', async () => {
    vi.spyOn(apiModule, 'getPetugas').mockResolvedValue(fakePetugas)
    vi.spyOn(apiModule, 'submitSurvei').mockResolvedValue({ message: 'Terima kasih' })
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout')

    renderAt('/survey/1')
    await waitFor(() => screen.getByText('Budi Santoso'))

    // Pilih "Sangat Baik (nilai 4)" pada setiap radiogroup RatingScale (skala 1-4)
    const groups = screen.getAllByRole('radiogroup')
    groups.forEach((g) => {
      fireEvent.click(within(g).getByRole('radio', { name: /sangat baik \(nilai 4\)/i }))
    })

    const user = userEvent.setup()
    await user.click(screen.getByTestId('submit-survey'))
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /beri penilaian lagi/i })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /beri penilaian lagi/i }))
    expect(clearTimeoutSpy).toHaveBeenCalled()
  })
})
