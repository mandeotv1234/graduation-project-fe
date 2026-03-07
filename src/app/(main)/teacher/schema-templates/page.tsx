import { getSchemaTemplates } from '@/lib/actions'
import { SchemaTemplatesView } from '@/app/(main)/teacher/schema-templates/components/schema-templates-view'

export default async function SchemaTemplatesPage() {
  const response = await getSchemaTemplates()
  const templates = response.data || []

  return <SchemaTemplatesView initialTemplates={templates} />
}
