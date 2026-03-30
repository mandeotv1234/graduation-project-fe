'use client'

import Link from 'next/link'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useLogin } from '@/app/(auth)/login/hooks/use-login'
import { GoogleIcon } from '@/components/icons/google'
import { MicrosoftIcon } from '@/components/icons/microsoft'
import styles from '@/app/(auth)/login/components/login-form/login-form.module.scss'

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
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Đăng nhập hệ thống</h1>
        <p className={styles.subtitle}>
          Đăng nhập với Google hoặc Microsoft nếu chưa đặt mật khẩu
        </p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className={styles.form}
        noValidate
      >
        <div className={styles.fieldGroup}>
          <Label htmlFor="email" className={styles.label}>
            Email
          </Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="name@student.edu.vn"
            className={styles.input}
            aria-invalid={Boolean(errors.email)}
            aria-describedby="email-error"
            {...register('email')}
          />
          {errors.email && (
            <p id="email-error" className={styles.errorText}>
              {errors.email.message}
            </p>
          )}
        </div>

        <div className={styles.fieldGroup}>
          <div className={styles.passwordHeader}>
            <Label htmlFor="password" className={styles.label}>
              Mật khẩu
            </Label>
            <Link href="#" className={styles.forgotPasswordLink}>
              Quên mật khẩu?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            className={styles.input}
            aria-invalid={Boolean(errors.password)}
            aria-describedby="password-error"
            {...register('password')}
          />
          {errors.password && (
            <p id="password-error" className={styles.errorText}>
              {errors.password.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          className={styles.submitButton}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className={styles.loadingIcon} />
              Đang đăng nhập...
            </>
          ) : (
            'Đăng nhập'
          )}
        </Button>
      </form>

      <div className={styles.divider}>
        <div className={styles.dividerLineWrapper}>
          <span className={styles.dividerLine} />
        </div>
        <div className={styles.dividerTextWrapper}>
          <span className={styles.dividerText}>Hoặc tiếp tục với</span>
        </div>
      </div>

      <div className={styles.socialActions}>
        <Button
          variant="outline"
          className={styles.socialButton}
          onClick={() => onGoogleLogin()}
          disabled={isLoading}
        >
          <GoogleIcon className={styles.socialIcon} />
          <span>Đăng nhập với Google</span>
        </Button>
        <Button
          variant="outline"
          className={styles.socialButton}
          onClick={onMicrosoftLogin}
          disabled={isLoading}
        >
          <MicrosoftIcon className={styles.socialIcon} />
          <span>Đăng nhập với Microsoft</span>
        </Button>
      </div>
    </div>
  )
}
