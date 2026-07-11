'use server'

import { apiClient } from '@/lib/api'
import { ENDPOINTS } from '@/lib/constants'
import { ApiResponse } from '@/lib/types'

export type GlobalSearchResult = {
  classes?: { id: number; name: string; teacherName?: string }[]
  exams?: { id: number; title: string; classId?: number }[]
  students?: { id: number; fullName: string; studentCode?: string }[]
  specifications?: { id: number; name: string }[]
}

export async function globalSearch(
  query: string
): Promise<ApiResponse<GlobalSearchResult>> {
  return apiClient.get<GlobalSearchResult>(ENDPOINTS.GLOBAL_SEARCH, {
    queries: { q: query },
    cache: 'no-store'
  })
}
