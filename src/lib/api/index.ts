import qs from 'qs'
import { ApiResponse, RefreshTokenResponse } from '@/lib/types'
import { getCookie, setCookie, toExpiryDate } from '@/lib/utils'
import { ENDPOINTS, COOKIE_BASE_OPTIONS } from '@/lib/constants'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'

type RequestOptions = RequestInit & {
  queries?: Record<string, string | number>
}

export class ApiClient {
  private baseURL: string

  /**
   * Singleton refresh promise — ensures only one refresh request
   * is in-flight at any time, even when multiple 401 responses
   * arrive concurrently.
   */
  private refreshPromise: Promise<string | null> | null = null

  constructor(baseURL: string) {
    this.baseURL = baseURL
  }

  // ───────────────────────── core fetch ─────────────────────────

  private async fetchWithToken(
    endpoint: string,
    options: RequestOptions,
    token?: string
  ): Promise<Response> {
    const { queries, headers } = options

    const accessToken = token ?? (await getCookie('accessToken'))

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

    return fetch(url, config)
  }

  // ───────────────────── token refresh ──────────────────────────

  /**
   * Attempt to refresh the access token using the stored refresh token.
   * Returns the new access token on success, or null on failure.
   * Uses a singleton promise to deduplicate concurrent refresh calls.
   */
  private async attemptRefresh(): Promise<string | null> {
    // If a refresh is already in progress, wait for it
    if (this.refreshPromise) {
      return this.refreshPromise
    }

    this.refreshPromise = (async () => {
      try {
        const refreshToken = await getCookie('refreshToken')
        if (!refreshToken) return null

        const res = await fetch(`${this.baseURL}${ENDPOINTS.REFRESH_TOKEN}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ refreshToken })
        })

        if (!res.ok) return null

        const body = (await res.json()) as ApiResponse<RefreshTokenResponse>
        if (!body.data?.accessToken) return null

        // Persist the new access token
        await setCookie('accessToken', body.data.accessToken, {
          expires: toExpiryDate(body.data.accessTokenExpiresAt),
          ...COOKIE_BASE_OPTIONS
        })

        return body.data.accessToken
      } catch {
        return null
      } finally {
        // Allow future refreshes
        this.refreshPromise = null
      }
    })()

    return this.refreshPromise
  }

  // ──────────────────────── request ─────────────────────────────

  async request(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<Response> {
    const res = await this.fetchWithToken(endpoint, options)

    // If 401 → try to refresh and retry ONCE
    if (res.status === 401) {
      // Don't attempt refresh on auth endpoints themselves
      const isAuthEndpoint =
        endpoint === ENDPOINTS.LOGIN ||
        endpoint === ENDPOINTS.REFRESH_TOKEN ||
        endpoint === ENDPOINTS.LOGOUT

      if (!isAuthEndpoint) {
        const newToken = await this.attemptRefresh()
        if (newToken) {
          // Retry the original request with the fresh token
          const retryRes = await this.fetchWithToken(
            endpoint,
            options,
            newToken
          )
          if (!retryRes.ok) {
            let errorBody: string
            try {
              const errorJson = await retryRes.json()
              errorBody = JSON.stringify(errorJson)
            } catch {
              errorBody = JSON.stringify({
                code: String(retryRes.status),
                message: retryRes.statusText || 'Request failed'
              })
            }
            throw errorBody
          }
          return retryRes
        }

        // Refresh failed — redirect to login (server-side safe)
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
      }
    }

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
