import qs from 'qs'
import { ApiResponse } from '../types'
import { getCookie } from '../utils'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

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
      throw JSON.stringify(await res.json())
    }

    return res
  }

  async get<T>(
    endpoint: string,
    options?: Omit<RequestOptions, 'method'>
  ): Promise<ApiResponse<T>> {
    const res = this.request(endpoint, {
      method: 'GET',
      cache: 'force-cache',
      ...options
    })
    return (await res).json()
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    const res = this.request(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    })
    return (await res).json()
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    const res = this.request(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    })

    return (await res).json()
  }

  async patch<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    const res = this.request(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined
    })
    return (await res).json()
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    const res = this.request(endpoint, { method: 'DELETE' })
    return (await res).json()
  }
}

export const apiClient = new ApiClient(API_URL)
