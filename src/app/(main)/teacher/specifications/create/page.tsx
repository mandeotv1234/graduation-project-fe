import type { Metadata } from 'next'
import { SpecificationCreateView } from './components/specification-create-view'

export const metadata: Metadata = {
  title: 'Tạo đặc tả CSDL'
}

export default function CreateSpecificationPage() {
  return <SpecificationCreateView />
}
