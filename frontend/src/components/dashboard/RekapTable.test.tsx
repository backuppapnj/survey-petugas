import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { RekapTable } from './RekapTable'
import type { RekapPerPetugas } from '@/types'

const data: RekapPerPetugas[] = [
  {
    petugas_id: 1,
    nama: 'Budi',
    foto_url: null,
    total_responden: 12,
    rata_rata: { kecepatan: 3.8, keramahan: 3.9, informasi: 4, kenyamanan: 3.7 },
  },
]

describe('RekapTable sticky kolom Petugas (P-2)', () => {
  it('sel nama petugas sticky di kiri saat scroll horizontal', () => {
    render(<RekapTable data={data} />)
    const cell = screen.getByText('Budi').closest('td')
    expect(cell).not.toBeNull()
    expect(cell!.className).toContain('sticky')
    expect(cell!.className).toContain('left-0')
  })
})
