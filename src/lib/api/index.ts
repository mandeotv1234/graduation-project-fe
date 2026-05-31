import { COOKIE_BASE_OPTIONS, ENDPOINTS } from '@/lib/constants'
import { ApiResponse, RefreshTokenResponse } from '@/lib/types'
import { getCookie, setCookie, toExpiryDate } from '@/lib/utils'
import { redirect } from 'next/navigation'
import qs from 'qs'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'
const SSR_API_TRACE = process.env.SSR_API_TRACE === 'true'

type RequestOptions = RequestInit & {
  queries?: Record<string, string | number>
  ignoreAuthError?: boolean
}

export class ApiClient {
  private baseURL: string
  private refreshPromise: Promise<string | null> | null = null

  constructor(baseURL: string) {
    this.baseURL = baseURL
  }

  private shouldTrace() {
    return SSR_API_TRACE && typeof window === 'undefined'
  }

  private trace(message: string, payload?: Record<string, unknown>) {
    if (!this.shouldTrace()) {
      return
    }

    if (payload) {
      console.log(`[ApiClient] ${message}`, payload)
      return
    }

    console.log(`[ApiClient] ${message}`)
  }

  private previewBody(value: unknown) {
    if (value === undefined || value === null) {
      return undefined
    }

    const text =
      typeof value === 'string' ? value : JSON.stringify(value, null, 2)
    return text
  }

  private async traceResponse(response: Response, stage: string, url: string) {
    if (!this.shouldTrace()) {
      return
    }

    let bodyPreview: string | undefined

    try {
      const raw = await response.clone().text()
      bodyPreview = raw ? this.previewBody(raw) : undefined
    } catch {
      bodyPreview = undefined
    }

    this.trace(stage, {
      status: response.status,
      ok: response.ok,
      url,
      bodyPreview
    })
  }

  private async fetchWithToken(
    endpoint: string,
    options: RequestOptions = {},
    token?: string
  ): Promise<Response> {
    const { queries, headers: extraHeaders } = options
    const accessToken = token ?? (await getCookie('accessToken'))

    const queryString = queries
      ? qs.stringify(queries, { addQueryPrefix: true })
      : ''

    const url = `${this.baseURL}${endpoint}${queryString}`

    const mergedHeaders: HeadersInit = {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(extraHeaders ?? {})
    }

    const restOptions = Object.fromEntries(
      Object.entries(options).filter(
        ([key]) => key !== 'headers' && key !== 'queries'
      )
    ) as RequestInit

    const config: RequestInit = {
      headers: mergedHeaders,
      credentials: 'include',
      ...restOptions
    }

    this.trace('request', {
      method: config.method ?? 'GET',
      url,
      body: this.previewBody(config.body)
    })

    return fetch(url, config)
  }

  private async attemptRefresh(): Promise<string | null> {
    if (this.refreshPromise) return this.refreshPromise

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

        try {
          await setCookie('accessToken', body.data.accessToken, {
            expires: toExpiryDate(body.data.accessTokenExpiresAt),
            ...COOKIE_BASE_OPTIONS
          })
        } catch {
          // cookie write not allowed in Server Component render context
        }

        return body.data.accessToken
      } catch {
        return null
      } finally {
        this.refreshPromise = null
      }
    })()

    return this.refreshPromise
  }

  private async clearAuthSession(): Promise<void> {
    try {
      await Promise.all([
        setCookie('accessToken', '', { maxAge: 0, path: '/' }),
        setCookie('refreshToken', '', { maxAge: 0, path: '/' }),
        setCookie('userRole', '', { maxAge: 0, path: '/' })
      ])
    } catch {
      // cookie write not allowed in read-only context
    }
  }

  private async handleSessionExpired(): Promise<never> {
    await this.clearAuthSession()

    if (typeof window !== 'undefined') {
      window.location.href = '/login'
      throw new Error('SESSION_EXPIRED')
    }

    redirect('/login')
  }

  async request(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<Response> {
    const { queries } = options
    const queryString = queries
      ? qs.stringify(queries, { addQueryPrefix: true })
      : ''
    const requestUrl = `${this.baseURL}${endpoint}${queryString}`

    const res = await this.fetchWithToken(endpoint, options)
    await this.traceResponse(res, 'response', requestUrl)
    const isTokenError =
      (res.status === 401 || res.status === 403) && !options.ignoreAuthError

    if (isTokenError) {
      const isAuthEndpoint =
        endpoint === ENDPOINTS.LOGIN ||
        endpoint === ENDPOINTS.REFRESH_TOKEN ||
        endpoint === ENDPOINTS.LOGIN_OAUTH ||
        endpoint === ENDPOINTS.LOGIN_MICROSOFT ||
        endpoint === ENDPOINTS.LOGOUT

      if (!isAuthEndpoint) {
        const newToken = await this.attemptRefresh()

        if (newToken) {
          const retryRes = await this.fetchWithToken(
            endpoint,
            options,
            newToken
          )
          await this.traceResponse(retryRes, 'response-retry', requestUrl)

          if (!retryRes.ok) {
            if (retryRes.status === 401 || retryRes.status === 403) {
              await this.handleSessionExpired()
            }
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

        await this.handleSessionExpired()
      }
    }

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

    return res
  }

  private async parseJson<T>(res: Response): Promise<ApiResponse<T>> {
    const text = await res.text()
    if (!text) {
      return { code: String(res.status), message: 'OK' } as ApiResponse<T>
    }
    return JSON.parse(text) as ApiResponse<T>
  }

  /**
   * Converts a caught error into an ApiResponse instead of re-throwing.
   * Next.js redirect/notFound errors (digest property) are always re-thrown
   * so that auth redirects and not-found pages still work correctly.
   */
  private parseErrorResponse<T>(error: unknown): ApiResponse<T> {
    // Re-throw Next.js internal errors (redirect, notFound, etc.)
    if (error instanceof Error && 'digest' in error) {
      throw error
    }

    const raw = typeof error === 'string' ? error : ''
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as { code?: string; message?: string }
        return {
          code: parsed.code || 'ERROR',
          message: parsed.message || 'Đã có lỗi xảy ra',
          data: undefined as unknown as T
        }
      } catch {
        return { code: 'ERROR', message: raw, data: undefined as unknown as T }
      }
    }

    const message = error instanceof Error ? error.message : 'Đã có lỗi xảy ra'
    return { code: 'ERROR', message, data: undefined as unknown as T }
  }

  async get<T>(
    endpoint: string,
    options?: Omit<RequestOptions, 'method'>
  ): Promise<ApiResponse<T>> {
    try {
      const res = await this.request(endpoint, {
        method: 'GET',
        cache: 'force-cache',
        ...options
      })
      return this.parseJson<T>(res)
    } catch (error: unknown) {
      return this.parseErrorResponse<T>(error)
    }
  }

  async post<T>(
    endpoint: string,
    data?: unknown,
    options?: Omit<RequestOptions, 'method' | 'body'>
  ): Promise<ApiResponse<T>> {
    try {
      const res = await this.request(endpoint, {
        method: 'POST',
        body: data ? JSON.stringify(data) : undefined,
        ...options
      })
      return this.parseJson<T>(res)
    } catch (error: unknown) {
      return this.parseErrorResponse<T>(error)
    }
  }

  async put<T>(
    endpoint: string,
    data?: unknown,
    options?: Omit<RequestOptions, 'method' | 'body'>
  ): Promise<ApiResponse<T>> {
    try {
      const res = await this.request(endpoint, {
        method: 'PUT',
        body: data ? JSON.stringify(data) : undefined,
        ...options
      })
      return this.parseJson<T>(res)
    } catch (error: unknown) {
      return this.parseErrorResponse<T>(error)
    }
  }

  async patch<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    try {
      const res = await this.request(endpoint, {
        method: 'PATCH',
        body: data ? JSON.stringify(data) : undefined
      })
      return this.parseJson<T>(res)
    } catch (error: unknown) {
      return this.parseErrorResponse<T>(error)
    }
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const res = await this.request(endpoint, { method: 'DELETE' })
      return this.parseJson<T>(res)
    } catch (error: unknown) {
      return this.parseErrorResponse<T>(error)
    }
  }
}

export const apiClient = new ApiClient(API_URL)
