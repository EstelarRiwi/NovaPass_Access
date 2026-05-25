import type { ValidationResult } from '../hooks/useValidation'
import { CheckCircle, XCircle, AlertTriangle, User, MapPin, Ticket } from 'lucide-react'

interface Props {
  result: ValidationResult
  onClose: () => void
}

export default function ResultOverlay({ result, onClose }: Props) {
  const isGreen = result.valid
  const isFraud = !result.valid && (result.reason?.toLowerCase().includes('usado') ?? false)

  const accentColor = isGreen ? '#4ADE80' : '#F87171'
  const accentRgb   = isGreen ? '74, 222, 128' : '248, 113, 113'
  const bgCard      = isGreen ? 'rgba(34, 197, 94, 0.08)' : 'rgba(248, 113, 113, 0.08)'
  const borderColor = isGreen ? 'rgba(34, 197, 94, 0.3)' : 'rgba(248, 113, 113, 0.3)'

  const bg = isGreen
    ? 'radial-gradient(ellipse 80% 60% at 50% 20%, rgba(34, 197, 94, 0.22) 0%, #0A0A0F 65%), #0A0A0F'
    : 'radial-gradient(ellipse 80% 60% at 50% 20%, rgba(248, 113, 113, 0.18) 0%, #0A0A0F 65%), #0A0A0F'

  const headline = isGreen
    ? '¡ACCESO PERMITIDO!'
    : isFraud
    ? '¡QR YA USADO!'
    : 'ACCESO DENEGADO'

  const subline = isGreen
    ? 'Boleta válida — bienvenido'
    : isFraud
    ? 'Esta boleta ya fue ingresada. Posible fraude.'
    : (result.reason || 'La boleta no es válida. No permitir el acceso.')

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: bg,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '2rem 1.5rem',
        animation: 'fadeIn 0.18s ease',
        color: 'var(--color-text)',
      }}
      onClick={onClose}
    >
      {/* Content wrapper — slides up */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
          maxWidth: 380,
          animation: 'slideInUp 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Icon with animated rings */}
        <div style={{
          position: 'relative',
          width: 160,
          height: 160,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.75rem',
        }}>
          {/* Outer ring */}
          <div style={{
            position: 'absolute',
            inset: -16,
            borderRadius: '50%',
            border: `2px solid rgba(${accentRgb}, 0.25)`,
            animation: 'pulse-ring 2s ease-out infinite',
          }} />
          {/* Mid ring */}
          <div style={{
            position: 'absolute',
            inset: -4,
            borderRadius: '50%',
            border: `2px solid rgba(${accentRgb}, 0.4)`,
            animation: 'pulse-ring 2s ease-out infinite 0.5s',
          }} />
          {/* Icon circle */}
          <div style={{
            width: 120,
            height: 120,
            borderRadius: '50%',
            background: bgCard,
            border: `2px solid ${borderColor}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 0 48px rgba(${accentRgb}, 0.35), inset 0 1px 0 rgba(255,255,255,0.08)`,
          }}>
            {isGreen
              ? <CheckCircle size={60} color={accentColor} />
              : isFraud
              ? <AlertTriangle size={60} color={accentColor} />
              : <XCircle size={60} color={accentColor} />
            }
          </div>
        </div>

        {/* Headline */}
        <h2 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 'clamp(1.75rem, 6vw, 2.25rem)',
          color: accentColor,
          textShadow: `0 0 32px rgba(${accentRgb}, 0.6)`,
          textAlign: 'center',
          marginBottom: '0.625rem',
          letterSpacing: '0.01em',
        }}>
          {headline}
        </h2>

        {/* Subline */}
        <p style={{
          fontSize: '1rem',
          color: 'var(--color-text-muted)',
          textAlign: 'center',
          marginBottom: '2rem',
          lineHeight: 1.5,
          maxWidth: 300,
        }}>
          {subline}
        </p>

        {/* Ticket info card — only on valid */}
        {isGreen && result.ticket && (
          <div style={{
            background: bgCard,
            border: `1px solid ${borderColor}`,
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem 1.5rem',
            width: '100%',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            marginBottom: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: `rgba(${accentRgb}, 0.12)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <User size={16} color={accentColor} />
              </div>
              <span style={{ fontWeight: 700, fontSize: '1.0625rem' }}>
                {result.ticket.customer_name}
              </span>
            </div>

            <div style={{ height: 1, background: borderColor }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', fontSize: '0.9375rem' }}>
                <MapPin size={15} color={accentColor} />
                <span style={{ color: 'var(--color-text-muted)' }}>Puesto:</span>
                <span style={{ fontWeight: 600 }}>{result.ticket.seat}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', fontSize: '0.9375rem' }}>
                <Ticket size={15} color={accentColor} />
                <span style={{ color: 'var(--color-text-muted)' }}>Categoría:</span>
                <span style={{ fontWeight: 600 }}>{result.ticket.category}</span>
              </div>
            </div>
          </div>
        )}

        {/* Close / next button */}
        <button
          onClick={onClose}
          style={{
            padding: '0.9rem 3.5rem',
            background: bgCard,
            color: accentColor,
            border: `1px solid ${borderColor}`,
            borderRadius: 'var(--radius-sm)',
            fontSize: '1rem',
            fontWeight: 700,
            cursor: 'pointer',
            backdropFilter: 'blur(8px)',
            transition: 'all 200ms ease',
            letterSpacing: '0.01em',
            width: '100%',
          }}

        >
          Escanear Siguiente
        </button>

        <p style={{
          marginTop: '1rem',
          fontSize: '0.75rem',
          color: 'var(--color-text-muted)',
          opacity: 0.6,
        }}>
          Toca en cualquier lugar para continuar
        </p>
      </div>
    </div>
  )
}
