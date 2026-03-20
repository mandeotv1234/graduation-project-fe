'use client'

import { GoogleOAuthProvider } from '@react-oauth/google'
import { MsalProvider } from '@azure/msal-react'
import { useEffect, useState } from 'react'

import { msalInstance } from '@/lib/msal-config'

type AuthProvidersProps = {
  children: React.ReactNode
}

export function AuthProviders({ children }: AuthProvidersProps) {
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    msalInstance
      .initialize()
      .then(() => {
        setIsInitialized(true)
      })
      .catch((error) => {
        console.error('MSAL initialization failed:', error)
        setIsInitialized(true)
      })
  }, [])

  if (!isInitialized) return null

  return (
    <GoogleOAuthProvider
      clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''}
    >
      <MsalProvider instance={msalInstance}>{children}</MsalProvider>
    </GoogleOAuthProvider>
  )
}
