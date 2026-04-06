import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface UseConfirmLeaveProps {
  enabled: boolean
  message?: string
}

export function useConfirmLeave({
  enabled,
  message = 'Dữ liệu chưa lưu sẽ bị mất. Bạn có chắc chắn muốn rời khỏi?'
}: UseConfirmLeaveProps) {
  const router = useRouter()
  const [showLeaveDialog, setShowLeaveDialog] = useState(false)
  const bypassRef = useRef(false)

  // 1. Browser Level (BeforeUnload)
  useEffect(() => {
    if (!enabled) return

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // If bypass is active, do not show the browser alert
      if (bypassRef.current) return

      e.preventDefault()
      e.returnValue = message
      return message
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [enabled, message])

  const bypassNextLeave = useCallback(() => {
    bypassRef.current = true
  }, [])

  const confirmLeave = useCallback(() => {
    // If bypass is active, just navigate back without dialog
    if (enabled && !bypassRef.current) {
      setShowLeaveDialog(true)
    } else {
      router.back()
    }
  }, [enabled, router])

  const handleConfirmLeave = useCallback(() => {
    setShowLeaveDialog(false)
    router.back()
  }, [router])

  return {
    confirmLeave,
    showLeaveDialog,
    setShowLeaveDialog,
    handleConfirmLeave,
    bypassNextLeave
  }
}
