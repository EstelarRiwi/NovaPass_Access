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

interface ApiValidateResponse {
  success: boolean
  data: {
    state: 'valid' | 'used' | 'fake'
    customerName: string | null
    categoryName: string | null
  } | null
  error: string | null
}

function mapResponse(raw: ApiValidateResponse): ValidationResult {
  const d = raw.data
  if (!d || d.state === 'fake') {
    return { valid: false, reason: raw.error || 'QR no reconocido' }
  }
  if (d.state === 'used') {
    return {
      valid: false,
      reason: 'Esta entrada ya fue usada',
      ticket: d.customerName ? {
        id: 0, customer_name: d.customerName, event_name: '',
        seat: '', category: d.categoryName || '',
      } : undefined,
    }
  }
  return {
    valid: true,
    ticket: {
      id: 0,
      customer_name: d.customerName || 'Cliente',
      event_name: '',
      seat: '',
      category: d.categoryName || '',
    },
  }
}

export function useValidation() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ValidationResult | null>(null)

  const validate = useCallback(async (token: string) => {
    setLoading(true)
    setResult(null)
    try {
      const raw = await api.post<ApiValidateResponse>('/tickets/validate', { qrToken: token })
      const mapped = mapResponse(raw)
      setResult(mapped)
      return mapped
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
