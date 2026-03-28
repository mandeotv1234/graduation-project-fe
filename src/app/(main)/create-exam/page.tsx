import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { PATH } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Tao de thi chung'
}

export default function CreateExamPage() {
  redirect(PATH.TEACHER_CLASSES)
}
