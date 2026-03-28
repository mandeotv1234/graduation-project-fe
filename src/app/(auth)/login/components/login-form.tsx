'use client'

import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useLogin } from '@/app/(auth)/login/hooks/use-login'
import { GoogleIcon } from '@/components/icons/google'
import { MicrosoftIcon } from '@/components/icons/microsoft'

export function LoginForm() {
  const {
    register,
    formState: { errors },
    isLoading,
    handleSubmit,
    onSubmit,
    onGoogleLogin,
    onMicrosoftLogin
  } = useLogin()

  return (
    <div className="space-y-8 rounded-2xl border border-border bg-card/50 p-8 shadow-xl backdrop-blur-md">
      <div className="space-y-3 text-center">
        <h1 className="text-3xl font-black tracking-tight text-foreground">
          Đăng Nhập
        </h1>
        <p className="text-sm text-muted-foreground">
          Đăng nhập với Google hoặc Microsoft nếu chưa đặt mật khẩu
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            // placeholder="mssv@student.hcmus.edu.vn"
            className="h-11 bg-background/50 focus-visible:ring-primary/30"
            aria-invalid={Boolean(errors.email)}
            aria-describedby="email-error"
            {...register('email')}
          />
          {errors.email && (
            <p
              id="email-error"
              className="text-xs font-medium text-destructive"
            >
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-sm font-medium">
              Mật khẩu
            </Label>
            {/* TODO: Add forgot password functionality */}
            {/* <Link
              href="#"
              className="text-xs font-medium text-primary hover:underline"
            >
              Quên mật khẩu?
            </Link> */}
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            className="h-11 bg-background/50 focus-visible:ring-primary/30"
            aria-invalid={Boolean(errors.password)}
            aria-describedby="password-error"
            {...register('password')}
          />
          {errors.password && (
            <p
              id="password-error"
              className="text-xs font-medium text-destructive"
            >
              {errors.password.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          className="h-12 w-full rounded-xl bg-primary text-base font-bold text-primary-foreground shadow-lg transition-all hover:scale-[1.01] hover:shadow-primary/20 active:scale-[0.99]"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Đang đăng nhập...
            </>
          ) : (
            'Đăng nhập'
          )}
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border/60" />
        </div>
        <div className="relative flex justify-center text-xs font-bold uppercase tracking-widest">
          <span className="bg-card px-4 text-muted-foreground/60">
            Hoặc tiếp tục với
          </span>
        </div>
      </div>

      <div className="grid grid-rows-2 gap-4">
        <Button
          variant="outline"
          className="group relative h-12 overflow-hidden rounded-xl border-border/60 bg-background/50 px-4 font-semibold transition-all hover:border-primary/50 hover:bg-background hover:shadow-md active:scale-95"
          onClick={() => onGoogleLogin()}
          disabled={isLoading}
        >
          <GoogleIcon className="mr-1 h-5 w-5 transition-transform group-hover:scale-110" />
          <span>Đăng nhập với Google</span>
        </Button>
        <Button
          variant="outline"
          className="group relative h-12 overflow-hidden rounded-xl border-border/60 bg-background/50 px-4 font-semibold transition-all hover:border-primary/50 hover:bg-background hover:shadow-md active:scale-95"
          onClick={onMicrosoftLogin}
          disabled={isLoading}
        >
          <MicrosoftIcon className="mr-1 h-5 w-5 transition-transform group-hover:scale-110" />
          <span>Đăng nhập với Microsoft</span>
        </Button>
      </div>
    </div>
  )
}
