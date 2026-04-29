import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import LoginPage from './LoginPage'
import * as apiModule from '@/lib/api'

const renderPage = () =>
  render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>,
  )

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

describe('LoginPage', () => {
  beforeAll(() => {
    vi.stubGlobal('ResizeObserver', ResizeObserverMock)
  })

  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  afterAll(() => {
    vi.unstubAllGlobals()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('menampilkan form login', () => {
    renderPage()
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument()
  })

  it('menampilkan aksen visual premium berwarna biru', () => {
    renderPage()

    expect(screen.getByTestId('login-grid-pattern')).toBeInTheDocument()
    expect(screen.getByTestId('login-card-shimmer')).toBeInTheDocument()
    expect(screen.getByTestId('login-icon-container')).toHaveClass('from-sky-500', 'to-blue-600')
    expect(screen.getByTestId('login-title-gradient')).toHaveTextContent('Survei Kepuasan PTSP')
    expect(screen.getByRole('button', { name: /login/i })).toHaveClass(
      'from-sky-500',
      'to-blue-600',
    )
  })

  it('memanggil API login dan redirect saat sukses', async () => {
    vi.spyOn(apiModule, 'login').mockResolvedValue({
      token: 'abc.def.ghi',
      admin: { id: 1, username: 'admin', nama: 'Administrator' },
    })

    renderPage()
    const user = userEvent.setup()

    await user.type(screen.getByLabelText(/username/i), 'admin')
    await user.type(screen.getByLabelText(/password/i), 'admin123')
    await user.click(screen.getByRole('button', { name: /login/i }))

    await waitFor(() => {
      expect(localStorage.getItem('token')).toBe('abc.def.ghi')
    })
  })

  it('mengizinkan tombol tampilkan password diakses lewat keyboard', async () => {
    renderPage()
    const user = userEvent.setup()

    const toggleButton = screen.getByRole('button', { name: /tampilkan kata sandi/i })
    expect(toggleButton).not.toHaveAttribute('tabindex', '-1')
    await user.tab()
    await user.tab()

    expect(toggleButton).toHaveFocus()
  })
})
