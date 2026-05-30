import { useEffect, useRef, useState, useCallback } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { useValidation } from '../hooks/useValidation'
import { useEntryCount } from '../hooks/useEntryCount'
import { useAuth } from '../context/AuthContext'
import { ScanLine, Keyboard, LogOut, Check, X, RotateCcw } from 'lucide-react'
import ResultOverlay from '../components/ResultOverlay'

const SCANNER_ID = 'qr-scanner'
const TOTAL_CAPACITY = 3000

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

interface RecentScan {
  id: string
  name: string
  seat: string
  result: 'valid' | 'used' | 'fake'
  time: string
}

export default function Scanner() {
  const { user, logout } = useAuth()
  const { validate, result, loading, reset } = useValidation()
  const { count, eventName, startPolling } = useEntryCount()

  const [mode, setMode] = useState<'camera' | 'scanner' | 'manual'>('scanner')
  const [manualInput, setManualInput] = useState('')
  const [scanning, setScanning] = useState(false)
  const [flash, setFlash] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const [recentScans, setRecentScans] = useState<RecentScan[]>([])

  const scannerRef = useRef<Html5Qrcode | null>(null)
  const manualRef = useRef<HTMLInputElement>(null)
  const scanBufferRef = useRef('')
  const scanTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const isRunningRef = useRef(false)

  const pct = Math.min(100, Math.round((count / TOTAL_CAPACITY) * 100))

  const now = () => new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })

  useEffect(() => { startPolling() }, [])

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
          { fps: 15 },
          (decodedText) => { if (mounted) handleScanRef.current(decodedText) },
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

  // Keyboard wedge (physical scanner)
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
    setScanning(true)
    setFlash(true)
    setTimeout(() => setFlash(false), 460)

    const res = await validate(token.trim())
    playBeep(res?.valid ?? false)
    navigator.vibrate?.(res?.valid ? 100 : 300)

    setScanning(false)

    const isUsed = !res?.valid && res?.reason?.toLowerCase().includes('usado')
    const scanEntry: RecentScan = {
      id: Date.now().toString(),
      name: res?.ticket?.customer_name || (res?.valid ? 'Cliente' : 'QR no reconocido'),
      seat: res?.ticket ? `${res.ticket.category} · ${res.ticket.seat}` : (isUsed ? 'Entrada ya usada' : 'QR falso detectado'),
      result: res?.valid ? 'valid' : (isUsed ? 'used' : 'fake'),
      time: now(),
    }
    setRecentScans(prev => [scanEntry, ...prev].slice(0, 5))
  }, [validate, loading])

  // Always-current ref so camera callback never holds a stale closure
  const handleScanRef = useRef(handleScan)
  handleScanRef.current = handleScan

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
    <div className="acc-app">
      {/* Top bar */}
        <div className="acc-top">
          <div className="who">
            <div className="av" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem' }}>
              {user?.name?.charAt(0)?.toUpperCase() || 'S'}
            </div>
            <div>
              <div className="nm">{user?.name || 'Scanner'}</div>
              <div className="gt">{eventName || 'Puerta Principal'}</div>
            </div>
          </div>
          <button className="acc-logout" onClick={logout} aria-label="Salir">
            <LogOut size={18} />
          </button>
        </div>

        {/* Live counter */}
        <div className="acc-counter">
          <div className="ring" style={{ '--p': pct } as React.CSSProperties}>
            <div className="rin">
              <b>{pct}%</b>
              <span>Aforo</span>
            </div>
          </div>
          <div className="acc-counter-meta">
            <div className="ev">{eventName || 'Evento en curso'}</div>
            <div className="vn">Control de acceso activo</div>
            <div className="acc-counter-stats">
              <div><span className="dot-g" /><b>{count.toLocaleString('es-CO')}</b> ingresos</div>
              <div><span className="dot-r" /><b>{recentScans.filter(s => s.result !== 'valid').length}</b> rechazos</div>
            </div>
          </div>
        </div>

        {/* Viewfinder */}
        <div className="acc-view">
          <div className="vf-cam" />
          {!scanning && <div className="vf-pulse" />}

          {mode === 'camera' ? (
            /* Camera mode — feed + corner bracket overlay */
            <div style={{ position: 'absolute', inset: 0 }}>
              {cameraError ? (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', textAlign: 'center', zIndex: 5 }}>
                  <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '1rem', fontSize: '0.88rem' }}>{cameraError}</p>
                  <button onClick={() => setMode('scanner')} className="acc-scan-btn" style={{ width: 'auto', padding: '0.7rem 1.4rem' }}>
                    Usar Lector Físico
                  </button>
                </div>
              ) : (
                <div id={SCANNER_ID} style={{ width: '100%', height: '100%' }} />
              )}
              {/* Corner brackets over camera feed */}
              {!cameraError && (
                <div className="vf-frame" style={{ pointerEvents: 'none' }}>
                  <div className="corner tl" />
                  <div className="corner tr" />
                  <div className="corner bl" />
                  <div className="corner br" />
                  {scanning && <div className="vf-scanline" />}
                </div>
              )}
            </div>
          ) : mode === 'manual' ? (
            /* Manual mode — form inside viewfinder */
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', zIndex: 5 }}>
              <form onSubmit={handleManualSubmit} style={{ width: '100%', maxWidth: 260, display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                <input
                  ref={manualRef}
                  type="text"
                  value={manualInput}
                  onChange={e => setManualInput(e.target.value)}
                  placeholder="Ingresa el código QR..."
                  autoFocus
                  style={{ background: 'rgba(255,255,255,0.12)', border: '1.5px solid rgba(255,255,255,0.3)', borderRadius: 12, padding: '0.85rem 1rem', color: '#fff', fontSize: '0.92rem', textAlign: 'center' }}
                />
                <button
                  type="submit"
                  className="acc-scan-btn"
                  disabled={loading || !manualInput.trim()}
                >
                  {loading ? <span className="spinner" style={{ width: 18, height: 18, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} /> : <><Keyboard size={17} /> Validar</>}
                </button>
              </form>
            </div>
          ) : (
            /* Physical scanner (keyboard wedge) mode — AON HS-200 waiting UI */
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.1rem', zIndex: 5 }}>
              <div style={{
                width: 80, height: 80, borderRadius: 20,
                background: scanning ? 'rgba(167,139,250,0.25)' : 'rgba(255,255,255,0.07)',
                border: `2px solid ${scanning ? 'rgba(167,139,250,0.7)' : 'rgba(255,255,255,0.15)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s',
              }}>
                <ScanLine size={36} style={{ color: scanning ? '#a78bfa' : 'rgba(255,255,255,0.5)' }} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.88rem', marginBottom: '0.25rem' }}>
                  {scanning ? 'Leyendo…' : 'Esperando escaneo'}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.06em' }}>
                  AON HS-200 conectado
                </div>
              </div>
              <div style={{
                display: 'flex', gap: '4px', alignItems: 'center',
              }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: scanning ? '#a78bfa' : 'rgba(255,255,255,0.25)',
                    animation: scanning ? `pulse 0.6s ease ${i * 0.15}s infinite` : 'none',
                  }} />
                ))}
              </div>
            </div>
          )}

          <div className="vf-hint">
            {scanning ? 'Leyendo código QR…' : mode === 'manual' ? 'Ingreso manual activo' : 'Apunta al QR de la entrada'}
          </div>
          <div className={`vf-flash ${flash ? 'on' : ''}`} />

          {/* Mode selector */}
          <div className="acc-sim">
            <div className="acc-sim-row">
              <button
                onClick={() => { setMode('scanner'); setCameraError(''); reset() }}
                style={{ background: mode === 'scanner' ? 'rgba(167,139,250,0.25)' : undefined, borderColor: mode === 'scanner' ? 'rgba(167,139,250,0.5)' : undefined }}
              >
                <ScanLine size={14} /> Lector
              </button>
              <button
                onClick={() => { setMode('camera'); setCameraError(''); reset() }}
                style={{ background: mode === 'camera' ? 'rgba(167,139,250,0.25)' : undefined, borderColor: mode === 'camera' ? 'rgba(167,139,250,0.5)' : undefined }}
              >
                <ScanLine size={14} /> Cámara
              </button>
              <button
                onClick={() => { setMode('manual'); reset() }}
                style={{ background: mode === 'manual' ? 'rgba(167,139,250,0.25)' : undefined, borderColor: mode === 'manual' ? 'rgba(167,139,250,0.5)' : undefined }}
              >
                <Keyboard size={14} /> Manual
              </button>
            </div>
          </div>
        </div>

        {/* Recent scans */}
        <div className="acc-recent">
          <h4>Últimos escaneos</h4>
          {recentScans.length === 0 ? (
            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.75rem', textAlign: 'center', padding: '0.5rem 0' }}>
              Sin escaneos aún
            </div>
          ) : (
            recentScans.map(s => (
              <div key={s.id} className="acc-recent-row">
                <div className={`ic ${s.result}`}>
                  {s.result === 'valid' ? <Check size={15} /> : s.result === 'used' ? <RotateCcw size={15} /> : <X size={15} />}
                </div>
                <div className="tx">
                  <b>{s.name}</b>
                  <span>{s.seat}</span>
                </div>
                <div className="tm">{s.time}</div>
              </div>
            ))
          )}
        </div>

      {/* Full-screen result overlay */}
      {result && <ResultOverlay result={result} onClose={resetAndRetry} />}
    </div>
  )
}
