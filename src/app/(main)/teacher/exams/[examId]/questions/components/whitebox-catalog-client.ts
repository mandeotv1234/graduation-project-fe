import { getWhiteboxCatalog } from '@/lib/actions'
import { ApiResponse, WhiteboxCatalogItem } from '@/lib/types'

const catalogRequests = new Map<
  string,
  Promise<ApiResponse<WhiteboxCatalogItem[]>>
>()

function normalizeQuestionType(questionType: string): string {
  const normalized = questionType.trim().toUpperCase()
  return normalized || 'SELECT_QUERY'
}

export function loadWhiteboxCatalog(
  questionType: string
): Promise<ApiResponse<WhiteboxCatalogItem[]>> {
  const key = normalizeQuestionType(questionType)
  // Only de-duplicate concurrent loads; do not cache catalog data across requests.
  const pending = catalogRequests.get(key)
  if (pending) return pending

  const request = getWhiteboxCatalog(key).finally(() => {
    catalogRequests.delete(key)
  })

  catalogRequests.set(key, request)
  return request
}
