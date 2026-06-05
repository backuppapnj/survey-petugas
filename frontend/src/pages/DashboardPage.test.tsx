import type { ReactElement } from 'react'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { ThemeProvider } from 'next-themes'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import DashboardPage from './DashboardPage'
import * as apiModule from '@/lib/api'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { BarChartCard } from '@/components/dashboard/BarChartCard'
import { RekapTable } from '@/components/dashboard/RekapTable'
import { SaranList } from '@/components/dashboard/SaranList'

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
  semua: [
    {
      id: 10,
      petugas_id: 1,
      kecepatan: 5,
      keramahan: 5,
      informasi: 4,
      kenyamanan: 5,
      saran: 'Pelayanan cepat dan petugas sangat membantu.',
      created_at: '2026-04-29 09:00:00',
    },
    {
      id: 11,
      petugas_id: 1,
      kecepatan: 2,
      keramahan: 3,
      informasi: 2,
      kenyamanan: 3,
      saran: 'Ruang tunggu perlu diperbaiki agar lebih nyaman.',
      created_at: '2026-04-29 08:30:00',
    },
    {
      id: 12,
      petugas_id: 1,
      kecepatan: 4,
      keramahan: 4,
      informasi: 5,
      kenyamanan: 4,
      saran: 'Informasi layanan sudah jelas dan mudah diikuti.',
      created_at: '2026-04-28 16:45:00',
    },
  ],
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

const fakeAnomali = {
  range: { start: '2026-04-01', end: '2026-04-29' },
  luar_jam: {
    total: 1,
    items: [{ petugas_id: 1, nama: 'Budi', created_at: '2026-04-29 07:00:00' }],
  },
  harian: {
    antrean_tersedia: true,
    items: [{ date: '2026-04-29', survei: 5, dilayani: 2, anomali: true }],
  },
  petugas_outlier: {
    median: 2,
    items: [{ petugas_id: 1, nama: 'Budi', jumlah: 8, rasio: 4 }],
  },
}

const createDeferred = <T,>() => {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

const renderWithTheme = (ui: ReactElement) =>
  render(
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      {ui}
    </ThemeProvider>,
  )

const createMatchMedia = (options?: { reduceMotion?: boolean }) =>
  vi.fn().mockImplementation((query: string) => ({
    matches: query.includes('prefers-reduced-motion')
      ? Boolean(options?.reduceMotion)
      : false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))

const setMatchMedia = (options?: { reduceMotion?: boolean }) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: createMatchMedia(options),
  })
}

const setPointerCapturePolyfill = () => {
  Object.defineProperty(HTMLElement.prototype, 'hasPointerCapture', {
    configurable: true,
    value: () => false,
  })
  Object.defineProperty(HTMLElement.prototype, 'setPointerCapture', {
    configurable: true,
    value: () => {},
  })
  Object.defineProperty(HTMLElement.prototype, 'releasePointerCapture', {
    configurable: true,
    value: () => {},
  })
  Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
    configurable: true,
    value: () => {},
  })
}

const setupMocks = () => {
  vi.spyOn(apiModule, 'getRekap').mockResolvedValue(fakeRekap)
  vi.spyOn(apiModule, 'getAdminPetugas').mockResolvedValue(fakePetugas)
  vi.spyOn(apiModule, 'getAnomali').mockResolvedValue(fakeAnomali)
}

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
    setMatchMedia()
    setPointerCapturePolyfill()
    vi.spyOn(window, 'print').mockImplementation(() => {})
    setupMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('menampilkan total responden dari rekap', async () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    )

    const totalLabel = await screen.findByText(/total responden/i)
    expect(totalLabel).toBeInTheDocument()
    expect(totalLabel.parentElement).toHaveTextContent('10')
  })

  it('mempertahankan hasil request terbaru saat request lama selesai belakangan', async () => {
    const requestAwal = createDeferred<typeof fakeRekap>()
    const requestBaru = createDeferred<typeof fakeRekap>()
    const rekapTerbaru = {
      ...fakeRekap,
      summary: {
        ...fakeRekap.summary,
        total_responden: 20,
      },
    }

    vi.spyOn(apiModule, 'getRekap')
      .mockImplementationOnce(() => requestAwal.promise)
      .mockImplementationOnce(() => requestBaru.promise)
    vi.spyOn(apiModule, 'getAdminPetugas').mockResolvedValue(fakePetugas)

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    )

    const mulaiInput = screen.getByLabelText(/mulai/i)
    fireEvent.change(mulaiInput, { target: { value: '2026-04-01' } })

    await waitFor(() => {
      expect(apiModule.getRekap).toHaveBeenCalledTimes(2)
    })

    requestBaru.resolve(rekapTerbaru)

    const totalLabel = await screen.findByText(/total responden/i)
    expect(totalLabel.parentElement).toHaveTextContent('20')

    requestAwal.resolve(fakeRekap)

    await waitFor(() => {
      expect(totalLabel.parentElement).toHaveTextContent('20')
    })
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

  it('menampilkan identitas admin dan navigasi pada layout admin', () => {
    localStorage.setItem('token', 'token-test')
    localStorage.setItem(
      'admin',
      JSON.stringify({ id: 1, username: 'admin', nama: 'Administrator' }),
    )

    renderWithTheme(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route element={<AdminLayout />}>
            <Route path="/dashboard" element={<div>Konten Dashboard</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('Survei PTSP')).toBeInTheDocument()
    expect(screen.getByText('Admin Panel')).toBeInTheDocument()
    expect(screen.getByText('Administrator')).toBeInTheDocument()
    expect(screen.getByText('@admin')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /dashboard/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument()
  })

  it('menampilkan heading dashboard, ringkasan, dan tab utama', async () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /dashboard ikm/i })).toBeInTheDocument()
    })
    expect(screen.getByText(/indeks kepuasan masyarakat/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /30 hari terakhir/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /ringkasan/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /distribusi rating/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /tabel detail/i })).toBeInTheDocument()
  })

  it('menampilkan error persisten saat load awal gagal dan bisa retry', async () => {
    vi.spyOn(apiModule, 'getRekap')
      .mockRejectedValueOnce(new Error('server down'))
      .mockResolvedValue(fakeRekap)
    vi.spyOn(apiModule, 'getAdminPetugas')
      .mockRejectedValueOnce(new Error('server down'))
      .mockResolvedValue(fakePetugas)

    const user = (await import('@testing-library/user-event')).default.setup()

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    )

    const alert = await screen.findByRole('alert')
    expect(within(alert).getByRole('heading', { name: /gagal memuat dashboard/i })).toBeInTheDocument()
    expect(screen.queryByText(/total responden/i)).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /coba lagi/i }))

    expect(await screen.findByText(/total responden/i)).toBeInTheDocument()
    expect(screen.queryByText(/gagal memuat dashboard/i)).not.toBeInTheDocument()
  })

  it('tidak menampilkan rekap lama saat filter baru gagal dimuat', async () => {
    vi.spyOn(apiModule, 'getRekap')
      .mockResolvedValueOnce(fakeRekap)
      .mockRejectedValueOnce(new Error('gagal filter baru'))
    vi.spyOn(apiModule, 'getAdminPetugas').mockResolvedValue(fakePetugas)

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    )

    const totalLabel = await screen.findByText(/total responden/i)
    expect(totalLabel.parentElement).toHaveTextContent('10')

    fireEvent.change(screen.getByLabelText(/mulai/i), {
      target: { value: '2026-04-01' },
    })

    const alert = await screen.findByRole('alert')
    expect(within(alert).getByRole('heading', { name: /gagal memuat dashboard/i })).toBeInTheDocument()
    expect(screen.queryByText(/total responden/i)).not.toBeInTheDocument()
    expect(screen.queryByText('10')).not.toBeInTheDocument()
  })

  it('tidak memanggil getRekap saat rentang tanggal sedang invalid', async () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    )

    await screen.findByText(/total responden/i)
    expect(apiModule.getRekap).toHaveBeenCalledTimes(1)

    fireEvent.change(screen.getByLabelText(/selesai/i), {
      target: { value: '' },
    })

    await waitFor(() => {
      expect(apiModule.getRekap).toHaveBeenCalledTimes(1)
    })
    expect(screen.getByRole('button', { name: /ekspor excel/i })).toBeDisabled()
  })

  it('menyertakan filter unit kerja aktif saat ekspor excel', async () => {
    const user = (await import('@testing-library/user-event')).default.setup()
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      blob: vi.fn().mockResolvedValue(new Blob(['ok'])),
    })
    vi.stubGlobal('fetch', fetchMock)
    vi.spyOn(apiModule, 'getExportUrl').mockReturnValue('/api/admin/survei/export?start=2026-04-01&end=2026-04-29')
    const createObjectUrlMock = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:fake')
    const revokeObjectUrlMock = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    const clickMock = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {})

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    )

    await screen.findByRole('button', { name: /ekspor excel/i })

    await user.click(screen.getByRole('combobox', { name: /unit kerja/i }))
    await user.click(screen.getByRole('option', { name: /pelayanan umum/i }))
    await user.click(screen.getByRole('button', { name: /ekspor excel/i }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled()
    })

    expect(String(fetchMock.mock.calls[0]?.[0])).toMatch(/unit_kerja=Pelayanan(\+|%20)Umum/)

    createObjectUrlMock.mockRestore()
    revokeObjectUrlMock.mockRestore()
    clickMock.mockRestore()
  })

  it('menyinkronkan marquee dan daftar utama dengan filter rating aktif', async () => {
    const user = (await import('@testing-library/user-event')).default.setup()

    renderWithTheme(
      <SaranList data={fakeRekap.semua} petugas={fakePetugas} />,
    )

    const sorotan = screen.getByRole('region', { name: /sorotan saran terbaru/i })
    const ringkasanSorotan = within(sorotan).getByRole('list', {
      name: /ringkasan saran terbaru/i,
    })
    const daftar = screen.getByRole('list', { name: /daftar saran responden/i })

    expect(within(ringkasanSorotan).getAllByRole('listitem')).toHaveLength(3)
    expect(within(ringkasanSorotan).getByText(/pelayanan cepat dan petugas sangat membantu/i)).toBeInTheDocument()
    expect(within(ringkasanSorotan).getByText(/ruang tunggu perlu diperbaiki/i)).toBeInTheDocument()
    expect(within(daftar).getByText(/informasi layanan sudah jelas/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /rating <4/i }))

    expect(within(ringkasanSorotan).getAllByRole('listitem')).toHaveLength(1)
    expect(within(ringkasanSorotan).getByText(/ruang tunggu perlu diperbaiki/i)).toBeInTheDocument()
    expect(within(ringkasanSorotan).queryByText(/pelayanan cepat dan petugas sangat membantu/i)).not.toBeInTheDocument()
    expect(within(daftar).getByText(/ruang tunggu perlu diperbaiki/i)).toBeInTheDocument()
    expect(within(daftar).queryByText(/informasi layanan sudah jelas/i)).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /rating ≥4/i }))

    expect(within(ringkasanSorotan).getAllByRole('listitem')).toHaveLength(2)
    expect(within(ringkasanSorotan).getByText(/pelayanan cepat dan petugas sangat membantu/i)).toBeInTheDocument()
    expect(within(ringkasanSorotan).getByText(/informasi layanan sudah jelas/i)).toBeInTheDocument()
    expect(within(ringkasanSorotan).queryByText(/ruang tunggu perlu diperbaiki/i)).not.toBeInTheDocument()
    expect(within(daftar).queryByText(/ruang tunggu perlu diperbaiki/i)).not.toBeInTheDocument()
  })

  it('menjaga sorotan marquee tetap aksesibel dan tetap terbaca saat reduced motion aktif', () => {
    setMatchMedia({ reduceMotion: true })

    renderWithTheme(
      <SaranList data={fakeRekap.semua} petugas={fakePetugas} />,
    )

    const sorotan = screen.getByRole('region', { name: /sorotan saran terbaru/i })
    const ringkasanSorotan = within(sorotan).getByRole('list', {
      name: /ringkasan saran terbaru/i,
    })
    const daftar = screen.getByRole('list', { name: /daftar saran responden/i })

    expect(within(ringkasanSorotan).getAllByRole('listitem')).toHaveLength(3)
    expect(within(ringkasanSorotan).getByText(/pelayanan cepat dan petugas sangat membantu/i)).toBeInTheDocument()
    expect(within(daftar).getByText(/pelayanan cepat dan petugas sangat membantu/i)).toBeInTheDocument()
  })

  it('membuka detail petugas dari tombol aksi tabel yang jelas untuk keyboard', async () => {
    const user = (await import('@testing-library/user-event')).default.setup()
    const onSelectPetugas = vi.fn()

    renderWithTheme(
      <RekapTable data={fakeRekap.per_petugas} onSelectPetugas={onSelectPetugas} />,
    )

    const tombolDetail = screen.getByRole('button', { name: /lihat detail budi/i })
    tombolDetail.focus()
    expect(tombolDetail).toHaveFocus()

    await user.keyboard('{Enter}')

    expect(onSelectPetugas).toHaveBeenCalledWith(1)
  })

  it('menyediakan jalur aksesibel untuk memilih petugas dari kartu bar chart', async () => {
    const user = (await import('@testing-library/user-event')).default.setup()
    const onSelectPetugas = vi.fn()

    renderWithTheme(
      <BarChartCard data={fakeRekap.per_petugas} onSelectPetugas={onSelectPetugas} />,
    )

    expect(screen.getByRole('group', { name: /daftar petugas untuk detail/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /lihat detail budi/i }))

    expect(onSelectPetugas).toHaveBeenCalledWith(1)
  })

  it('menampilkan tab Anomali dengan ringkasan sinyal', async () => {
    const user = (await import('@testing-library/user-event')).default.setup()
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    )

    await waitFor(() => screen.getByRole('tab', { name: /anomali/i }))
    await user.click(screen.getByRole('tab', { name: /anomali/i }))

    await waitFor(() => {
      expect(screen.getByTestId('anomali-luar-jam-total')).toHaveTextContent('1')
    })
    expect(screen.getByTestId('anomali-outlier-total')).toHaveTextContent('1')
  })
})
