import { useEffect, useRef, useState, useCallback } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { useValidation } from '../hooks/useValidation'
import { useEntryCount } from '../hooks/useEntryCount'
import { useAuth } from '../context/AuthContext'
import { ScanLine, Keyboard, Barcode, Users, LogOut, Zap, CheckCircle2 } from 'lucide-react'
import ResultOverlay from '../components/ResultOverlay'

const SCANNER_ID = 'qr-scanner'

function playBeep(ok: boolean) {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = ok ? 880 : 220
    osc.type = 'sine'
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (ok ? 0.15 : 0.4))
    osc.start()
    osc.stop(ctx.currentTime + (ok ? 0.15 : 0.4))
  } catch {}
}

export default function Scanner() {
  const { logout } = useAuth()
  const { validate, result, loading, reset } = useValidation()
  const { count, eventName, startPolling } = useEntryCount()

  const [mode, setMode] = useState<'camera' | 'scanner' | 'manual'>('scanner')
  const [manualInput, setManualInput] = useState('')
  const [scanSuccess, setScanSuccess] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const manualRef = useRef<HTMLInputElement>(null)
  const scanBufferRef = useRef('')
  const scanTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const isRunningRef = useRef(false)

  useEffect(() => {
    startPolling()
  }, [])

  useEffect(() => {
    if (mode !== 'camera') return

    let mounted = true
    const start = async () => {
      try {
        const scanner = new Html5Qrcode(SCANNER_ID)
        scannerRef.current = scanner

        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            if (mounted && !loading) handleScan(decodedText)
          },
          () => {}
        )
        isRunningRef.current = true
      } catch {
        if (mounted) setCameraError('No se pudo iniciar la cámara. Usa el modo manual.')
      }
    }

    start()

    return () => {
      mounted = false
      if (isRunningRef.current) {
        scannerRef.current?.stop().catch(() => {})
        isRunningRef.current = false
      }
    }
  }, [mode])

  useEffect(() => {
    if (mode === 'manual') return

    const handler = (e: KeyboardEvent) => {
      if (e.key.length === 1) {
        scanBufferRef.current += e.key
        clearTimeout(scanTimerRef.current)
      }

      if (e.key === 'Enter' && scanBufferRef.current.length > 0) {
        const code = scanBufferRef.current
        scanBufferRef.current = ''
        e.preventDefault()
        handleScan(code)
        return
      }

      if (e.key.length === 1) {
        scanTimerRef.current = setTimeout(() => {
          const code = scanBufferRef.current
          scanBufferRef.current = ''
          if (code.length >= 5) handleScan(code)
        }, 150)
      }
    }

    window.addEventListener('keydown', handler)
    return () => {
      window.removeEventListener('keydown', handler)
      clearTimeout(scanTimerRef.current)
    }
  }, [mode])

  const handleScan = useCallback(async (token: string) => {
    if (loading) return
    const res = await validate(token.trim())
    playBeep(res?.valid ?? false)
    navigator.vibrate?.(res?.valid ? 100 : 300)
    if (res?.valid) {
      setScanSuccess(true)
      setTimeout(() => setScanSuccess(false), 1500)
    }
  }, [validate, loading])

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualInput.trim()) return
    await handleScan(manualInput.trim())
    setManualInput('')
    manualRef.current?.focus()
  }

  const resetAndRetry = () => {
    reset()
    setManualInput('')
    manualRef.current?.focus()
  }

  const modes: { key: typeof mode; label: string; Icon: React.ElementType }[] = [
    { key: 'scanner', label: 'Lector', Icon: Barcode },
    { key: 'camera',  label: 'Cámara', Icon: ScanLine },
    { key: 'manual',  label: 'Manual', Icon: Keyboard },
  ]

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--color-bg)',
    }}>
      {/* ── Header ── */}
      <header style={{
        background: 'rgba(15, 14, 24, 0.96)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--glass-border)',
        padding: '0.875rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.4)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Zap size={20} color="var(--color-primary-light)" fill="var(--color-primary-light)" />
          <span style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '1.25rem',
            color: 'var(--color-primary-light)',
            textShadow: '0 0 20px rgba(192, 132, 252, 0.45)',
          }}>
            NovaPass
          </span>
          {eventName && (
            <span style={{
              marginLeft: '0.5rem',
              fontSize: '0.75rem',
              color: 'var(--color-text-muted)',
              background: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
              borderRadius: '999px',
              padding: '0.2rem 0.625rem',
            }}>
              {eventName}
            </span>
          )}
        </div>

        <button
          onClick={logout}
          className="btn btn-outline btn-sm"
          style={{ gap: '0.375rem' }}
        >
          <LogOut size={13} />
          Salir
        </button>
      </header>

      {/* ── Entry count stat ── */}
      <div style={{
        background: 'linear-gradient(90deg, rgba(147, 51, 234, 0.06) 0%, rgba(147, 51, 234, 0.1) 50%, rgba(147, 51, 234, 0.06) 100%)',
        borderBottom: '1px solid var(--glass-border)',
        padding: '1rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
      }}>
        {/* Live dot */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <span style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: '#4ADE80',
            boxShadow: '0 0 8px rgba(74, 222, 128, 0.7)',
            animation: 'pulse 1.8s ease-in-out infinite',
            display: 'inline-block',
          }} />
          <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
            En vivo
          </span>
        </div>

        <div style={{ width: 1, height: 28, background: 'var(--glass-border)' }} />

        {/* Count */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
          <Users size={16} color="var(--color-primary-light)" style={{ flexShrink: 0, marginBottom: -2 }} />
          <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>Ingresos:</span>
          <span style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '1.75rem',
            color: 'var(--color-primary-light)',
            lineHeight: 1,
            textShadow: '0 0 16px rgba(192, 132, 252, 0.4)',
          }}>
            {count}
          </span>
        </div>
      </div>

      {/* ── Main area ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '1rem', gap: '0.875rem' }}>

        {/* Mode toggle */}
        <div style={{
          display: 'flex',
          gap: '0.25rem',
          background: 'rgba(26, 24, 40, 0.9)',
          border: '1px solid var(--glass-border)',
          borderRadius: 'var(--radius-md)',
          padding: '0.3rem',
        }}>
          {modes.map(({ key, label, Icon }) => {
            const active = mode === key
            return (
              <button
                key={key}
                onClick={() => { setMode(key); setCameraError(''); reset() }}
                style={{
                  flex: 1,
                  padding: '0.7rem 0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  background: active
                    ? 'linear-gradient(135deg, #9333EA, #7C3AED)'
                    : 'transparent',
                  color: active ? 'white' : 'var(--color-text-muted)',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  transition: 'all 200ms ease',
                  boxShadow: active ? '0 4px 16px rgba(147, 51, 234, 0.4)' : 'none',
                }}
              >
                <Icon size={17} />
                {label}
              </button>
            )
          })}
        </div>

        {/* ── Scanner mode ── */}
        {mode === 'scanner' && (
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '2rem',
            padding: '2.5rem 2rem',
            background: 'var(--glass-bg)',
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--radius-lg)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}>
            {/* Animated rings + icon */}
            <div style={{ position: 'relative', width: 140, height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {/* Outer ring */}
              <div style={{
                position: 'absolute',
                inset: -20,
                borderRadius: '50%',
                border: '2px solid rgba(147, 51, 234, 0.25)',
                animation: 'pulse-ring 2.4s ease-out infinite',
              }} />
              {/* Mid ring */}
              <div style={{
                position: 'absolute',
                inset: -8,
                borderRadius: '50%',
                border: '2px solid rgba(147, 51, 234, 0.35)',
                animation: 'pulse-ring 2.4s ease-out infinite 0.6s',
              }} />
              {/* Inner ring */}
              <div style={{
                position: 'absolute',
                inset: 2,
                borderRadius: '50%',
                border: '2px solid rgba(147, 51, 234, 0.5)',
                animation: 'pulse-ring 2.4s ease-out infinite 1.2s',
              }} />
              {/* Icon circle */}
              <div style={{
                width: 100,
                height: 100,
                borderRadius: '50%',
                background: 'rgba(147, 51, 234, 0.1)',
                border: '2px solid rgba(147, 51, 234, 0.4)',
                boxShadow: '0 0 32px rgba(147, 51, 234, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Barcode size={48} color="var(--color-primary-light)" />
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <h3 style={{ fontSize: '1.375rem', marginBottom: '0.5rem' }}>Lector Físico</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                Escanea el código con el lector AON HS-200
              </p>
            </div>

            {/* Status pill */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.625rem',
              padding: '0.625rem 1.5rem',
              background: scanSuccess
                ? 'rgba(34, 197, 94, 0.12)'
                : 'rgba(147, 51, 234, 0.08)',
              border: `1px solid ${scanSuccess ? 'rgba(34, 197, 94, 0.3)' : 'rgba(147, 51, 234, 0.25)'}`,
              borderRadius: '999px',
              color: scanSuccess ? '#4ADE80' : 'var(--color-primary-light)',
              fontSize: '0.875rem',
              fontWeight: 600,
              transition: 'all 300ms ease',
              boxShadow: scanSuccess ? '0 0 16px rgba(74, 222, 128, 0.2)' : 'none',
            }}>
              {scanSuccess ? (
                <CheckCircle2 size={16} />
              ) : (
                <span style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: 'var(--color-primary-light)',
                  animation: 'pulse 1.5s ease-in-out infinite',
                  flexShrink: 0,
                }} />
              )}
              {scanSuccess ? '¡Escaneado exitosamente!' : 'Listo para escanear'}
            </div>
          </div>
        )}

        {/* ── Camera mode ── */}
        {mode === 'camera' && (
          <div style={{
            flex: 1,
            background: '#000',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 320,
            border: '1px solid var(--glass-border)',
          }}>
            {cameraError ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1rem',
                padding: '2.5rem 2rem',
                textAlign: 'center',
              }}>
                <p className="alert-error" style={{ width: '100%' }}>{cameraError}</p>
                <button
                  onClick={() => setMode('scanner')}
                  className="btn btn-primary btn-sm"
                  style={{ width: 'auto' }}
                >
                  Usar Lector Físico
                </button>
              </div>
            ) : (
              <>
                <div id={SCANNER_ID} style={{ width: '100%', height: '100%' }} />

                {/* Scanning line animation */}
                <div style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  height: 2,
                  background: 'linear-gradient(90deg, transparent, var(--color-primary-light), transparent)',
                  boxShadow: '0 0 12px rgba(192, 132, 252, 0.8)',
                  animation: 'scanline 2.2s linear infinite',
                  pointerEvents: 'none',
                }} />

                {/* Corner markers */}
                {(['top-left','top-right','bottom-left','bottom-right'] as const).map(corner => {
                  const isTop = corner.startsWith('top')
                  const isLeft = corner.endsWith('left')
                  return (
                    <div key={corner} style={{
                      position: 'absolute',
                      width: 24,
                      height: 24,
                      [isTop ? 'top' : 'bottom']: '50%',
                      [isLeft ? 'left' : 'right']: '50%',
                      transform: `translate(${isLeft ? '-125px' : '101px'}, ${isTop ? '-125px' : '101px'})`,
                      borderTop: isTop ? '3px solid var(--color-primary-light)' : 'none',
                      borderBottom: !isTop ? '3px solid var(--color-primary-light)' : 'none',
                      borderLeft: isLeft ? '3px solid var(--color-primary-light)' : 'none',
                      borderRight: !isLeft ? '3px solid var(--color-primary-light)' : 'none',
                      borderRadius: isTop && isLeft ? '3px 0 0 0' : isTop ? '0 3px 0 0' : isLeft ? '0 0 0 3px' : '0 0 3px 0',
                      opacity: 0.8,
                    }} />
                  )
                })}
              </>
            )}

            {loading && (
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(0,0,0,0.65)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 'var(--radius-lg)',
              }}>
                <div className="spinner" style={{ width: 44, height: 44, borderWidth: 4 }} />
              </div>
            )}
          </div>
        )}

        {/* ── Manual mode ── */}
        {mode === 'manual' && (
          <form onSubmit={handleManualSubmit} style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            justifyContent: 'center',
            padding: '2.5rem 1.75rem',
            background: 'var(--glass-bg)',
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--radius-lg)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: 'rgba(147, 51, 234, 0.1)',
                border: '1px solid rgba(147, 51, 234, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem',
              }}>
                <Keyboard size={38} color="var(--color-text-muted)" />
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.375rem' }}>Ingreso Manual</h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                Ingresa el código de la boleta
              </p>
            </div>

            <input
              ref={manualRef}
              type="text"
              value={manualInput}
              onChange={e => setManualInput(e.target.value)}
              placeholder="Código QR..."
              autoFocus
              style={{
                textAlign: 'center',
                fontSize: '1.125rem',
                padding: '1rem',
                letterSpacing: '0.05em',
              }}
            />

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={loading || !manualInput.trim()}
            >
              {loading
                ? <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
                : 'Validar Boleta'
              }
            </button>
          </form>
        )}

        {/* Camera status bar */}
        {mode === 'camera' && !cameraError && (
          <div style={{
            textAlign: 'center',
            padding: '0.625rem',
            fontSize: '0.8125rem',
            color: 'var(--color-text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
          }}>
            <span style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: scanSuccess ? '#4ADE80' : 'var(--color-primary-light)',
              boxShadow: scanSuccess ? '0 0 8px rgba(74,222,128,0.6)' : 'none',
              animation: scanSuccess ? 'none' : 'pulse 1.5s ease-in-out infinite',
            }} />
            {scanSuccess ? '¡Escaneado exitosamente!' : 'Esperando código QR...'}
          </div>
        )}
      </div>

      {result && <ResultOverlay result={result} onClose={resetAndRetry} />}
    </div>
  )
}
