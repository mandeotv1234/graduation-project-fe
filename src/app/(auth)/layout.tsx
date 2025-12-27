import Link from 'next/link'
import type { ReactNode } from 'react'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <section className="grid min-h-screen w-full bg-background text-foreground lg:grid-cols-2">
      <div className="relative hidden min-h-screen overflow-hidden bg-muted px-12 py-14 text-muted-foreground lg:flex lg:flex-col lg:justify-between">
        <div className="space-y-6">
          <Link
            href="/"
            className="text-lg font-semibold tracking-tight text-foreground"
          >
            DATN Portal
          </Link>
          <h2 className="text-4xl font-semibold leading-snug text-foreground">
            Tăng tốc đồ án tốt nghiệp với hệ thống quản lý tập trung.
          </h2>
          <p className="text-base text-muted-foreground">
            Theo dõi tiến độ, cộng tác với giảng viên và cập nhật thông tin đồ
            án ngay tại một nơi duy nhất.
          </p>
        </div>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p className="font-medium">
            “Focus on building, we will handle the workflow.”
          </p>
          <p>— Graduation Project Platform</p>
        </div>
        <div className="pointer-events-none absolute inset-y-20 right-0 hidden w-1/2 rounded-l-full bg-primary/10 blur-[120px] lg:block" />
      </div>
      <div className="flex min-h-screen items-center justify-center px-6 py-12 sm:px-10 lg:px-16">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </section>
  )
}
