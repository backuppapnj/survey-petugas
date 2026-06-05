import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { RatingScale } from './RatingScale'

describe('RatingScale', () => {
  it('merender 4 opsi persepsi sebagai radiogroup', () => {
    render(<RatingScale value={0} onChange={() => {}} label="Test" />)
    expect(screen.getByRole('radiogroup', { name: 'Penilaian Test' })).toBeInTheDocument()
    expect(screen.getAllByRole('radio')).toHaveLength(4)
  })

  it('menampilkan label persepsi resmi', () => {
    render(<RatingScale value={0} onChange={() => {}} label="Test" />)
    expect(screen.getByRole('radio', { name: /tidak baik \(nilai 1\)/i })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /sangat baik \(nilai 4\)/i })).toBeInTheDocument()
  })

  it('memanggil onChange dengan nilai saat diklik', () => {
    const onChange = vi.fn()
    render(<RatingScale value={0} onChange={onChange} label="Test" />)
    fireEvent.click(screen.getByRole('radio', { name: /sangat baik \(nilai 4\)/i }))
    expect(onChange).toHaveBeenCalledWith(4)
  })

  it('menandai opsi aktif sesuai value', () => {
    render(<RatingScale value={2} onChange={() => {}} label="Test" />)
    const opsi = screen.getByRole('radio', { name: /kurang baik \(nilai 2\)/i })
    expect(opsi).toHaveAttribute('aria-checked', 'true')
    expect(opsi).toHaveAttribute('data-active', 'true')
  })

  it('mendukung navigasi keyboard panah', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<RatingScale value={2} onChange={onChange} label="Test" />)
    screen.getByRole('radio', { name: /kurang baik \(nilai 2\)/i }).focus()
    await user.keyboard('{ArrowRight}')
    await user.keyboard('{ArrowLeft}')
    expect(onChange).toHaveBeenNthCalledWith(1, 3)
    expect(onChange).toHaveBeenNthCalledWith(2, 2)
  })
})
