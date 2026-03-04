export interface ApiMeta {
  timestamp: string
}

export interface ApiResponse<T> {
  data?: T
  meta?: ApiMeta
  code: string
  message: string
}
