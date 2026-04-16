export interface ApiMeta {
  timestamp: string
}

export interface ApiResponse<T> {
  data?: T
  meta?: ApiMeta
  code: string
  message: string
}

export interface PaginatedResult<T> {
  data: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}
