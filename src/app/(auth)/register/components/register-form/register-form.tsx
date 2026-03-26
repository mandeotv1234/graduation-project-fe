'use client'

import Link from 'next/link'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PATH } from '@/lib/constants'

import { useRegister } from '@/app/(auth)/register/hooks/use-register'
import styles from './register-form.module.scss'

export function RegisterForm() {
  const { register, handleSubmit, errors, isLoading, onSubmit } = useRegister()

  return (
    <div className={styles.registerContainer}>
      <div className={styles.header}>
        <p className={styles.badge}>Bắt đầu với DATN</p>
        <h1 className={styles.title}>Tạo tài khoản mới</h1>
        <p className={styles.description}>
          Nhập thông tin cá nhân để hoàn tất đăng ký
        </p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className={styles.registrationForm}
        noValidate
      >
        <div className={styles.fieldGroup}>
          <Label htmlFor="fullName" className={styles.fieldLabel}>
            Họ và tên
          </Label>
          <Input
            id="fullName"
            type="text"
            autoComplete="name"
            placeholder="Nguyễn Văn A"
            aria-invalid={Boolean(errors.fullName)}
            aria-describedby="fullName-error"
            className={styles.fieldInput}
            {...register('fullName')}
          />
          {errors.fullName && (
            <p id="fullName-error" className={styles.errorMessage}>
              {errors.fullName.message}
            </p>
          )}
        </div>

        <div className={styles.fieldGroup}>
          <Label htmlFor="email" className={styles.fieldLabel}>
            Email
          </Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="name@student.edu.vn"
            aria-invalid={Boolean(errors.email)}
            aria-describedby="reg-email-error"
            className={styles.fieldInput}
            {...register('email')}
          />
          {errors.email && (
            <p id="reg-email-error" className={styles.errorMessage}>
              {errors.email.message}
            </p>
          )}
        </div>

        <div className={styles.fieldGroup}>
          <Label htmlFor="password" className={styles.fieldLabel}>
            Mật khẩu
          </Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="Tối thiểu 6 ký tự"
            aria-invalid={Boolean(errors.password)}
            aria-describedby="reg-password-error"
            className={styles.fieldInput}
            {...register('password')}
          />
          {errors.password && (
            <p id="reg-password-error" className={styles.errorMessage}>
              {errors.password.message}
            </p>
          )}
        </div>

        <div className={styles.fieldGroup}>
          <Label htmlFor="confirmPassword" className={styles.fieldLabel}>
            Xác nhận mật khẩu
          </Label>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="Nhập lại mật khẩu"
            aria-invalid={Boolean(errors.confirmPassword)}
            aria-describedby="reg-confirm-password-error"
            className={styles.fieldInput}
            {...register('confirmPassword')}
          />
          {errors.confirmPassword && (
            <p id="reg-confirm-password-error" className={styles.errorMessage}>
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <p className={styles.termsSection}>
          Bằng việc tiếp tục, bạn xác nhận đã đọc và đồng ý với{' '}
          <Link href="#" className={styles.termsLink}>
            Quy định sử dụng
          </Link>{' '}
          của hệ thống.
        </p>

        <Button
          type="submit"
          className={styles.submitButton}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className={styles.loadingSpinner} />
              Đang tạo tài khoản...
            </>
          ) : (
            'Đăng ký'
          )}
        </Button>
      </form>

      <p className={styles.loginRedirect}>
        Đã có tài khoản?{' '}
        <Link href={PATH.LOGIN} className={styles.loginLink}>
          Đăng nhập
        </Link>
      </p>
    </div>
  )
}
