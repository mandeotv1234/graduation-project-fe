'use server'

import { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies'
import { cookies } from 'next/headers'

export async function getCookie(key: string) {
  const cookieStore = await cookies()
  return cookieStore.get(key)?.value
}

export async function setCookie(
  key: string,
  value: string,
  options?: Partial<ResponseCookie>
) {
  const cookieStore = await cookies()
  cookieStore.set(key, value, options)
}
