import { useState, useCallback, useRef, useEffect } from 'react'
import { api } from '../api/client'

export function useEntryCount(eventId?: number) {
  const [count, setCount] = useState(0)
  const [eventName, setEventName] = useState('')
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)
  const demoCountRef = useRef(42)

  const fetchCount = useCallback(async () => {
    try {
      const token = localStorage.getItem('token')
      const isDemo = token === 'demo_scanner_token_2026'

      if (isDemo) {
        demoCountRef.current += Math.floor(Math.random() * 4)
        setCount(demoCountRef.current)
        setEventName('Noche de Estrellas (Demo)')
        return
      }

      const path = eventId ? `/reports/entry-count?event_id=${eventId}` : '/reports/entry-count'
      const data = await api.get<{ count: number; event_name: string }>(path)
      setCount(data.count)
      setEventName(data.event_name)
    } catch {
      // silently fail
    }
  }, [eventId])

  const startPolling = useCallback(() => {
    fetchCount()
    intervalRef.current = setInterval(fetchCount, 10000)
  }, [fetchCount])

  const stopPolling = useCallback(() => {
    clearInterval(intervalRef.current)
  }, [])

  useEffect(() => () => stopPolling(), [])

  return { count, eventName, fetch: fetchCount, startPolling, stopPolling }
}
