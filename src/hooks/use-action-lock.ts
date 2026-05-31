'use client'

import { useCallback, useRef } from 'react'

export function useActionLock() {
  const lockedRef = useRef(false)

  const unlock = useCallback(() => {
    lockedRef.current = false
  }, [])

  const runLocked = useCallback(
    (action: () => void, options?: { skip?: boolean }) => {
      if (options?.skip || lockedRef.current) return false
      lockedRef.current = true
      action()
      return true
    },
    []
  )

  return { runLocked, unlock }
}
