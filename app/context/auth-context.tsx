'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { loginWithCredentials, clearLoginCookie } from '@/app/actions/auth'

export type User = {
  email: string
  name?: string
}

type AuthContextValue = {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  error: string | null
  clearError: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

const USER_COOKIE = 'user'

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? decodeURIComponent(match[2]) : null
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const isAuthenticated = !!user

  const clearError = useCallback(() => setError(null), [])

  const login = useCallback(async (email: string, password: string) => {
    setError(null)
    try {
      const userInfo = await loginWithCredentials(email, password)
      setUser(userInfo)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Login failed')
      throw e
    }
  }, [])

  const logout = useCallback(async () => {
    setError(null)
    try {
      await clearLoginCookie()
      setUser(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Logout failed')
    }
  }, [])

  useEffect(() => {
    const isLoggedIn = getCookie('isLoggedIn')
    const userJson = getCookie(USER_COOKIE)
    const applyUser = () => {
      if (isLoggedIn === 'true' && userJson) {
        try {
          setUser(JSON.parse(userJson) as User)
        } catch {
          setUser(null)
        }
      } else {
        setUser(null)
      }
      setIsLoading(false)
    }
    queueMicrotask(applyUser)
  }, [])

  const value: AuthContextValue = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    error,
    clearError,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}
