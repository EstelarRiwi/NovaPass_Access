import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { LogIn, ScanLine } from 'lucide-react'

export default function Login() {
  const { login, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await login(email, password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión')
    }
  }

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(1200px 700px at 50% -10%, #3a1d6e 0%, #1a0f2e 55%, #120a20 100%)',
      padding: '1.5rem',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 380,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1.8rem',
      }}>
        {/* Brand */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'linear-gradient(135deg, #7C3AED, #F97316)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem',
            boxShadow: '0 0 32px rgba(124,58,237,0.5)',
          }}>
            <ScanLine size={26} color="#fff" />
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: '#fff' }}>
            NovaPass <span style={{ fontWeight: 500, opacity: 0.7 }}>Acceso</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'rgba(196,167,250,0.8)', marginTop: '0.4rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            Control de entrada · Personal autorizado
          </div>
        </div>

        {/* Card */}
        <div style={{
          width: '100%',
          background: 'rgba(255,255,255,0.07)',
          border: '1.5px solid rgba(255,255,255,0.14)',
          borderRadius: 24,
          padding: '2rem',
          backdropFilter: 'blur(16px)',
        }}>
          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.15)',
              border: '1px solid rgba(239,68,68,0.35)',
              color: '#FCA5A5',
              padding: '0.75rem 1rem',
              borderRadius: 12,
              marginBottom: '1.25rem',
              fontSize: '0.875rem',
              textAlign: 'center',
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ fontWeight: 600, fontSize: '0.8rem', marginBottom: '0.4rem', display: 'block', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="portero@estelar.com"
                required
                autoFocus
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1.5px solid rgba(255,255,255,0.18)',
                  borderRadius: 12,
                  padding: '0.85rem 1rem',
                  color: '#fff',
                  fontSize: '0.95rem',
                  width: '100%',
                }}
              />
            </div>
            <div>
              <label style={{ fontWeight: 600, fontSize: '0.8rem', marginBottom: '0.4rem', display: 'block', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1.5px solid rgba(255,255,255,0.18)',
                  borderRadius: 12,
                  padding: '0.85rem 1rem',
                  color: '#fff',
                  fontSize: '0.95rem',
                  width: '100%',
                }}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: '0.5rem',
                width: '100%',
                padding: '1rem',
                borderRadius: 14,
                background: 'linear-gradient(135deg, #7C3AED, #6D28D9)',
                color: '#fff',
                fontWeight: 800,
                fontSize: '1rem',
                fontFamily: 'var(--font-body)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                boxShadow: '0 0 24px rgba(124,58,237,0.4)',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                border: 'none',
              }}
            >
              {loading
                ? <span className="spinner" style={{ width: 20, height: 20, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} />
                : <><LogIn size={18} /> Ingresar al sistema</>
              }
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
