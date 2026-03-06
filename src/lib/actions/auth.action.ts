'use server'

import { apiClient } from '@/lib/api'
import { COOKIE_BASE_OPTIONS, ENDPOINTS } from '@/lib/constants'
import {
  ApiResponse,
  LoginFormValues,
  LoginResponse,
  RefreshTokenResponse,
  RegisterFormValues,
  RegisterResponse
} from '@/lib/types'
import {
  setCookie,
  getCookie,
  decodeJwtPayload,
  toExpiryDate
} from '@/lib/utils'

export async function login(
  data: LoginFormValues
): Promise<ApiResponse<LoginResponse>> {
  const response = await apiClient.post<LoginResponse>(ENDPOINTS.LOGIN, data)

  if (response.data) {
    const { accessToken, refreshToken } = response.data

    // Decode token to extract role
    const decoded = decodeJwtPayload(accessToken)

    // Parse expiry dates safely
    const accessExpiry = toExpiryDate(response.data.accessTokenExpiresAt)
    const refreshExpiry = toExpiryDate(response.data.refreshTokenExpiresAt)

    // Set cookies in parallel
    await Promise.all([
      setCookie('accessToken', accessToken, {
        expires: accessExpiry,
        ...COOKIE_BASE_OPTIONS
      }),
      setCookie('refreshToken', refreshToken, {
        expires: refreshExpiry,
        ...COOKIE_BASE_OPTIONS
      }),
      // Store role for middleware route protection (httpOnly for security)
      ...(decoded
        ? [
            setCookie('userRole', decoded.role, {
              expires: refreshExpiry,
              ...COOKIE_BASE_OPTIONS
            })
          ]
        : [])
    ])
  }

  return response
}

export async function refreshNewAccessToken(): Promise<
  ApiResponse<RefreshTokenResponse>
> {
  const refreshToken = await getCookie('refreshToken')

  const response = await apiClient.post<RefreshTokenResponse>(
    ENDPOINTS.REFRESH_TOKEN,
    { refreshToken }
  )

  if (response.data) {
    await setCookie('accessToken', response.data.accessToken, {
      expires: toExpiryDate(response.data.accessTokenExpiresAt),
      ...COOKIE_BASE_OPTIONS
    })
  }

  return response
}

export async function signUp(
  data: Omit<RegisterFormValues, 'confirmPassword'>
): Promise<ApiResponse<RegisterResponse>> {
  const response = await apiClient.post<RegisterResponse>(
    ENDPOINTS.REGISTER,
    data
  )

  return response
}

export async function logout(): Promise<void> {
  const refreshToken = await getCookie('refreshToken')

  // Call backend logout API to invalidate token in Redis
  try {
    if (refreshToken) {
      await apiClient.post(ENDPOINTS.LOGOUT, { refreshToken })
    }
  } catch {
    // Logout should succeed even if API call fails
  }

  // Clear all auth cookies
  await Promise.all([
    setCookie('accessToken', '', { maxAge: 0, path: '/' }),
    setCookie('refreshToken', '', { maxAge: 0, path: '/' }),
    setCookie('userRole', '', { maxAge: 0, path: '/' })
  ])
}
