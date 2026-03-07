import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'

import '@/app/globals.css'
import { ReduxProvider } from '@/lib/redux'
import { Toaster } from 'sonner'
import { ThemeProvider } from '@/components/shared/theme-provider'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin']
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin']
})

export const metadata: Metadata = {
  title: 'Graduation Project',
  description: 'Graduation Project'
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ReduxProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster
              position="top-right"
              expand={true}
              richColors
              closeButton
              duration={4000}
              toastOptions={{
                classNames: {
                  toast: 'group toast',
                  title: 'text-sm font-semibold',
                  description: 'text-sm opacity-90',
                  actionButton: 'bg-zinc-400',
                  cancelButton: 'bg-orange-400',
                  closeButton: 'bg-background border-border hover:bg-accent',
                  error: 'bg-red-600 text-white border-red-700',
                  success: 'bg-green-600 text-white border-green-700',
                  warning: 'bg-amber-500 text-white border-amber-600',
                  info: 'bg-blue-600 text-white border-blue-700'
                }
              }}
            />
          </ThemeProvider>
        </ReduxProvider>
      </body>
    </html>
  )
}
