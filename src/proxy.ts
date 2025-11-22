import { NextRequest, NextResponse } from 'next/server'
import { PATH, PRIVATE_PATH, PUBLIC_PATH } from './lib/constants'
import { getCookie, setCookie } from './lib/utils'

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  if (PUBLIC_PATH.some((path) => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  const isPrivatePath = PRIVATE_PATH.some((path) => pathname.startsWith(path))
  const accessToken = await getCookie('accessToken')

  if (isPrivatePath && !accessToken) {
    const refreshToken = await getCookie('refreshToken')
    if (!refreshToken) {
      return NextResponse.redirect(new URL(PATH.LOGIN, request.url))
    }
    // const newAccessToken = await refreshToken(refreshToken) // TODO: implement refresh token
    const newAccessToken = 'newAccessToken'
    if (newAccessToken) {
      setCookie('accessToken', newAccessToken)
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
