import type { Metadata } from 'next'

import CreateClassPageClient from '@/app/(main)/teacher/classes/create/components/create-class-page'

export const metadata: Metadata = {
  title: 'Tạo lớp học'
}

export default function CreateClassPage() {
  return <CreateClassPageClient />
}
