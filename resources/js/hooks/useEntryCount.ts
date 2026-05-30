import { useState, useCallback, useRef, useEffect } from 'react'
import { api } from '../api/client'

export function useEntryCount(eventId?: number) {
  const [count, setCount] = useState(0)
  const [eventName, setEventName] = useState('')
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)

  const fetchCount = useCallback(async () => {
    try {
      const path = eventId ? `/reports/entry-count?event_id=${eventId}` : '/reports/entry-count'
      const data = await api.get<{ count: number; event_name: string }>(path)
      setCount(data.count)
      setEventName(data.event_name)
    } catch {
      // silently fail — counter is informational
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
