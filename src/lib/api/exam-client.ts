import {
  ApiResponse,
  CreateExamRequest,
  CreateExamResponse,
  TeacherExamDetail,
  UpdateExamRequest
} from '@/lib/types'
import { ENDPOINTS } from '@/lib/constants'
import { getCookie } from '@/lib/utils'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'

async function multipartFetch<T>(
  url: string,
  method: 'POST' | 'PUT',
  data: unknown,
  pdfFile: File
): Promise<ApiResponse<T>> {
  const accessToken = await getCookie('accessToken')

  const formData = new FormData()
  formData.append(
    'data',
    new Blob([JSON.stringify(data)], { type: 'application/json' })
  )
  formData.append('pdfFile', pdfFile)

  const res = await fetch(url, {
    method,
    headers: {
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
    },
    credentials: 'include',
    body: formData
  })

  if (!res.ok) {
    let errorBody: string
    try {
      const errorJson = await res.json()
      errorBody = JSON.stringify(errorJson)
    } catch {
      errorBody = JSON.stringify({
        code: String(res.status),
        message: res.statusText || 'Request failed'
      })
    }
    throw errorBody
  }

  const text = await res.text()
  if (!text) {
    return { code: String(res.status), message: 'OK' } as ApiResponse<T>
  }
  return JSON.parse(text) as ApiResponse<T>
}

export async function createExamWithPdf(
  data: CreateExamRequest,
  pdfFile: File
): Promise<ApiResponse<CreateExamResponse>> {
  const url = `${API_URL}${ENDPOINTS.CREATE_EXAM}`
  return multipartFetch<CreateExamResponse>(url, 'POST', data, pdfFile)
}

export async function updateExamWithPdf(
  examId: number,
  data: UpdateExamRequest,
  pdfFile: File
): Promise<ApiResponse<TeacherExamDetail>> {
  const url = `${API_URL}/exams/${examId}`
  return multipartFetch<TeacherExamDetail>(url, 'PUT', data, pdfFile)
}
