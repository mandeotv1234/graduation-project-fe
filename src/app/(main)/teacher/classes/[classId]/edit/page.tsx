import { EditClassPage } from './components/edit-class-page'

export default async function Page({
  params
}: {
  params: Promise<{ classId: string }>
}) {
  const { classId } = await params
  return <EditClassPage classId={Number(classId)} />
}
