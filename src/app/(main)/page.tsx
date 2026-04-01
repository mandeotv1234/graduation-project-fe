import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { PATH } from '@/lib/constants'

export default async function Home() {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('accessToken')?.value
  const userRole = cookieStore.get('userRole')?.value

  if (!accessToken) {
    redirect(PATH.LOGIN)
  }

  if (userRole === 'TEACHER') {
    redirect(PATH.TEACHER_CLASSES)
  }

  if (userRole === 'STUDENT') {
    redirect(PATH.STUDENT_EXAMS)
  }

  // Fallback to login if role is unknown
  redirect(PATH.LOGIN)
}
