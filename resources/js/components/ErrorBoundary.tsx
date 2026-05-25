import { Component, type ReactNode } from 'react'
import { ShieldAlert, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          padding: '2rem',
          background: 'var(--color-bg)',
          textAlign: 'center',
        }}>
          <ShieldAlert size={48} style={{ color: 'var(--color-error)' }} />
          <h2>Algo salió mal</h2>
          <p style={{ color: 'var(--color-text-muted)', maxWidth: 400, fontSize: '0.875rem' }}>
            {this.state.error?.message || 'Error inesperado en la aplicación'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="btn btn-primary btn-lg"
            style={{ maxWidth: 280 }}
          >
            <RefreshCw size={18} /> Reintentar
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
