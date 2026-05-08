import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { PATH, ROLES } from '@/lib/constants'

export default async function Home() {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('accessToken')?.value
  const userRole = cookieStore.get('userRole')?.value

  if (!accessToken) {
    redirect(PATH.LOGIN)
  }

  if (userRole === ROLES.TEACHER) {
    redirect(PATH.TEACHER_CLASSES)
  }

  if (userRole === ROLES.STUDENT) {
    redirect(PATH.STUDENT_EXAMS)
  }

  if (userRole === ROLES.ADMIN) {
    redirect(PATH.ADMIN_FEEDBACKS)
  }

  // Fallback to login if role is unknown
  redirect(PATH.LOGIN)
}
