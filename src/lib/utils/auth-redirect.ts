import { PATH, ROLES } from '@/lib/constants'

const RETURN_URL_STORAGE_KEY = 'auth:return-url'

const ROLE_PATH_PREFIX: Record<string, string> = {
  [ROLES.ADMIN]: PATH.ADMIN,
  [ROLES.TEACHER]: PATH.TEACHER,
  [ROLES.STUDENT]: PATH.STUDENT
}

export function readRequestedReturnUrl(): string | null {
  if (typeof window === 'undefined') return null

  const queryValue = new URLSearchParams(window.location.search).get(
    'returnUrl'
  )
  if (queryValue) {
    window.sessionStorage.setItem(RETURN_URL_STORAGE_KEY, queryValue)
    return queryValue
  }

  return window.sessionStorage.getItem(RETURN_URL_STORAGE_KEY)
}

export function rememberRequestedReturnUrl(): void {
  readRequestedReturnUrl()
}

export function consumeSafeReturnUrl(role: unknown): string | null {
  if (typeof window === 'undefined') return null

  const rawReturnUrl = readRequestedReturnUrl()
  window.sessionStorage.removeItem(RETURN_URL_STORAGE_KEY)
  if (!rawReturnUrl || typeof role !== 'string') return null

  const requiredPrefix = ROLE_PATH_PREFIX[role]
  if (
    !requiredPrefix ||
    !rawReturnUrl.startsWith('/') ||
    rawReturnUrl.startsWith('//') ||
    rawReturnUrl.includes('\\')
  ) {
    return null
  }

  try {
    const parsed = new URL(rawReturnUrl, window.location.origin)
    if (parsed.origin !== window.location.origin) return null
    if (
      parsed.pathname !== requiredPrefix &&
      !parsed.pathname.startsWith(`${requiredPrefix}/`)
    ) {
      return null
    }
    return `${parsed.pathname}${parsed.search}${parsed.hash}`
  } catch {
    return null
  }
}
