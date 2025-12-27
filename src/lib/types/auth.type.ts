import { z } from 'zod'

// Login Schema
export const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ').min(1, 'Vui lòng nhập email'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu')
})

export type LoginFormValues = z.infer<typeof loginSchema>

// Register Schema
export const registerSchema = z
  .object({
    fullName: z.string().min(1, 'Vui lòng nhập họ và tên'),
    email: z.string().email('Email không hợp lệ').min(1, 'Vui lòng nhập email'),
    password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
    confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu')
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu không trùng khớp',
    path: ['confirmPassword']
  })

export type RegisterFormValues = z.infer<typeof registerSchema>

// API Response Types
export interface LoginResponse {
  accessToken: string
  refreshToken: string
  accessTokenExpiresAt: Date
  refreshTokenExpiresAt: Date
}

export interface RefreshTokenResponse {
  accessToken: string
  accessTokenExpiresAt: Date
}

export interface RegisterResponse {
  id: string
  email: string
  fullName: string
}
