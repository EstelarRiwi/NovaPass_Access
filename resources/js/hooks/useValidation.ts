import { useState, useCallback } from 'react'
import { api } from '../api/client'

export interface ValidationResult {
  valid: boolean
  reason?: string
  ticket?: {
    customer_name: string
    seat: string | null
  }
}

interface ApiValidationResponse {
  state: 'valid' | 'used' | 'fake'
  customerName: string | null
  seat: string | null
}

function mapApiResponse(data: ApiValidationResponse): ValidationResult {
  if (data.state === 'valid') {
    return {
      valid: true,
      ticket: {
        customer_name: data.customerName ?? 'Desconocido',
        seat: data.seat,
      },
    }
  }
  if (data.state === 'used') {
    return { valid: false, reason: 'Esta boleta ya fue usada' }
  }
  return { valid: false, reason: 'Firma criptográfica inválida' }
}

export function useValidation() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ValidationResult | null>(null)

  const validate = useCallback(async (token: string) => {
    setLoading(true)
    setResult(null)
    try {
      const data = await api.post<ApiValidationResponse>('/tickets/validate', { qrToken: token })
      const mapped = mapApiResponse(data)
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
