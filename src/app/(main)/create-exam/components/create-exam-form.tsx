'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import CreateExamHeader from './create-exam-header'
import ExamBasicInfo from './exam-basic-info'
import ExamDescriptionEditor from './exam-description-editor'
import ExamSchemaEditor from './exam-schema-editor'
import ExamSampleDataTable from './exam-sample-data-table'
import ExamFileUpload from './exam-file-upload'
import { ExamFormData } from '@/lib/types/create-exam.type'
import { toast } from 'sonner'

export default function CreateExamForm() {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)

  const [formData, setFormData] = useState<ExamFormData>({
    title: '',
    description: '',
    schema: `CREATE TABLE Students (
  StudentID INT PRIMARY KEY,
  FirstName VARCHAR(50),
  LastName VARCHAR(50)
);`,
    sampleData: [
      { studentId: '1', firstName: 'An', lastName: 'Nguyễn' },
      { studentId: '2', firstName: 'Bình', lastName: 'Lê' },
      { studentId: '3', firstName: 'Chi', lastName: 'Trần' }
    ],
    attachments: []
  })

  const handleSave = async () => {
    // Validation
    if (!formData.title.trim()) {
      toast.error('Vui lòng nhập tiêu đề bài tập')
      return
    }

    setIsSaving(true)
    try {
      // TODO: Implement API call to save exam
      console.log('Saving exam:', formData)

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast.success('Đã lưu bài tập thành công!')
      router.push('/exam')
    } catch (error) {
      console.error('Error saving exam:', error)
      toast.error('Có lỗi xảy ra khi lưu bài tập')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    router.back()
  }

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
      <CreateExamHeader
        onCancel={handleCancel}
        onSave={handleSave}
        isSaving={isSaving}
      />

      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-6 pb-8 space-y-6">
          <ExamBasicInfo
            title={formData.title}
            onTitleChange={(title) =>
              setFormData((prev) => ({ ...prev, title }))
            }
          />

          <ExamDescriptionEditor
            content={formData.description}
            onContentChange={(description) =>
              setFormData((prev) => ({ ...prev, description }))
            }
          />

          <ExamSchemaEditor
            schema={formData.schema}
            onSchemaChange={(schema) =>
              setFormData((prev) => ({ ...prev, schema }))
            }
          />

          <ExamSampleDataTable
            data={formData.sampleData}
            onDataChange={(sampleData) =>
              setFormData((prev) => ({ ...prev, sampleData }))
            }
          />

          <ExamFileUpload
            files={formData.attachments}
            onFilesChange={(attachments) =>
              setFormData((prev) => ({ ...prev, attachments }))
            }
          />
        </div>
      </div>
    </div>
  )
}
