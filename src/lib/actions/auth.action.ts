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
import { setCookie } from '@/lib/utils'

export async function login(
  data: LoginFormValues
): Promise<ApiResponse<LoginResponse>> {
  const response = await apiClient.post<LoginResponse>(ENDPOINTS.LOGIN, data)

  if (response.data) {
    const accessToken = response.data.accessToken
    const refreshToken = response.data.refreshToken
    // Set cookies
    await Promise.all([
      setCookie('accessToken', accessToken, {
        expires: new Date(response.data.accessTokenExpiresAt),
        ...COOKIE_BASE_OPTIONS
      }),
      setCookie('refreshToken', refreshToken, {
        expires: new Date(response.data.refreshTokenExpiresAt),
        ...COOKIE_BASE_OPTIONS
      })
    ])
  }

  return response
}

export async function refreshNewAccessToken(
  refreshToken: string
): Promise<ApiResponse<RefreshTokenResponse>> {
  const response = await apiClient.post<RefreshTokenResponse>(
    ENDPOINTS.REFRESH_TOKEN,
    {
      refreshToken
    }
  )

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
