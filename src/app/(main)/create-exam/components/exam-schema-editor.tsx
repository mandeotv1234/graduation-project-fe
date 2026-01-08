'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { SchemaTab } from '@/lib/types/create-exam.type'
import SchemaEditorModal from './schema-editor-modal'

interface ExamSchemaEditorProps {
  schema: string
  onSchemaChange: (schema: string) => void
}

export default function ExamSchemaEditor({
  schema,
  onSchemaChange
}: ExamSchemaEditorProps) {
  const [activeTab, setActiveTab] = useState<string>('sql')
  const [isModalOpen, setIsModalOpen] = useState(false)

  const tabs: SchemaTab[] = [
    {
      id: 'sql',
      label: 'SQL CREATE TABLE',
      content: schema
    },
    {
      id: 'dbnl',
      label: 'DBNL',
      content: ''
    }
  ]

  const handleSaveSchema = (newSchema: string) => {
    onSchemaChange(newSchema)
  }

  return (
    <div className="space-y-3">
      <Label className="text-base font-semibold">Cấu trúc bảng (Schema)</Label>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-card border border-border">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="sql" className="mt-3">
          <div className="border border-input rounded-md bg-background p-4">
            <pre className="font-mono text-xs sm:text-sm text-foreground whitespace-pre-wrap">
              <code>
                {schema || '-- Dán câu lệnh SQL CREATE TABLE của bạn vào đây'}
              </code>
            </pre>
          </div>
          <div className="mt-2 flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(true)}
            >
              Chỉnh sửa
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="dbnl" className="mt-3">
          <div className="border border-input rounded-md bg-background p-4 text-center text-muted-foreground">
            Tính năng DBNL đang được phát triển
          </div>
        </TabsContent>
      </Tabs>

      <SchemaEditorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        schema={schema}
        onSave={handleSaveSchema}
      />
    </div>
  )
}
