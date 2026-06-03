import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { headers } from 'next/headers'

import '@/app/globals.css'
import { ReduxProvider } from '@/lib/redux'
import { Toaster } from 'sonner'
import { ThemeProvider } from '@/components/shared/theme-provider'
import { AuthProviders } from '@/components/shared/auth-providers'
import { TeacherNotificationHandler } from '@/components/shared/teacher-notification-handler'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin']
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin']
})

export const metadata: Metadata = {
  title: {
    default: 'Graduation Project',
    template: '%s | Graduation Project'
  },
  description: 'Graduation Project'
}

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  const nonce = (await headers()).get('x-nonce') ?? ''

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        {/* Set __webpack_nonce__ before any other scripts so webpack adds the nonce
            to all dynamically injected chunks. Must be the first child of <body>. */}
        {nonce && (
          <script
            nonce={nonce}
            suppressHydrationWarning
            dangerouslySetInnerHTML={{
              __html: `window.__webpack_nonce__='${nonce}'`
            }}
          />
        )}
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProviders>
            <ReduxProvider>
              <TeacherNotificationHandler />
              {children}
              <Toaster
                position="bottom-right"
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
            </ReduxProvider>
          </AuthProviders>
        </ThemeProvider>
      </body>
    </html>
  )
}
