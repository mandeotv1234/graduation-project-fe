'use client'

import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PATH } from '@/lib/constants'

import { useLogin } from '../hooks/use-login'

export function LoginForm() {
  const { register, handleSubmit, errors, isLoading, onSubmit } = useLogin()

  return (
    <div className="space-y-8 rounded-2xl border border-zinc-200/70 bg-white/90 p-8 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Đăng nhập hệ thống
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Sử dụng email và mật khẩu được cấp bởi nhà trường
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="name@student.edu.vn"
            aria-invalid={Boolean(errors.email)}
            aria-describedby="email-error"
            {...register('email')}
          />
          {errors.email && (
            <p id="email-error" className="text-sm text-rose-500">
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Mật khẩu</Label>
            <Link
              href="#"
              className="text-xs font-medium text-primary hover:underline"
            >
              Quên mật khẩu?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            aria-invalid={Boolean(errors.password)}
            aria-describedby="password-error"
            {...register('password')}
          />
          {errors.password && (
            <p id="password-error" className="text-sm text-rose-500">
              {errors.password.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          className="h-11 w-full rounded-lg text-base font-semibold"
          disabled={isLoading}
        >
          {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </Button>
      </form>

      <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
        Chưa có tài khoản?{' '}
        <Link
          href={PATH.REGISTER}
          className="font-medium text-primary hover:underline"
        >
          Đăng ký ngay
        </Link>
      </p>
    </div>
  )
}
