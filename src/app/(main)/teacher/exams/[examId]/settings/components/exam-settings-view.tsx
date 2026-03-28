'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FileText, Database, Eye, EyeOff, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useState } from 'react'

import {
  hideExamTemplateLineage,
  updateExamTemplateVisibility,
  updateTeacherExamSettings
} from '@/lib/actions'
import { PATH } from '@/lib/constants'
import {
  CreateExamResponse,
  ExamSpecification,
  TeacherExamTemplateVersionsResponse
} from '@/lib/types'
import { useApi } from '@/hooks/use-api'
import { Button } from '@/components/ui/button'
import { ExamSettingsForm } from '@/app/(main)/teacher/exams/components/exam-settings-form'
import { ExamSettingsFormValues } from '@/app/(main)/teacher/exams/components/exam-settings-form-schema'

interface ExamSettingsViewProps {
  exam: CreateExamResponse
  specification: ExamSpecification | null
  templateManagement: TeacherExamTemplateVersionsResponse | null
}

function toDatetimeLocal(value?: string) {
  return value ? value.slice(0, 16) : ''
}

export function ExamSettingsView({
  exam,
  specification,
  templateManagement
}: ExamSettingsViewProps) {
  const router = useRouter()
  const { callApi, isLoading } = useApi()
  const [isHidingLineage, setIsHidingLineage] = useState(false)
  const [pendingTemplateId, setPendingTemplateId] = useState<number | null>(
    null
  )

  const versions = templateManagement?.versions ?? []
  const canManage = templateManagement?.canManage ?? false
  const visibleVersions = versions.filter((version) => version.isVisible)

  async function handleSubmit(data: ExamSettingsFormValues) {
    const result = await callApi(
      updateTeacherExamSettings(exam.id, {
        title: data.title,
        durationMinutes: data.durationMinutes,
        startTime: data.startTime || undefined,
        endTime: data.endTime || undefined,
        description: data.description,
        maxAttempts: data.maxAttempts,
        lateThreshold: data.lateThreshold,
        settings: data.settings,
        isPublished: data.isPublished
      })
    )

    if (result.data) {
      router.refresh()
    }
  }

  async function handleHideLineage() {
    setIsHidingLineage(true)
    try {
      await hideExamTemplateLineage(exam.id)
      toast.success('Đã ẩn đề thi khỏi thư viện')
      router.refresh()
    } catch {
      toast.error('Ẩn đề thi khỏi thư viện thất bại')
    } finally {
      setIsHidingLineage(false)
    }
  }

  async function handleUpdateVisibility(
    templateId: number,
    isVisible: boolean
  ) {
    setPendingTemplateId(templateId)
    try {
      await updateExamTemplateVisibility(templateId, { isVisible })
      toast.success(
        isVisible
          ? 'Đã hiển thị lại phiên bản trong thư viện'
          : 'Đã ẩn phiên bản khỏi thư viện'
      )
      router.refresh()
    } catch {
      toast.error(
        isVisible ? 'Hiện lại phiên bản thất bại' : 'Ẩn phiên bản thất bại'
      )
    } finally {
      setPendingTemplateId(null)
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 border-b border-border pb-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Quản lý thư viện đề thi
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Quản lý các phiên bản đề thi đã public lên thư viện từ bài thi
              này.
            </p>
          </div>

          {canManage && visibleVersions.length > 0 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="gap-2 text-destructive hover:text-destructive"
                onClick={handleHideLineage}
                disabled={isHidingLineage}
              >
                {isHidingLineage ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <EyeOff className="h-4 w-4" />
                )}
                Ẩn khỏi thư viện
              </Button>
            </div>
          )}
        </div>

        {versions.length === 0 ? (
          <div className="py-8 text-sm text-muted-foreground">
            Bài thi này chưa được chia sẻ lên thư viện.
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {versions.map((version) => (
              <div
                key={version.templateId}
                className="flex flex-col gap-3 rounded-lg border border-border p-4 md:flex-row md:items-center md:justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                      v{version.version}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        version.isVisible
                          ? 'bg-emerald-500/10 text-emerald-600'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {version.isVisible ? 'Đang hiển thị' : 'Đã ẩn'}
                    </span>
                    <span className="text-sm font-medium text-foreground">
                      {version.title}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {version.sharedByName} ·{' '}
                    {new Date(version.createdAt).toLocaleString('vi-VN')} ·{' '}
                    {version.questionCount} câu hỏi
                  </p>
                  {version.description && (
                    <p className="text-sm text-muted-foreground">
                      {version.description}
                    </p>
                  )}
                </div>

                {canManage && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 self-start md:self-center"
                    disabled={pendingTemplateId === version.templateId}
                    onClick={() =>
                      handleUpdateVisibility(
                        version.templateId,
                        !version.isVisible
                      )
                    }
                  >
                    {pendingTemplateId === version.templateId ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : version.isVisible ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                    {version.isVisible ? 'Ẩn phiên bản' : 'Hiện lại'}
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <ExamSettingsForm
        mode="edit"
        formId="update-exam-settings-form"
        pageTitle="Cài đặt bài thi"
        pageDescription="Chỉnh sửa thông tin và cấu hình vận hành cho bài thi hiện tại"
        submitLabel="Lưu thay đổi"
        backHref={PATH.TEACHER_CLASS_DETAIL(exam.classId)}
        specificationPreview={specification}
        initialValues={{
          title: exam.title,
          specificationId: exam.specificationId,
          durationMinutes: exam.durationMinutes,
          startTime: toDatetimeLocal(exam.startTime),
          endTime: toDatetimeLocal(exam.endTime),
          description: exam.description ?? '',
          isPublished: exam.isPublished,
          maxAttempts: exam.maxAttempts ?? 1,
          lateThreshold: exam.lateThreshold ?? 0,
          settings: {
            preventCopyPaste: exam.settings?.preventCopyPaste ?? true,
            forceFullscreen: exam.settings?.forceFullscreen ?? true,
            trackTabSwitch: exam.settings?.trackTabSwitch ?? true,
            autoSubmitOnViolation:
              exam.settings?.autoSubmitOnViolation ?? false,
            allowReview: exam.settings?.allowReview ?? true,
            scoreDisplayMode: exam.settings?.scoreDisplayMode ?? 'after_closed',
            allowOvertime: exam.settings?.allowOvertime ?? false,
            gradingMethod: exam.settings?.gradingMethod ?? 'highest_score'
          }
        }}
        isSubmitting={isLoading}
        onSubmit={handleSubmit}
        headerActions={
          <>
            <Link href={PATH.TEACHER_EXAM_SPECIFICATION(exam.id)}>
              <Button variant="outline" className="gap-2">
                <Database className="h-4 w-4" />
                Đặc tả
              </Button>
            </Link>
            <Link href={PATH.TEACHER_EXAM_QUESTIONS(exam.id)}>
              <Button variant="outline" className="gap-2">
                <FileText className="h-4 w-4" />
                Câu hỏi
              </Button>
            </Link>
          </>
        }
      />
    </div>
  )
}
