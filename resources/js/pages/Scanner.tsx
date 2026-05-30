import { useEffect, useRef, useState, useCallback } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { useValidation } from '../hooks/useValidation'
import { useEntryCount } from '../hooks/useEntryCount'
import { useAuth } from '../context/AuthContext'
import { ScanLine, Keyboard, Barcode, Users, LogOut, Zap } from 'lucide-react'
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

  // Camera scanner
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
            if (mounted && !loading) {
              handleScan(decodedText)
            }
          },
          () => {}
        )
        isRunningRef.current = true
      } catch (err) {
        if (mounted) {
          setCameraError('No se pudo iniciar la cámara. Usa el modo manual.')
        }
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

  // Keyboard wedge reader (physical scanner) — scanner & camera modes
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
          if (code.length >= 5) {
            handleScan(code)
          }
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

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--color-bg)',
    }}>
      {/* Top bar */}
      <header style={{
        background: 'var(--color-primary-dark)',
        color: 'white',
        padding: '0.75rem 1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Zap size={20} />
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.125rem' }}>NovaPass</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {eventName && (
            <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>{eventName}</span>
          )}
          <button onClick={logout} style={{
            background: 'rgba(255,255,255,0.15)',
            color: 'white',
            border: 'none',
            padding: '0.375rem 0.75rem',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.75rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
          }}>
            <LogOut size={14} /> Salir
          </button>
        </div>
      </header>

      {/* Entry count bar */}
      <div style={{
        background: 'white',
        borderBottom: '1px solid var(--color-border)',
        padding: '0.5rem 1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        fontSize: '0.875rem',
        color: 'var(--color-text-muted)',
      }}>
        <Users size={16} />
        <span>Ingresos: <strong style={{ color: 'var(--color-primary)', fontSize: '1.125rem' }}>{count}</strong></span>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '1rem' }}>
        {/* Mode toggle */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '1rem',
          background: 'white',
          borderRadius: 'var(--radius-md)',
          padding: '0.375rem',
          boxShadow: 'var(--shadow-sm)',
        }}>
          <button
            onClick={() => { setMode('scanner'); setCameraError(''); reset() }}
            style={{
              flex: 1,
              padding: '0.75rem',
              borderRadius: 'var(--radius-sm)',
              background: mode === 'scanner' ? 'var(--color-primary)' : 'transparent',
              color: mode === 'scanner' ? 'white' : 'var(--color-text)',
              fontWeight: 600,
              fontSize: '0.875rem',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
            }}
          >
            <Barcode size={18} /> Lector
          </button>
          <button
            onClick={() => { setMode('camera'); setCameraError(''); reset() }}
            style={{
              flex: 1,
              padding: '0.75rem',
              borderRadius: 'var(--radius-sm)',
              background: mode === 'camera' ? 'var(--color-primary)' : 'transparent',
              color: mode === 'camera' ? 'white' : 'var(--color-text)',
              fontWeight: 600,
              fontSize: '0.875rem',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
            }}
          >
            <ScanLine size={18} /> Cámara
          </button>
          <button
            onClick={() => { setMode('manual'); reset() }}
            style={{
              flex: 1,
              padding: '0.75rem',
              borderRadius: 'var(--radius-sm)',
              background: mode === 'manual' ? 'var(--color-primary)' : 'transparent',
              color: mode === 'manual' ? 'white' : 'var(--color-text)',
              fontWeight: 600,
              fontSize: '0.875rem',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
            }}
          >
            <Keyboard size={18} /> Manual
          </button>
        </div>

        {/* Scanner area */}
        {mode === 'camera' ? (
          <div style={{
            flex: 1,
            background: '#000',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 300,
          }}>
            {cameraError ? (
              <div style={{ color: 'white', textAlign: 'center', padding: '2rem' }}>
                <p style={{ marginBottom: '0.75rem' }}>{cameraError}</p>
                <button onClick={() => setMode('scanner')} className="btn btn-primary">Usar Lector Físico</button>
              </div>
            ) : (
              <div id={SCANNER_ID} style={{ width: '100%', height: '100%' }} />
            )}
            {loading && (
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <div className="spinner" style={{ width: 40, height: 40, borderWidth: 4, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} />
              </div>
            )}
          </div>
        ) : mode === 'scanner' ? (
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1.5rem',
            padding: '2rem',
            background: 'white',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-sm)',
          }}>
            <Barcode size={64} style={{ color: 'var(--color-primary)' }} />
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>Lector Físico</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                Escanea el código con el lector AON HS-200
              </p>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              background: 'var(--color-primary-light)',
              borderRadius: '999px',
              color: 'var(--color-primary)',
              fontSize: '0.8125rem',
              fontWeight: 500,
            }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: scanSuccess ? 'var(--color-success)' : 'var(--color-primary)',
                animation: scanSuccess ? 'none' : 'pulse 1.5s infinite',
              }} />
              {scanSuccess ? '¡Escaneado exitosamente!' : 'Listo para escanear'}
            </div>
          </div>
        ) : (
          <form onSubmit={handleManualSubmit} style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            justifyContent: 'center',
            padding: '1rem',
            background: 'white',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-sm)',
          }}>
            <div style={{ textAlign: 'center' }}>
              <Keyboard size={48} style={{ color: 'var(--color-text-muted)', marginBottom: '0.75rem' }} />
              <h3 style={{ fontSize: '1.125rem', marginBottom: '0.25rem' }}>Ingreso Manual</h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                Ingresa el código manualmente
              </p>
            </div>
            <input
              ref={manualRef}
              type="text"
              value={manualInput}
              onChange={e => setManualInput(e.target.value)}
              placeholder="Código QR..."
              autoFocus
              style={{ textAlign: 'center', fontSize: '1.125rem', padding: '1rem' }}
            />
            <button type="submit" className="btn btn-primary btn-lg" disabled={loading || !manualInput.trim()}>
              {loading ? <span className="spinner" style={{ width: 20, height: 20, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} /> : 'Validar'}
            </button>
          </form>
        )}

        {/* Scanner status */}
        {mode === 'camera' && !cameraError && (
          <div style={{
            textAlign: 'center',
            padding: '0.75rem',
            fontSize: '0.8125rem',
            color: 'var(--color-text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: scanSuccess ? 'var(--color-success)' : 'var(--color-primary)',
              animation: scanSuccess ? 'none' : 'pulse 1.5s infinite',
            }} />
            {scanSuccess ? '¡Escaneado exitosamente!' : 'Esperando código QR...'}
          </div>
        )}
      </div>

      {/* Result overlay */}
      {result && <ResultOverlay result={result} onClose={resetAndRetry} />}
    </div>
  )
}
