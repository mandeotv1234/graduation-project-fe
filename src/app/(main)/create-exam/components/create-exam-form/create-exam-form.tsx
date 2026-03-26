'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import CreateExamHeader from '@/app/(main)/create-exam/components/create-exam-header/create-exam-header'
import ExamBasicInfo from '@/app/(main)/create-exam/components/exam-basic-info/exam-basic-info'
import ExamDescriptionEditor from '@/app/(main)/create-exam/components/exam-description-editor/exam-description-editor'
import ExamSchemaEditor from '@/app/(main)/create-exam/components/exam-schema-editor/exam-schema-editor'
import ExamSampleDataTable from '@/app/(main)/create-exam/components/exam-sample-data-table/exam-sample-data-table'
import ExamFileUpload from '@/app/(main)/create-exam/components/exam-file-upload/exam-file-upload'
import { ExamFormData } from '@/lib/types/create-exam.type'
import { toast } from 'sonner'
import styles from '@/app/(main)/create-exam/components/create-exam-form/create-exam-form.module.scss'

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
      // TODO: Replace with real API call (e.g. createExam action)
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
    <div className={styles.formContainer}>
      <CreateExamHeader
        onCancel={handleCancel}
        onSave={handleSave}
        isSaving={isSaving}
      />

      <div className={styles.formContent}>
        <div className={styles.contentWrapper}>
          <div className={styles.section}>
            <ExamBasicInfo
              title={formData.title}
              onTitleChange={(title) =>
                setFormData((prev) => ({ ...prev, title }))
              }
            />
          </div>

          <div className={styles.section}>
            <ExamDescriptionEditor
              content={formData.description}
              onContentChange={(description) =>
                setFormData((prev) => ({ ...prev, description }))
              }
            />
          </div>

          <div className={styles.section}>
            <ExamSchemaEditor
              schema={formData.schema}
              onSchemaChange={(schema) =>
                setFormData((prev) => ({ ...prev, schema }))
              }
            />
          </div>

          <div className={styles.section}>
            <ExamSampleDataTable
              data={formData.sampleData}
              onDataChange={(sampleData) =>
                setFormData((prev) => ({ ...prev, sampleData }))
              }
            />
          </div>

          <div className={styles.section}>
            <ExamFileUpload
              files={formData.attachments}
              onFilesChange={(attachments) =>
                setFormData((prev) => ({ ...prev, attachments }))
              }
            />
          </div>
        </div>
      </div>
    </div>
  )
}
