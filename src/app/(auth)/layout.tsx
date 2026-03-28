import Link from 'next/link'
import type { ReactNode } from 'react'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-6 py-12 sm:px-10 lg:px-16">
      <div className="pointer-events-none absolute inset-0 overflow-hidden select-none">
        <div className="absolute -left-[10%] -top-[10%] h-[40vw] w-[40vw] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[10%] h-[30vw] w-[30vw] rounded-full bg-primary/10 blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-10 text-center">
          <Link
            href="/"
            className="inline-block text-2xl font-black tracking-tight text-primary transition-transform hover:scale-105"
          >
            Hệ Thống Thi CSDL
          </Link>
        </div>
        {children}
      </div>
    </section>
  )
}
