import { useCallback, useState } from 'react'
import { toast } from 'sonner'

import { ApiResponse } from '@/lib/types'

export function useApi() {
  const [isLoading, setIsLoading] = useState(false)

  const translateMessage = (msg: string): string => {
    const map: Record<string, string> = {
      // Success messages
      'Exam created successfully': 'Đề thi đã được tạo thành công!',
      'Exam updated successfully': 'Cập nhật đề thi thành công!',
      'Exam deleted successfully': 'Xóa đề thi thành công!',
      'Questions created successfully': 'Tạo câu hỏi thành công!',
      'Questions updated successfully': 'Cập nhật câu hỏi thành công!',
      'Specification updated successfully': 'Cập nhật đặc tả thành công!',
      'Class created successfully': 'Tạo lớp học thành công!',
      'Class updated successfully': 'Cập nhật lớp học thành công!',
      'Students added successfully': 'Thêm sinh viên thành công!',
      'Assignment updated successfully': 'Cập nhật bài tập thành công!',
      'Operation successful': 'Thao tác thành công!',
      Success: 'Thành công!',

      // Error messages
      Unauthorized: 'Không có quyền truy cập!',
      Forbidden: 'Truy cập bị từ chối!',
      'Not Found': 'Không tìm thấy dữ liệu!',
      'Internal Server Error': 'Lỗi hệ thống!',
      'Bad Request': 'Yêu cầu không hợp lệ!',
      'Token expired': 'Phiên đăng nhập hết hạn!',
      'An unknown error occurred': 'Đã có lỗi xảy ra'
    }
    return map[msg] || msg
  }

  const callApi = useCallback(
    async <T,>(
      promise: Promise<ApiResponse<T>>,
      showToast: boolean = true
    ): Promise<ApiResponse<T>> => {
      setIsLoading(true)

      try {
        const result = await promise

        if (showToast) {
          toast.success(
            translateMessage(result.message) || 'Thao tác thành công!'
          )
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

        toast.error(translateMessage(errorMessage))

        return {
          code: 'UNHANDLED_ERROR',
          message: errorMessage,
          data: undefined
        }
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  return { callApi, isLoading }
}
