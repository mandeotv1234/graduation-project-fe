'use client'

import Link from 'next/link'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PATH } from '@/lib/constants'

import { useLogin } from '@/app/(auth)/login/hooks/use-login'

export function LoginForm() {
  const { register, handleSubmit, errors, isLoading, onSubmit } = useLogin()

  return (
    <div className="space-y-8 rounded-2xl border border-border bg-card p-8 shadow-sm backdrop-blur">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Đăng nhập hệ thống
        </h1>
        <p className="text-sm text-muted-foreground">
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
            <p id="email-error" className="text-sm text-destructive">
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
            <p id="password-error" className="text-sm text-destructive">
              {errors.password.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          className="h-11 w-full rounded-lg text-base font-semibold"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Đang đăng nhập...
            </>
          ) : (
            'Đăng nhập'
          )}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
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
