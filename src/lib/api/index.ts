import qs from 'qs'
import { ApiResponse } from '@/lib/types'
import { getCookie } from '@/lib/utils'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'

type RequestOptions = RequestInit & {
  queries?: Record<string, string | number>
}

export class ApiClient {
  private baseURL: string

  constructor(baseURL: string) {
    this.baseURL = baseURL
  }

  async request(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<Response> {
    const { queries, headers } = options

    const accessToken = await getCookie('accessToken')

    const queryString = queries
      ? qs.stringify(queries, { addQueryPrefix: true })
      : ''

    const url = `${this.baseURL}${endpoint}${queryString}`

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...(headers ?? {})
      },
      credentials: 'include',
      ...options
    }

    const res = await fetch(url, config)

    if (!res.ok) {
      // Safely parse error body — some responses (e.g. 204, 401) may have empty body
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

    return res
  }

  /**
   * Safely parse JSON from response. Handles empty bodies (204 No Content).
   */
  private async parseJson<T>(res: Response): Promise<ApiResponse<T>> {
    const text = await res.text()
    if (!text) {
      return { code: String(res.status), message: 'OK' } as ApiResponse<T>
    }
    return JSON.parse(text) as ApiResponse<T>
  }

  async get<T>(
    endpoint: string,
    options?: Omit<RequestOptions, 'method'>
  ): Promise<ApiResponse<T>> {
    const res = await this.request(endpoint, {
      method: 'GET',
      cache: 'force-cache',
      ...options
    })
    return this.parseJson<T>(res)
  }

  async post<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    const res = await this.request(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    })
    return this.parseJson<T>(res)
  }

  async put<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    const res = await this.request(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    })
    return this.parseJson<T>(res)
  }

  async patch<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    const res = await this.request(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined
    })
    return this.parseJson<T>(res)
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    const res = await this.request(endpoint, { method: 'DELETE' })
    return this.parseJson<T>(res)
  }
}

export const apiClient = new ApiClient(API_URL)
