import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AnomaliPanel } from './AnomaliPanel'
import type { AnomaliResponse } from '@/types'

const sample: AnomaliResponse = {
  range: { start: '2026-06-01', end: '2026-06-07' },
  luar_jam: {
    total: 2,
    items: [
      { petugas_id: 1, nama: 'Budi', created_at: '2026-06-06 11:00:00' },
      { petugas_id: 1, nama: 'Budi', created_at: '2026-06-02 07:00:00' },
    ],
  },
  harian: {
    antrean_tersedia: true,
    items: [
      { date: '2026-06-02', survei: 3, dilayani: 1, anomali: true },
      { date: '2026-06-03', survei: 2, dilayani: 5, anomali: false },
    ],
  },
  petugas_outlier: {
    median: 2,
    items: [{ petugas_id: 1, nama: 'Budi', jumlah: 10, rasio: 5 }],
  },
}

describe('AnomaliPanel', () => {
  it('menampilkan ringkasan jumlah ketiga sinyal', () => {
    render(<AnomaliPanel data={sample} loading={false} error={null} />)
    expect(screen.getByTestId('anomali-luar-jam-total')).toHaveTextContent('2')
    expect(screen.getByTestId('anomali-harian-total')).toHaveTextContent('1')
    expect(screen.getByTestId('anomali-outlier-total')).toHaveTextContent('1')
  })

  it('menyorot tanggal anomali dan menampilkan nama outlier', () => {
    render(<AnomaliPanel data={sample} loading={false} error={null} />)
    expect(screen.getByText('2026-06-02')).toBeInTheDocument()
    expect(screen.getAllByText('Budi').length).toBeGreaterThan(0)
  })

  it('menampilkan status antrean tidak tersedia', () => {
    const tanpaAntrean: AnomaliResponse = {
      ...sample,
      harian: {
        antrean_tersedia: false,
        items: [{ date: '2026-06-02', survei: 3, dilayani: 0, anomali: false }],
      },
    }
    render(<AnomaliPanel data={tanpaAntrean} loading={false} error={null} />)
    expect(screen.getByText(/data antrean tidak tersedia/i)).toBeInTheDocument()
  })

  it('menampilkan skeleton saat loading', () => {
    render(<AnomaliPanel data={null} loading={true} error={null} />)
    expect(screen.getByTestId('anomali-loading')).toBeInTheDocument()
  })

  it('menampilkan pesan error', () => {
    render(<AnomaliPanel data={null} loading={false} error="Gagal memuat" />)
    expect(screen.getByRole('alert')).toHaveTextContent('Gagal memuat')
  })
})
