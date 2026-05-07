import { redirect } from 'next/navigation'
import { PATH } from '@/lib/constants'

export default function AdminPage() {
  redirect(PATH.ADMIN_FEEDBACKS)
}
