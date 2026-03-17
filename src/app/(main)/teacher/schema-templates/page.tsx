import { redirect } from 'next/navigation'
import { PATH } from '@/lib/constants'

export default function LegacySpecificationsRedirectPage() {
  redirect(PATH.TEACHER_SPECIFICATIONS)
}
