import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { LogIn, ShieldAlert, BugPlay } from 'lucide-react'

export default function Login() {
  const { login, demoLogin, loading } = useAuth()
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
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #7C3AED 0%, #4C1D95 100%)',
      padding: '1.5rem',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 400,
        background: 'white',
        borderRadius: 'var(--radius-lg)',
        padding: '2.5rem',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'var(--color-bg-alt)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem',
          }}>
            <ShieldAlert size={32} color="var(--color-primary)" />
          </div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>NovaPass — Control de Acceso</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
            Personal de portería
          </p>
        </div>

        {error && (
          <div style={{
            background: '#FEE2E2',
            color: '#991B1B',
            padding: '0.75rem',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '1rem',
            fontSize: '0.875rem',
            textAlign: 'center',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ fontWeight: 500, fontSize: '0.875rem', marginBottom: '0.375rem', display: 'block' }}>
              Usuario
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
              required
              autoFocus
            />
          </div>
          <div>
            <label style={{ fontWeight: 500, fontSize: '0.875rem', marginBottom: '0.375rem', display: 'block' }}>
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
            {loading ? (
              <span className="spinner" style={{ width: 20, height: 20, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} />
            ) : (
              <><LogIn size={18} /> Ingresar</>
            )}
          </button>
        </form>

        <div style={{
          marginTop: '1.5rem',
          paddingTop: '1.5rem',
          borderTop: '1px solid var(--color-border)',
        }}>
          <button
            type="button"
            onClick={demoLogin}
            disabled={loading}
            className="btn btn-lg"
            style={{
              width: '100%',
              background: '#F3E8FF',
              color: 'var(--color-primary)',
              fontWeight: 600,
            }}
          >
            <BugPlay size={18} /> Modo Demo (sin backend)
          </button>
        </div>
      </div>
    </div>
  )
}
