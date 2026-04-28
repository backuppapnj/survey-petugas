import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuth } from './useAuth'
import * as apiModule from '@/lib/api'

describe('useAuth', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('isAuthenticated awal false jika tidak ada token', () => {
    const { result } = renderHook(() => useAuth())
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.admin).toBeNull()
  })

  it('login menyimpan token dan admin ke localStorage', async () => {
    const fakeResponse = {
      token: 'abc.def.ghi',
      admin: { id: 1, username: 'admin', nama: 'Administrator' },
    }
    vi.spyOn(apiModule, 'login').mockResolvedValue(fakeResponse)

    const { result } = renderHook(() => useAuth())

    await act(async () => {
      await result.current.login({ username: 'admin', password: 'admin123' })
    })

    expect(localStorage.getItem('token')).toBe('abc.def.ghi')
    expect(JSON.parse(localStorage.getItem('admin')!)).toEqual(fakeResponse.admin)
    expect(result.current.isAuthenticated).toBe(true)
  })

  it('logout menghapus token dan admin', () => {
    localStorage.setItem('token', 'abc')
    localStorage.setItem('admin', JSON.stringify({ id: 1, username: 'a', nama: 'A' }))

    const { result } = renderHook(() => useAuth())
    expect(result.current.isAuthenticated).toBe(true)

    act(() => {
      result.current.logout()
    })

    expect(localStorage.getItem('token')).toBeNull()
    expect(localStorage.getItem('admin')).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
  })
})
