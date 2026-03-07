export const ROLES = Object.freeze({
  ADMIN: 'ADMIN',
  STUDENT: 'STUDENT',
  TEACHER: 'TEACHER'
})

export type UserRole = (typeof ROLES)[keyof typeof ROLES]

export const COOKIE_BASE_OPTIONS = {
  httpOnly: true,
  sameSite: 'strict' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/'
}
