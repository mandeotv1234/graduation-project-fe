'use server'

import { apiClient } from '@/lib/api'
import { ENDPOINTS } from '@/lib/constants'
import {
  ApiResponse,
  LoginFormValues,
  LoginResponse,
  RegisterFormValues,
  RegisterResponse
} from '@/lib/types'
import { setCookie } from '@/lib/utils'

const COOKIE_BASE_OPTIONS = {
  httpOnly: true,
  sameSite: 'strict' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/'
}

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
        maxAge: 60 * 30,
        ...COOKIE_BASE_OPTIONS
      }),
      setCookie('refreshToken', refreshToken, {
        maxAge: 60 * 60 * 24 * 7,
        ...COOKIE_BASE_OPTIONS
      })
    ])
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
