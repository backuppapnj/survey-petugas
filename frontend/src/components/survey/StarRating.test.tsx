import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

vi.mock('motion/react', () => ({
  motion: {
    button: React.forwardRef<
      HTMLButtonElement,
      React.ButtonHTMLAttributes<HTMLButtonElement> & { whileTap?: unknown }
    >(({ whileTap, children, ...props }, ref) => (
      <button
        ref={ref}
        data-motion="button"
        data-while-tap={JSON.stringify(whileTap)}
        {...props}
      >
        {children}
      </button>
    )),
  },
}))

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

  it('menggunakan motion.button dengan animasi tap spring', () => {
    render(<StarRating value={0} onChange={() => {}} label="Test" />)
    const firstStar = screen.getAllByRole('radio')[0]

    expect(firstStar).toHaveAttribute('data-motion', 'button')
    expect(firstStar.getAttribute('data-while-tap')).toContain('"scale":0.88')
    expect(firstStar.getAttribute('data-while-tap')).toContain('"type":"spring"')
  })

  it('mendukung navigasi keyboard panah pada radio group', async () => {
    const handleChange = vi.fn()
    const user = userEvent.setup()
    render(<StarRating value={2} onChange={handleChange} label="Test" />)

    const activeStar = screen.getByRole('radio', { name: /tidak puas \(2 bintang\)/i })
    activeStar.focus()
    expect(activeStar).toHaveFocus()

    await user.keyboard('{ArrowRight}')
    await user.keyboard('{ArrowLeft}')

    expect(handleChange).toHaveBeenNthCalledWith(1, 3)
    expect(handleChange).toHaveBeenNthCalledWith(2, 2)
  })
})
