import { getCookie } from '@/lib/utils'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'

/** Parses the filename from a Content-Disposition header value. */
export function parseContentDispositionFilename(
  disposition: string
): string | null {
  const match = /filename="?([^";]+)"?/i.exec(disposition)
  return match?.[1] ?? null
}

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

/**
 * Calls POST /exams/{examId}/export-pdf with native fetch (NOT axios apiClient)
 * because apiClient JSON-parses responses and would mangle PDF bytes.
 */
export async function exportExamPdfBlob(
  examId: number,
  body: { regulationsOverride?: string }
): Promise<{ blob: Blob; filename: string }> {
  const accessToken = await getCookie('accessToken')
  const res = await fetch(`${API_URL}/exams/${examId}/export-pdf`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
    },
    credentials: 'include',
    body: JSON.stringify(body)
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

  const blob = await res.blob()
  const disposition = res.headers.get('Content-Disposition') ?? ''
  const filename =
    parseContentDispositionFilename(disposition) ?? `exam-${examId}.pdf`
  return { blob, filename }
}
