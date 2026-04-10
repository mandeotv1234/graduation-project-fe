import { redirect } from 'next/navigation'

import { SpecificationEditView } from '@/app/(main)/teacher/specifications/[specificationId]/edit/components/specification-edit-view'
import { getSpecificationDetail } from '@/lib/actions'
import { PATH } from '@/lib/constants'

interface SpecificationEditPageProps {
  params: Promise<{ specificationId: string }>
}

export default async function SpecificationEditPage({
  params
}: SpecificationEditPageProps) {
  const { specificationId } = await params
  const specificationIdNum = Number(specificationId)

  if (Number.isNaN(specificationIdNum)) {
    redirect(PATH.TEACHER_SPECIFICATIONS)
  }

  const response = await getSpecificationDetail(specificationIdNum)
  const specification = response.data

  if (!specification) {
    redirect(PATH.TEACHER_SPECIFICATIONS)
  }

  return <SpecificationEditView specification={specification} />
}
