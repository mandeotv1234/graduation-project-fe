export interface DecodedToken {
  uid: number
  role: string
  email: string
  iat: number
  exp: number
}

/**
 * Decode JWT token payload without verification.
 * Works in both server (Node.js) and client environments.
 * Used for extracting role/user info — NOT for security validation.
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
