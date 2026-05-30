import type { ValidationResult } from '../hooks/useValidation'
import { CheckCircle, XCircle, AlertTriangle, User, MapPin, Ticket } from 'lucide-react'

interface Props {
  result: ValidationResult
  onClose: () => void
}

export default function ResultOverlay({ result, onClose }: Props) {
  const isGreen = result.valid
  const isFraud = !result.valid && (result.reason?.toLowerCase().includes('usado') ?? false)

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: isGreen ? 'rgba(34, 197, 94, 0.95)' : 'rgba(220, 38, 38, 0.95)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '2rem',
        animation: 'fadeIn 0.2s ease',
        color: 'white',
      }}
      onClick={onClose}
    >
      {isGreen ? (
        <>
          <div style={{
            width: 96,
            height: 96,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.5rem',
          }}>
            <CheckCircle size={56} />
          </div>
          <h2 style={{
            fontSize: '2rem',
            color: 'white',
            marginBottom: '0.5rem',
            fontFamily: 'var(--font-heading)',
          }}>
            ¡ACCESO PERMITIDO!
          </h2>
          <p style={{ fontSize: '1.125rem', opacity: 0.9, marginBottom: '2rem' }}>
            Boleta válida
          </p>

          {result.ticket && (
            <div style={{
              background: 'rgba(255,255,255,0.15)',
              borderRadius: 'var(--radius-md)',
              padding: '1.5rem',
              width: '100%',
              maxWidth: 360,
              backdropFilter: 'blur(8px)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <User size={20} />
                <span style={{ fontWeight: 600, fontSize: '1.125rem' }}>{result.ticket.customer_name}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', fontSize: '0.9375rem', opacity: 0.9 }}>
                <MapPin size={18} />
                <span><strong>Puesto:</strong> {result.ticket.seat}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9375rem', opacity: 0.9 }}>
                <Ticket size={18} />
                <span><strong>Categoría:</strong> {result.ticket.category}</span>
              </div>
            </div>
          )}
        </>
      ) : isFraud ? (
        <>
          <div style={{
            width: 96,
            height: 96,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.5rem',
          }}>
            <AlertTriangle size={56} />
          </div>
          <h2 style={{
            fontSize: '2rem',
            color: 'white',
            marginBottom: '0.5rem',
            fontFamily: 'var(--font-heading)',
          }}>
            ¡QR YA USADO!
          </h2>
          <p style={{ fontSize: '1.125rem', opacity: 0.9, textAlign: 'center', maxWidth: 320 }}>
            Esta boleta ya fue ingresada. Posible fraude.
          </p>
        </>
      ) : (
        <>
          <div style={{
            width: 96,
            height: 96,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.5rem',
          }}>
            <XCircle size={56} />
          </div>
          <h2 style={{
            fontSize: '2rem',
            color: 'white',
            marginBottom: '0.5rem',
            fontFamily: 'var(--font-heading)',
          }}>
            BOLETA FALSA
          </h2>
          <p style={{ fontSize: '1.125rem', opacity: 0.9, textAlign: 'center', maxWidth: 320 }}>
            {result.reason || 'La boleta no es válida. No permitir el acceso.'}
          </p>
        </>
      )}

      <button
        onClick={(e) => { e.stopPropagation(); onClose() }}
        style={{
          marginTop: '2rem',
          padding: '1rem 3rem',
          background: 'rgba(255,255,255,0.2)',
          color: 'white',
          border: '2px solid rgba(255,255,255,0.4)',
          borderRadius: 'var(--radius-sm)',
          fontSize: '1.0625rem',
          fontWeight: 600,
          cursor: 'pointer',
          backdropFilter: 'blur(8px)',
        }}
      >
        Escanear Siguiente
      </button>
    </div>
  )
}
