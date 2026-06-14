import { useCallback, useState } from 'react'
import { toast } from 'sonner'

import { ApiResponse } from '@/lib/types'

/** HTTP 2xx codes and named success codes returned by the backend */
function isSuccessCode(code: string): boolean {
  const num = parseInt(code, 10)
  if (!isNaN(num)) return num >= 200 && num < 300
  return ['SUCCESS', 'OK', 'CREATED'].includes(code.toUpperCase())
}

export function useApi() {
  const [isLoading, setIsLoading] = useState(false)

  const callApi = useCallback(
    async <T,>(
      promise: Promise<ApiResponse<T>>,
      showToast: boolean = true
    ): Promise<ApiResponse<T>> => {
      setIsLoading(true)

      try {
        const result = await promise

        if (showToast) {
          if (isSuccessCode(result.code)) {
            toast.success(result.message || 'Thao tác thành công!')
          } else {
            toast.error(result.message || 'Đã có lỗi xảy ra')
          }
        }

        return result
      } catch (error: unknown) {
        // Only truly exceptional cases reach here:
        // Next.js internal control-flow errors or network errors.
        // API error responses are converted into ApiResponse by apiClient.
        console.error('[useApi] Unhandled error:', error)

        return {
          code: 'UNHANDLED_ERROR',
          message: 'Đã có lỗi xảy ra',
          data: undefined
        } as ApiResponse<T>
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  return { callApi, isLoading }
}
