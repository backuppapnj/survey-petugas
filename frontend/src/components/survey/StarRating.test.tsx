import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { StarRating } from './StarRating'

describe('StarRating', () => {
  it('merender 5 bintang', () => {
    render(<StarRating value={0} onChange={() => {}} label="Test" />)
    expect(screen.getAllByRole('button')).toHaveLength(5)
  })

  it('memanggil onChange saat bintang diklik', () => {
    const handleChange = vi.fn()
    render(<StarRating value={0} onChange={handleChange} label="Test" />)

    const stars = screen.getAllByRole('button')
    fireEvent.click(stars[3])

    expect(handleChange).toHaveBeenCalledWith(4)
  })

  it('menampilkan label', () => {
    render(<StarRating value={0} onChange={() => {}} label="Kecepatan" />)
    expect(screen.getByText('Kecepatan')).toBeInTheDocument()
  })

  it('menandai bintang aktif berdasarkan value', () => {
    render(<StarRating value={3} onChange={() => {}} label="Test" />)
    const stars = screen.getAllByRole('button')
    expect(stars[0]).toHaveAttribute('data-active', 'true')
    expect(stars[2]).toHaveAttribute('data-active', 'true')
    expect(stars[3]).toHaveAttribute('data-active', 'false')
  })
})
