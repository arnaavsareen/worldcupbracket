import { useEffect, useState } from 'react'
import { emptyPicks } from './bracket'
import type { AppState } from './types'

const KEY = 'wc26-bracket-v1'

export const initialState = (): AppState => ({
  name: '',
  picks: emptyPicks(),
  results: emptyPicks(),
  locked: false,
  lockedAt: null,
  resultsLocked: false,
  resultsLockedAt: null,
})

export function useAppState() {
  const [state, setState] = useState<AppState>(() => {
    try {
      const raw = localStorage.getItem(KEY)
      if (raw) return { ...initialState(), ...(JSON.parse(raw) as AppState) }
    } catch {
      // corrupted storage — start fresh
    }
    return initialState()
  })

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(state))
  }, [state])

  return [state, setState] as const
}
