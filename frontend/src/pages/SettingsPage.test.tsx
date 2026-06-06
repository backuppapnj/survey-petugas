import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import SettingsPage from './SettingsPage'
import { SettingsProvider } from '@/components/SettingsProvider'
import * as apiModule from '@/lib/api'
import type { SettingMeta } from '@/types'

const fakeSettings: SettingMeta[] = [
  { key: 'app_title', value: 'Survei Kepuasan PTSP', type: 'string', category: 'branding', label: 'Judul Aplikasi', is_public: true },
  { key: 'kiosk_reset_timeout', value: 6000, type: 'int', category: 'kiosk', label: 'Timeout Auto-Reset Kiosk (ms)', is_public: true },
  { key: 'ikm_threshold_a', value: 88.31, type: 'float', category: 'ikm', label: 'Ambang Batas Mutu A', is_public: true },
  { key: 'petugas_page_size', value: 10, type: 'int', category: 'performance', label: 'Jumlah Baris per Halaman', is_public: false },
]

const renderPage = () =>
  render(
    <SettingsProvider>
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    </SettingsProvider>,
  )

describe('SettingsPage (modular per kategori)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.spyOn(apiModule, 'getPublicSettings').mockResolvedValue({})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('menampilkan tab navigasi tiap kategori', async () => {
    vi.spyOn(apiModule, 'getAdminSettings').mockResolvedValue(fakeSettings)

    renderPage()

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /branding/i })).toBeInTheDocument()
    })
    expect(screen.getByRole('tab', { name: /kiosk/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /indeks kepuasan/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /performa/i })).toBeInTheDocument()
  })

  it('menampilkan field kategori aktif (branding) secara default', async () => {
    vi.spyOn(apiModule, 'getAdminSettings').mockResolvedValue(fakeSettings)

    renderPage()

    await waitFor(() => {
      expect(screen.getByLabelText('Judul Aplikasi')).toHaveValue('Survei Kepuasan PTSP')
    })
  })

  it('menyimpan hanya kategori yang diubah', async () => {
    vi.spyOn(apiModule, 'getAdminSettings').mockResolvedValue(fakeSettings)
    const updateSpy = vi
      .spyOn(apiModule, 'updateSettings')
      .mockResolvedValue({ updated: ['app_title'], settings: fakeSettings })

    renderPage()

    const input = await screen.findByLabelText('Judul Aplikasi')
    await userEvent.clear(input)
    await userEvent.type(input, 'Survei DPMPTSP')

    const panel = screen.getByRole('tabpanel')
    await userEvent.click(within(panel).getByRole('button', { name: /simpan/i }))

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith({ app_title: 'Survei DPMPTSP' })
    })
  })

  it('menampilkan pesan error & tombol coba lagi saat gagal memuat', async () => {
    vi.spyOn(apiModule, 'getAdminSettings').mockRejectedValue(new Error('network'))

    renderPage()

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: /coba lagi/i })).toBeInTheDocument()
  })
})
