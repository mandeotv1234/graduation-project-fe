export const ROLES = Object.freeze({
  ADMIN: 'admin',
  STUDENT: 'student',
  TEACHER: 'teacher'
})

export const COOKIE_BASE_OPTIONS = {
  httpOnly: true,
  sameSite: 'strict' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/'
}
