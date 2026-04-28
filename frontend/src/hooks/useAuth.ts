import { useCallback, useState } from 'react'
import { login as loginApi } from '@/lib/api'
import type { AdminInfo, LoginPayload } from '@/types'

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    () => !!localStorage.getItem('token'),
  )
  const [admin, setAdmin] = useState<AdminInfo | null>(() => {
    const stored = localStorage.getItem('admin')
    return stored ? (JSON.parse(stored) as AdminInfo) : null
  })

  const login = useCallback(async (payload: LoginPayload) => {
    const response = await loginApi(payload)
    localStorage.setItem('token', response.token)
    localStorage.setItem('admin', JSON.stringify(response.admin))
    setIsAuthenticated(true)
    setAdmin(response.admin)
    return response
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('admin')
    setIsAuthenticated(false)
    setAdmin(null)
  }, [])

  return { isAuthenticated, admin, login, logout }
}
