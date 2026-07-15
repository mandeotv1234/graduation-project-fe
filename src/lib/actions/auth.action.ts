import { apiClient } from '@/lib/api'
import { COOKIE_BASE_OPTIONS, ENDPOINTS } from '@/lib/constants'
import {
  ApiResponse,
  GoogleLoginRequest,
  LoginFormValues,
  LoginResponse,
  MicrosoftLoginRequest,
  RefreshTokenResponse,
  RegisterFormValues,
  RegisterResponse,
  User
} from '@/lib/types'
import {
  setCookie,
  getCookie,
  decodeJwtPayload,
  toExpiryDate
} from '@/lib/utils'

async function setAuthCookies(response: LoginResponse): Promise<void> {
  const { accessToken, refreshToken } = response

  // Decode token to extract role
  const decoded = decodeJwtPayload(accessToken)

  // Parse expiry dates safely
  const accessExpiry = toExpiryDate(response.accessTokenExpiresAt)
  const refreshExpiry = toExpiryDate(response.refreshTokenExpiresAt)

  // Set cookies in parallel
  await Promise.all([
    setCookie('accessToken', accessToken, {
      expires: accessExpiry,
      ...COOKIE_BASE_OPTIONS
    }),
    setCookie('refreshToken', refreshToken, {
      expires: refreshExpiry,
      ...COOKIE_BASE_OPTIONS
    }),
    // Store role for middleware route protection (httpOnly for security)
    ...(decoded
      ? [
          setCookie('userRole', decoded.role, {
            expires: refreshExpiry,
            ...COOKIE_BASE_OPTIONS
          })
        ]
      : [])
  ])
}

export async function login(
  data: LoginFormValues
): Promise<ApiResponse<LoginResponse>> {
  const response = await apiClient.post<LoginResponse>(ENDPOINTS.LOGIN, data)

  if (response.data) {
    await setAuthCookies(response.data)
  }

  return response
}

export async function loginWithGoogle(
  data: GoogleLoginRequest
): Promise<ApiResponse<LoginResponse>> {
  const response = await apiClient.post<LoginResponse>(
    ENDPOINTS.LOGIN_OAUTH,
    data
  )

  if (response.data) {
    await setAuthCookies(response.data)
  }

  return response
}

export async function loginWithMicrosoft(
  data: MicrosoftLoginRequest
): Promise<ApiResponse<LoginResponse>> {
  const response = await apiClient.post<LoginResponse>(
    ENDPOINTS.LOGIN_MICROSOFT,
    data
  )

  if (response.data) {
    await setAuthCookies(response.data)
  }

  return response
}

export async function refreshNewAccessToken(): Promise<
  ApiResponse<RefreshTokenResponse>
> {
  const refreshToken = await getCookie('refreshToken')

  const response = await apiClient.post<RefreshTokenResponse>(
    ENDPOINTS.REFRESH_TOKEN,
    { refreshToken }
  )

  if (response.data) {
    const accessExpiry = toExpiryDate(response.data.accessTokenExpiresAt)
    const decoded = decodeJwtPayload(response.data.accessToken)

    await Promise.all([
      setCookie('accessToken', response.data.accessToken, {
        expires: accessExpiry,
        ...COOKIE_BASE_OPTIONS
      }),
      ...(decoded
        ? [
            setCookie('userRole', decoded.role, {
              expires: accessExpiry,
              ...COOKIE_BASE_OPTIONS
            })
          ]
        : [])
    ])
  }

  return response
}

export async function signUp(
  data: Omit<RegisterFormValues, 'confirmPassword'>
): Promise<ApiResponse<RegisterResponse>> {
  const response = await apiClient.post<RegisterResponse>(
    ENDPOINTS.REGISTER,
    data
  )

  return response
}

export async function logout(): Promise<void> {
  const refreshToken = await getCookie('refreshToken')

  // Call backend logout API to invalidate token in Redis
  try {
    if (refreshToken) {
      await apiClient.post(ENDPOINTS.LOGOUT, { refreshToken })
    }
  } catch {
    // Logout should succeed even if API call fails
  }

  // Clear all auth cookies
  await Promise.all([
    setCookie('accessToken', '', { maxAge: 0, path: '/' }),
    setCookie('refreshToken', '', { maxAge: 0, path: '/' }),
    setCookie('userRole', '', { maxAge: 0, path: '/' })
  ])

  // Clear MSAL storage and log out of the Microsoft session to prevent auto-login loop
  if (typeof window !== 'undefined') {
    const { msalInstance } = await import('@/lib/msal-config')

    // Fallback: manually clear storage just in case
    const clearMsal = (storage: Storage) => {
      Object.keys(storage).forEach((key) => {
        if (key.startsWith('msal.')) {
          storage.removeItem(key)
        }
      })
    }

    if (msalInstance.getAllAccounts().length > 0) {
      // User is logged in via MSAL. Redirect to Microsoft to end the session completely.
      await msalInstance.logoutRedirect({
        postLogoutRedirectUri: window.location.origin + '/login'
      })
      // Avoid clearing local storage manually here, let msalInstance handle it cleanly
    } else {
      // Make sure the cache is gone for standard logged-out state
      clearMsal(window.localStorage)
      clearMsal(window.sessionStorage)
    }
  }
}

export async function getMe(): Promise<ApiResponse<User>> {
  return await apiClient.get<User>(ENDPOINTS.USER_ME)
}
