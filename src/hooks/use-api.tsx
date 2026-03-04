import { useState } from 'react'
import { toast } from 'sonner'

import { ApiResponse } from '@/lib/types'

export function useApi() {
  const [isLoading, setIsLoading] = useState(false)

  async function callApi<T>(
    promise: Promise<ApiResponse<T>>,
    showToast: boolean = true
  ): Promise<ApiResponse<T>> {
    setIsLoading(true)

    try {
      const result = await promise

      if (showToast) {
        toast.success(result.message || 'Thao tác thành công!')
      }

      return result
    } catch (error: unknown) {
      let errorMessage = 'An unknown error occurred'

      if (error instanceof Error) {
        try {
          const parsed = JSON.parse(error.message) as { message?: string }
          if (parsed?.message) {
            errorMessage = parsed.message
          }
        } catch {
          errorMessage = error.message || errorMessage
        }
      } else if (typeof error === 'string') {
        try {
          const parsed = JSON.parse(error) as { message?: string }
          if (parsed?.message) {
            errorMessage = parsed.message
          }
        } catch {
          errorMessage = error
        }
      }

      toast.error(errorMessage)

      return {
        code: 'UNHANDLED_ERROR',
        message: errorMessage,
        data: undefined
      }
    } finally {
      setIsLoading(false)
    }
  }

  return { callApi, isLoading }
}
