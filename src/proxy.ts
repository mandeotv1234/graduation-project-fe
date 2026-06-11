import { NextRequest, NextResponse } from 'next/server'
import { PATH, PRIVATE_PATH, PUBLIC_PATH, ROLES } from '@/lib/constants'
import { ApiResponse, RefreshTokenResponse } from '@/lib/types'
import { decodeJwtPayload } from '@/lib/utils'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'
const REFRESH_ENDPOINT = '/auth/refresh'

function parseExpiryDate(dateStr: string): Date {
  const date = new Date(dateStr.replace('T', ' '))
  if (isNaN(date.getTime())) {
    return new Date(Date.now() + 60 * 60 * 1000)
  }
  return date
}

function clearAuthCookies(response: NextResponse): NextResponse {
  response.cookies.delete('accessToken')
  response.cookies.delete('refreshToken')
  response.cookies.delete('userRole')
  return response
}

/**
 * Tier-1 anti-tamper hardening: per-request CSP nonce + frame-busting.
 * Blocks the naive injection vector (pasting an inline <script> to disable anti-cheat).
 * Privileged contexts (DevTools, extensions) bypass CSP — server-side heartbeat
 * detection (Tier 2) is the real backstop.
 */
function buildCsp(nonce: string): string {
  let apiOrigin = ''
  try {
    apiOrigin = new URL(API_URL).origin
  } catch {
    apiOrigin = ''
  }

  const isDev = process.env.NODE_ENV !== 'production'
  // Dev needs eval/inline for HMR + React Refresh.
  // Prod: 'self' allows Next.js static chunks (strict-dynamic would disable it and block them);
  // nonce gates inline scripts; wasm-unsafe-eval is needed for Monaco/WASM workers.
  const scriptSrc = isDev
    ? "'self' 'unsafe-eval' 'unsafe-inline' 'wasm-unsafe-eval' blob: https://cdn.jsdelivr.net https://accounts.google.com/gsi/"
    : `'self' 'nonce-${nonce}' 'wasm-unsafe-eval' https://accounts.google.com/gsi/ https://cdn.jsdelivr.net 'sha256-wkjS4zijHQljbuQzwpQdd2Wvq3fpRtpxgPGRt+U5jFY='`

  return [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net", // Tailwind / inline styles + Monaco CSS
    "img-src 'self' data: blob: https://lh3.googleusercontent.com",
    "font-src 'self' data:",
    "worker-src 'self' blob:", // Monaco editor workers
    `connect-src 'self' ${apiOrigin} ws: wss: https:`.replace(/\s+/g, ' '),
    "frame-src 'self' blob: https://accounts.google.com", // blob: cho iframe xem PDF đặc tả đề thi
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'"
  ].join('; ')
}

/**
 * NextResponse.next() with the CSP nonce threaded into both the request headers
 * (so RSC can read x-nonce) and the response headers.
 */
function nextWithCsp(
  request: NextRequest,
  nonce: string,
  csp: string
): NextResponse {
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)
  requestHeaders.set('content-security-policy', csp)
  const response = NextResponse.next({ request: { headers: requestHeaders } })
  response.headers.set('content-security-policy', csp)
  return response
}

async function refreshAccessToken(
  refreshToken: string
): Promise<RefreshTokenResponse | null> {
  try {
    const res = await fetch(`${API_URL}${REFRESH_ENDPOINT}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    })

    if (!res.ok) return null

    const body = (await res.json()) as ApiResponse<RefreshTokenResponse>
    return body.data ?? null
  } catch {
    return null
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
  const csp = buildCsp(nonce)

  // ── If already authenticated, redirect away from public auth pages ──
  if (PUBLIC_PATH.some((path) => pathname.startsWith(path))) {
    const accessToken = request.cookies.get('accessToken')?.value
    const refreshToken = request.cookies.get('refreshToken')?.value
    if (accessToken || refreshToken) {
      // Decode role from token to redirect to the correct default page
      const decoded = accessToken ? decodeJwtPayload(accessToken) : null
      const role = decoded?.role
      let redirectTo: string
      switch (role) {
        case ROLES.STUDENT:
          redirectTo = PATH.STUDENT_EXAMS
          break
        case ROLES.TEACHER:
          redirectTo = PATH.TEACHER_CLASSES
          break
        default:
          redirectTo = PATH.STUDENT_EXAMS
      }
      return NextResponse.redirect(new URL(redirectTo, request.url))
    }
    return nextWithCsp(request, nonce, csp)
  }

  const isPrivateRoute =
    pathname === PATH.HOME ||
    PRIVATE_PATH.some((path) => pathname.startsWith(path))

  if (!isPrivateRoute) {
    return nextWithCsp(request, nonce, csp)
  }

  const accessToken = request.cookies.get('accessToken')?.value
  if (accessToken) {
    return nextWithCsp(request, nonce, csp)
  }

  const refreshToken = request.cookies.get('refreshToken')?.value

  // POST = server action call; redirect would break the RSC protocol.
  // ApiClient handles token refresh for server actions instead.
  if (request.method === 'POST') {
    return nextWithCsp(request, nonce, csp)
  }

  if (!refreshToken) {
    return NextResponse.redirect(new URL(PATH.LOGIN, request.url))
  }

  const tokenData = await refreshAccessToken(refreshToken)

  if (!tokenData) {
    const response = NextResponse.redirect(new URL(PATH.LOGIN, request.url))
    return clearAuthCookies(response)
  }

  const response = NextResponse.redirect(new URL(pathname, request.url))
  response.cookies.set('accessToken', tokenData.accessToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: parseExpiryDate(tokenData.accessTokenExpiresAt)
  })

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|\\.well-known/appspecific/com\\.chrome\\.devtools|assets/images).*)'
  ]
}
