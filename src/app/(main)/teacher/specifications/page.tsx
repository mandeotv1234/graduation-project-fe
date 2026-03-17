import { getSpecifications } from '@/lib/actions'
import { SpecificationsView } from '@/app/(main)/teacher/specifications/components/specifications-view'

export default async function SpecificationsPage() {
  const response = await getSpecifications()
  const specifications = response.data || []

  return <SpecificationsView initialSpecifications={specifications} />
}
