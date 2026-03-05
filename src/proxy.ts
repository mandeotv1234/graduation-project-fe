import { NextRequest, NextResponse } from 'next/server'
import { PATH, PRIVATE_PATH, PUBLIC_PATH } from './lib/constants'
import { getCookie } from './lib/utils'

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  if (PUBLIC_PATH.some((path) => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  const isPrivatePath =
    pathname == PATH.HOME ||
    PRIVATE_PATH.some((path) => pathname.startsWith(path))
  const accessToken = await getCookie('accessToken')

  if (isPrivatePath && !accessToken) {
    const refreshToken = await getCookie('refreshToken')
    if (!refreshToken) {
      return NextResponse.redirect(new URL(PATH.LOGIN, request.url))
    }

    // Try to refresh - import dynamically to avoid circular deps
    try {
      const { refreshNewAccessToken } = await import(
        './lib/actions/auth.action'
      )
      const newAccessToken = await refreshNewAccessToken()
      if (newAccessToken.data) {
        return NextResponse.redirect(new URL(pathname, request.url))
      }
    } catch {
      // Refresh failed (expired, reuse detected, etc.) — fall through to redirect
    }

    return NextResponse.redirect(new URL(PATH.LOGIN, request.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|\\.well-known/appspecific/com\\.chrome\\.devtools|assets/images).*)'
  ]
}
