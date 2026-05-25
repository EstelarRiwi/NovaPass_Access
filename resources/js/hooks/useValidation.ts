import { useState, useCallback } from 'react'
import { api } from '../api/client'

export interface ValidationResult {
  valid: boolean
  reason?: string
  ticket?: {
    id: number
    customer_name: string
    event_name: string
    seat: string
    category: string
  }
}

const DEMO_NAMES = [
  'María García', 'Carlos López', 'Ana Martínez', 'Pedro Rodríguez',
  'Laura Sánchez', 'Juan Fernández', 'Valentina Gómez', 'Santiago Ruiz',
]
const DEMO_CATEGORIES = ['VIP', 'Palco', 'General', 'Platea']

function demoValidate(token: string): Promise<ValidationResult> {
  const delay = 400 + Math.random() * 600
  return new Promise(resolve => setTimeout(() => {
    const isDemoToken = token.startsWith('demo_') || token.length < 8
    if (isDemoToken) {
      resolve({
        valid: true,
        ticket: {
          id: Math.floor(Math.random() * 10000),
          customer_name: DEMO_NAMES[Math.floor(Math.random() * DEMO_NAMES.length)],
          event_name: 'Noche de Estrellas (Demo)',
          seat: `${String.fromCharCode(65 + Math.floor(Math.random() * 20))}${Math.floor(Math.random() * 30) + 1}`,
          category: DEMO_CATEGORIES[Math.floor(Math.random() * DEMO_CATEGORIES.length)],
        },
      })
    } else if (token === 'usado' || token === 'fraude') {
      resolve({ valid: false, reason: 'Esta boleta ya fue usada' })
    } else if (token === 'falsa' || token === 'invalido') {
      resolve({ valid: false, reason: 'Firma criptográfica inválida' })
    } else {
      const outcomes = ['success', 'success', 'success', 'fraud', 'fake']
      const pick = outcomes[Math.floor(Math.random() * outcomes.length)]
      if (pick === 'success') {
        resolve({
          valid: true,
          ticket: {
            id: Math.floor(Math.random() * 10000),
            customer_name: DEMO_NAMES[Math.floor(Math.random() * DEMO_NAMES.length)],
            event_name: 'Noche de Estrellas (Demo)',
            seat: `${String.fromCharCode(65 + Math.floor(Math.random() * 20))}${Math.floor(Math.random() * 30) + 1}`,
            category: DEMO_CATEGORIES[Math.floor(Math.random() * DEMO_CATEGORIES.length)],
          },
        })
      } else if (pick === 'fraud') {
        resolve({ valid: false, reason: 'Esta boleta ya fue usada' })
      } else {
        resolve({ valid: false, reason: 'Firma criptográfica inválida' })
      }
    }
  }, delay))
}

export function useValidation() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ValidationResult | null>(null)

  const validate = useCallback(async (token: string) => {
    setLoading(true)
    setResult(null)
    try {
      const token_ = localStorage.getItem('token')
      const isDemo = token_ === 'demo_scanner_token_2026'

      const data = isDemo ? await demoValidate(token) : await api.post<ValidationResult>('/tickets/validate', { token })
      setResult(data)
      return data
    } catch (e) {
      const err: ValidationResult = {
        valid: false,
        reason: e instanceof Error ? e.message : 'Error de conexión',
      }
      setResult(err)
      return err
    } finally {
      setLoading(false)
    }
  }, [])

  const reset = useCallback(() => setResult(null), [])

  return { validate, result, loading, reset }
}
