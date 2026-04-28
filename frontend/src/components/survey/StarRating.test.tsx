import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { StarRating } from './StarRating'

describe('StarRating', () => {
  it('merender 5 bintang sebagai radiogroup', () => {
    render(<StarRating value={0} onChange={() => {}} label="Test" />)
    const group = screen.getByRole('radiogroup', { name: 'Rating Test' })
    expect(group).toBeInTheDocument()
    expect(screen.getAllByRole('radio')).toHaveLength(5)
  })

  it('memanggil onChange saat bintang diklik', () => {
    const handleChange = vi.fn()
    render(<StarRating value={0} onChange={handleChange} label="Test" />)

    const stars = screen.getAllByRole('radio')
    fireEvent.click(stars[3])

    expect(handleChange).toHaveBeenCalledWith(4)
  })

  it('menampilkan label aspek', () => {
    render(<StarRating value={0} onChange={() => {}} label="Kecepatan" />)
    expect(screen.getByText('Kecepatan')).toBeInTheDocument()
  })

  it('menandai bintang aktif berdasarkan value', () => {
    render(<StarRating value={3} onChange={() => {}} label="Test" />)
    const stars = screen.getAllByRole('radio')
    expect(stars[0]).toHaveAttribute('data-active', 'true')
    expect(stars[2]).toHaveAttribute('data-active', 'true')
    expect(stars[3]).toHaveAttribute('data-active', 'false')
    expect(stars[2]).toHaveAttribute('aria-checked', 'true')
  })

  it('menampilkan deskripsi rating sesuai nilai', () => {
    render(<StarRating value={5} onChange={() => {}} label="Test" />)
    expect(screen.getByText('Sangat Puas')).toBeInTheDocument()
  })
})
