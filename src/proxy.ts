import { NextRequest, NextResponse } from 'next/server'
import { PATH, PRIVATE_PATH, PUBLIC_PATH } from '@/lib/constants'
import { ApiResponse, RefreshTokenResponse } from '@/lib/types'

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

  if (PUBLIC_PATH.some((path) => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  const isPrivateRoute =
    pathname === PATH.HOME ||
    PRIVATE_PATH.some((path) => pathname.startsWith(path))

  if (!isPrivateRoute) {
    return NextResponse.next()
  }

  const accessToken = request.cookies.get('accessToken')?.value
  if (accessToken) {
    return NextResponse.next()
  }

  const refreshToken = request.cookies.get('refreshToken')?.value

  // POST = server action call; redirect would break the RSC protocol.
  // ApiClient handles token refresh for server actions instead.
  if (request.method === 'POST') {
    return NextResponse.next()
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
    sameSite: 'strict',
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
