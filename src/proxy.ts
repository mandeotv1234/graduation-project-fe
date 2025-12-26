import { NextRequest, NextResponse } from 'next/server'
import {
  COOKIE_BASE_OPTIONS,
  PATH,
  PRIVATE_PATH,
  PUBLIC_PATH
} from './lib/constants'
import { getCookie, setCookie } from './lib/utils'
import { refreshNewAccessToken } from './lib/actions/auth.action'

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
    const newAccessToken = await refreshNewAccessToken(refreshToken)
    if (newAccessToken.data) {
      setCookie('accessToken', newAccessToken.data.accessToken, {
        expires: new Date(newAccessToken.data.accessTokenExpiresAt),
        ...COOKIE_BASE_OPTIONS
      })
      return NextResponse.redirect(new URL(pathname, request.url))
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
