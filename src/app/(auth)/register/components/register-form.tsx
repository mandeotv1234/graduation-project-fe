'use client'

import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PATH } from '@/lib/constants'

import { useRegister } from '../hooks/use-register'

export function RegisterForm() {
  const { register, handleSubmit, errors, isLoading, onSubmit } = useRegister()

  return (
    <div className="space-y-8 rounded-2xl border border-zinc-200/70 bg-white/90 p-8 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900">
      <div className="space-y-2 text-center">
        <p className="text-sm font-medium uppercase tracking-wider text-primary">
          Bắt đầu với DATN
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Tạo tài khoản mới
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Nhập thông tin cá nhân để hoàn tất đăng ký
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <div className="space-y-2">
          <Label htmlFor="fullName">Họ và tên</Label>
          <Input
            id="fullName"
            type="text"
            autoComplete="name"
            placeholder="Nguyễn Văn A"
            aria-invalid={Boolean(errors.fullName)}
            aria-describedby="fullName-error"
            {...register('fullName')}
          />
          {errors.fullName && (
            <p id="fullName-error" className="text-sm text-rose-500">
              {errors.fullName.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="name@student.edu.vn"
            aria-invalid={Boolean(errors.email)}
            aria-describedby="reg-email-error"
            {...register('email')}
          />
          {errors.email && (
            <p id="reg-email-error" className="text-sm text-rose-500">
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Mật khẩu</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="Tối thiểu 6 ký tự"
            aria-invalid={Boolean(errors.password)}
            aria-describedby="reg-password-error"
            {...register('password')}
          />
          {errors.password && (
            <p id="reg-password-error" className="text-sm text-rose-500">
              {errors.password.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="Nhập lại mật khẩu"
            aria-invalid={Boolean(errors.confirmPassword)}
            aria-describedby="reg-confirm-password-error"
            {...register('confirmPassword')}
          />
          {errors.confirmPassword && (
            <p
              id="reg-confirm-password-error"
              className="text-sm text-rose-500"
            >
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Bằng việc tiếp tục, bạn xác nhận đã đọc và đồng ý với{' '}
          <Link href="#" className="font-medium text-primary hover:underline">
            Quy định sử dụng
          </Link>{' '}
          của hệ thống.
        </p>

        <Button
          type="submit"
          className="h-11 w-full rounded-lg text-base font-semibold"
          disabled={isLoading}
        >
          {isLoading ? 'Đang tạo tài khoản...' : 'Đăng ký'}
        </Button>
      </form>

      <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
        Đã có tài khoản?{' '}
        <Link
          href={PATH.LOGIN}
          className="font-medium text-primary hover:underline"
        >
          Đăng nhập
        </Link>
      </p>
    </div>
  )
}
