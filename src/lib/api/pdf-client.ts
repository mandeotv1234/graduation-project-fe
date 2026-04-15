import { getCookie } from '@/lib/utils'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'

export async function fetchExamPdfBlobUrl(examId: number): Promise<string> {
  const accessToken = await getCookie('accessToken')
  const url = `${API_URL}/exams/${examId}/pdf`

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
    },
    credentials: 'include'
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch PDF: ${res.status}`)
  }

  const blob = await res.blob()
  return URL.createObjectURL(blob)
}
