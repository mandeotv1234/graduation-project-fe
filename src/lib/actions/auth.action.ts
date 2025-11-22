'use server'

import { apiClient } from '@/lib/api'
import { ENDPOINTS, PATH } from '@/lib/constants'
import {
  ApiResponse,
  LoginFormValues,
  LoginResponse,
  RegisterFormValues,
  RegisterResponse
} from '@/lib/types'
import { setCookie } from '@/lib/utils'
import { redirect } from 'next/navigation'

const COOKIE_BASE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/'
}
export async function loginAction(
  data: LoginFormValues
): Promise<ApiResponse<LoginResponse>> {
  try {
    const response = await apiClient.post<LoginResponse>(ENDPOINTS.LOGIN, data)

    const accessToken = response.data?.accessToken
    const refreshToken = response.data?.refreshToken

    if (!accessToken || !refreshToken) {
      return {
        success: false,
        code: 'UNAUTHORIZED',
        message: 'Hệ thống không trả về thông tin xác thực'
      }
    }

    // Set cookies
    await Promise.all([
      setCookie('accessToken', accessToken, {
        maxAge: 60 * 30, // 30 minutes
        ...COOKIE_BASE_OPTIONS
      }),
      setCookie('refreshToken', refreshToken, {
        maxAge: 60 * 60 * 24 * 7, // 7 days
        ...COOKIE_BASE_OPTIONS
      })
    ])

    redirect(PATH.HOME)
  } catch (error) {
    return {
      success: false,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Đã xảy ra lỗi, vui lòng thử lại.'
    }
  }
}

export async function registerAction(
  data: Omit<RegisterFormValues, 'confirmPassword'>
): Promise<ApiResponse<RegisterResponse>> {
  try {
    await apiClient.post<RegisterResponse>(ENDPOINTS.REGISTER, data)

    redirect(PATH.LOGIN)
  } catch (error) {
    return {
      success: false,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Đã xảy ra lỗi, vui lòng thử lại.'
    }
  }
}
