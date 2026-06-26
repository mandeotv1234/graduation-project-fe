import { getWhiteboxCatalog } from '@/lib/actions'
import { ApiResponse, WhiteboxCatalogItem } from '@/lib/types'

const catalogCache = new Map<string, WhiteboxCatalogItem[]>()
const catalogRequests = new Map<
  string,
  Promise<ApiResponse<WhiteboxCatalogItem[]>>
>()

function normalizeQuestionType(questionType: string): string {
  const normalized = questionType.trim().toUpperCase()
  return normalized || 'SELECT_QUERY'
}

export function loadWhiteboxCatalogCached(
  questionType: string
): Promise<ApiResponse<WhiteboxCatalogItem[]>> {
  const key = normalizeQuestionType(questionType)
  const cached = catalogCache.get(key)
  if (cached) {
    return Promise.resolve({ code: 'OK', message: 'OK', data: cached })
  }

  const pending = catalogRequests.get(key)
  if (pending) return pending

  const request = getWhiteboxCatalog(key)
    .then((res) => {
      if (Array.isArray(res.data)) {
        catalogCache.set(key, res.data)
      }
      return res
    })
    .finally(() => {
      catalogRequests.delete(key)
    })

  catalogRequests.set(key, request)
  return request
}
