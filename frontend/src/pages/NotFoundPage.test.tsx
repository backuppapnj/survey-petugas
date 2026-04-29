import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import NotFoundPage from './NotFoundPage'

const renderPage = () =>
  render(
    <MemoryRouter>
      <NotFoundPage />
    </MemoryRouter>,
  )

describe('NotFoundPage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('menampilkan elemen visual biru pada halaman 404', () => {
    renderPage()

    expect(screen.getByTestId('not-found-hexagon-pattern')).toBeInTheDocument()
    expect(screen.getByTestId('not-found-icon-container')).toHaveClass(
      'bg-blue-500/10',
      'text-blue-600',
    )
    expect(screen.getByTestId('not-found-title-gradient')).toHaveTextContent(
      'Halaman tidak ditemukan',
    )
    expect(screen.getByRole('button', { name: /ke halaman login/i })).toHaveClass(
      'from-sky-500',
      'to-blue-600',
    )
  })
})
