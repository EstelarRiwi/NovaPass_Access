const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
let redirecting = false

function getToken(): string | null {
  return localStorage.getItem('token')
}

function setToken(token: string | null) {
  if (token) localStorage.setItem('token', token)
  else localStorage.removeItem('token')
}

function isTokenExpired(): boolean {
  const token = getToken()
  if (!token) return true
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return true
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
    return !payload.exp || payload.exp * 1000 < Date.now()
  } catch {
    return true
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })

  if (res.status === 401) {
    if (!redirecting && isTokenExpired()) {
      redirecting = true
      setToken(null)
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    throw new Error('Sesión expirada')
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const message = body.error?.message || body.message || body.error?.code || `HTTP ${res.status}`
    throw new Error(message)
  }

  const json = await res.json()

  if (json && typeof json === 'object' && 'success' in json) {
    if (!json.success) {
      throw new Error(json.error?.message || json.error?.code || 'Request failed')
    }
    return json.data as T
  }

  return json as T
}

export const api = {
  getToken,
  setToken,
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
}
