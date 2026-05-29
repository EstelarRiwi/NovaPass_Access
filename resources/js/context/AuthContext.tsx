import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { api } from '../api/client'

interface User {
  id: string
  fullName: string
  email: string
  role: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
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

  const logout = useCallback(() => {
    api.setToken(null)
    localStorage.removeItem('user')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
