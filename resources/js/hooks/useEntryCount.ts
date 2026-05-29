import { useState, useCallback } from 'react'

export function useEntryCount() {
  const [count, setCount] = useState(0)
  const increment = useCallback(() => setCount(n => n + 1), [])
  return { count, increment }
}
