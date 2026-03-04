export interface DecodedToken {
  uid: number
  role: string
  email: string
  iat: number
  exp: number
}

/**
 * Decode JWT token payload without verification.
 * Only use on client-side for extracting role/user info.
 */
export function decodeJwtPayload(token: string): DecodedToken | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null

    const payload = parts[1]
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(decoded) as DecodedToken
  } catch {
    return null
  }
}
