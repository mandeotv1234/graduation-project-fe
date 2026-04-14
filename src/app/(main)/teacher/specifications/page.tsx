import type { Metadata } from 'next'

import { getSpecifications } from '@/lib/actions'
import { SpecificationsView } from '@/app/(main)/teacher/specifications/components/specifications-view'

export const metadata: Metadata = {
  title: 'Đặc tả CSDL'
}

export default async function SpecificationsPage() {
  const response = await getSpecifications()
  const specifications = response.data || []

  return <SpecificationsView initialSpecifications={specifications} />
}
