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

export function useValidation() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ValidationResult | null>(null)

  const validate = useCallback(async (token: string) => {
    setLoading(true)
    setResult(null)
    try {
      const data = await api.post<ValidationResult>('/tickets/validate', { qrToken: token })
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
