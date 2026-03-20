import { Configuration, PublicClientApplication } from '@azure/msal-browser'

export const msalConfig: Configuration = {
  auth: {
    clientId: process.env.NEXT_PUBLIC_AZURE_AD_CLIENT_ID || '',
    authority: `https://login.microsoftonline.com/${process.env.NEXT_PUBLIC_AZURE_AD_TENANT_ID}`,
    redirectUri:
      typeof window !== 'undefined'
        ? `${window.location.origin}/login`
        : '/login'
  },
  cache: {
    cacheLocation: 'sessionStorage'
  }
}

export const msalInstance = new PublicClientApplication(msalConfig)

export const loginRequest = {
  scopes: ['email', 'profile', 'openid']
}
