'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { SchemaTab } from '@/lib/types/create-exam.type'
import SchemaEditorModal from '@/app/(main)/create-exam/components/schema-editor-modal/schema-editor-modal'
import styles from '@/app/(main)/create-exam/components/exam-schema-editor/exam-schema-editor.module.scss'

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
    <div className={styles.schemaEditorContainer}>
      <Label className={styles.sectionTitle}>Cấu trúc bảng (Schema)</Label>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className={styles.schemaTabs}
      >
        <TabsList className={styles.tabsList}>
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

        <TabsContent value="sql" className={styles.tabContent}>
          <div className="border border-input rounded-md bg-background p-4">
            <pre className="font-mono text-xs sm:text-sm text-foreground whitespace-pre-wrap">
              <code>
                {schema || '-- Dán câu lệnh SQL CREATE TABLE của bạn vào đây'}
              </code>
            </pre>
          </div>
          <div className={styles.tabActions}>
            <span className={styles.schemaInfo}>
              Câu lệnh SQL tạo bảng dữ liệu cho bài tập
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(true)}
              className={styles.editButton}
            >
              Chỉnh sửa
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="dbnl" className={styles.tabContent}>
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
