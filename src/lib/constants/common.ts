export const ROLES = Object.freeze({
  ADMIN: 'ADMIN',
  STUDENT: 'STUDENT',
  TEACHER: 'TEACHER'
})

export type UserRole = (typeof ROLES)[keyof typeof ROLES]

export const COOKIE_BASE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: false, // TODO: Change to true in production
  path: '/'
}
