import { getSchemaTemplates } from '@/lib/actions'
import { SchemaTemplatesView } from './components/schema-templates-view'

export default async function SchemaTemplatesPage() {
  const response = await getSchemaTemplates()
  const templates = response.data || []

  return <SchemaTemplatesView initialTemplates={templates} />
}
