import type { Metadata } from 'next'

import { EditClassPage } from '@/app/(main)/teacher/classes/[classId]/edit/components/edit-class-page'

export const metadata: Metadata = {
  title: 'Tạo lớp học'
}

export default function CreateClassPage() {
  return <EditClassPage />
}
