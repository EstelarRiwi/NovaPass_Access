import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { api } from '../api/client'

interface User {
  id: number
  name: string
  email: string
  role: string
}

const DEMO_TOKEN = 'demo_scanner_token_2026'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  demoLogin: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('user')
    return stored ? JSON.parse(stored) : null
  })
  const [loading, setLoading] = useState(false)

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true)
    try {
      const data = await api.post<{ token: string; user: User }>('/auth/login', { email, password })
      if (data.user.role !== 'scanner') throw new Error('Acceso solo para personal de portería')
      api.setToken(data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      setUser(data.user)
    } finally {
      setLoading(false)
    }
  }, [])

  const demoLogin = useCallback(async () => {
    setLoading(true)
    await new Promise(r => setTimeout(r, 600))
    const demoUser: User = {
      id: 0,
      name: 'Demo Portería',
      email: 'demo@novapass.app',
      role: 'scanner',
    }
    api.setToken(DEMO_TOKEN)
    localStorage.setItem('user', JSON.stringify(demoUser))
    setUser(demoUser)
    setLoading(false)
  }, [])

  const logout = useCallback(() => {
    api.setToken(null)
    localStorage.removeItem('user')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, demoLogin }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
