'use client'

import {
  Activity,
  Clock,
  Database,
  Edit,
  FileText,
  Info,
  ShieldAlert
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

import { EditExamModalButton } from '@/app/(main)/teacher/exams/[examId]/components/edit-exam-modal-button'
import { ExamQuestionsView } from '@/app/(main)/teacher/exams/[examId]/questions/components/exam-questions-view'
import { ExamSpecificationView } from '@/components/shared/exam-specification-view'
import { Button } from '@/components/ui/button'
import { PATH } from '@/lib/constants'
import {
  ExamQuestionItem,
  ExamSpecification,
  TeacherExamDetail
} from '@/lib/types'
import { formatDateTime, getExamStatus } from '@/lib/utils'

type TeacherExamDetailContentProps = {
  exam: TeacherExamDetail
  classLabel: string
  questionCount: number
  hasSpecification: boolean
  specificationLabel: string
  questions: ExamQuestionItem[]
  specification?: ExamSpecification
}

function getStatusMeta(
  status: ReturnType<typeof getExamStatus>,
  isPublished: boolean
) {
  if (!isPublished) {
    return {
      label: 'Bản nháp',
      className:
        'bg-muted-foreground/10 text-muted-foreground border-muted-foreground/20'
    }
  }

  if (status === 'upcoming') {
    return {
      label: 'Sắp diễn ra',
      className: 'bg-amber-100 text-amber-700 border-amber-300'
    }
  }

  if (status === 'in_progress') {
    return {
      label: 'Đang diễn ra',
      className: 'bg-emerald-100 text-emerald-700 border-emerald-300'
    }
  }

  return {
    label: 'Đã kết thúc',
    className:
      'bg-muted-foreground/10 text-muted-foreground border-muted-foreground/20'
  }
}

function mapScoreDisplayMode(value?: string) {
  if (value === 'immediately') return 'Ngay sau khi nộp'
  if (value === 'after_closed') return 'Sau khi bài thi đóng'
  if (value === 'never') return 'Không hiển thị'
  return '-'
}

function mapGradingMethod(value?: string) {
  if (value === 'highest_score') return 'Lấy điểm cao nhất'
  if (value === 'latest_score') return 'Lấy điểm lần cuối'
  if (value === 'average_score') return 'Điểm trung bình'
  return '-'
}

function yesNo(value?: boolean) {
  return value ? 'Có' : 'Không'
}

export function TeacherExamDetailContent({
  exam,
  questionCount,
  hasSpecification,
  specificationLabel,
  questions,
  specification
}: TeacherExamDetailContentProps) {
  const [displayExam, setDisplayExam] = useState(exam)

  useEffect(() => {
    setDisplayExam(exam)
  }, [exam])

  const statusMeta = getStatusMeta(
    getExamStatus(displayExam.startTime, displayExam.endTime),
    Boolean(displayExam.isPublished)
  )

  return (
    <div className="space-y-8">
      <div className="p-6 mb-0 bg-primary-container">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-sub-primary headline-font leading-tight">
              {displayExam.title}
            </h1>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link href={PATH.TEACHER_EXAM_MONITOR(exam.id)}>
              <Button variant="outline" className="gap-2">
                <Activity className="h-4 w-4" />
                Giám sát thi
              </Button>
            </Link>
            <EditExamModalButton exam={displayExam} onSaved={setDisplayExam} />
          </div>
        </div>
      </div>
      <div className="rounded-xs bg-card p-6">
        <div className="grid gap-4 lg:grid-cols-3 mb-4">
          <section className="bg-card rounded-xs p-6 lg:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <Info className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-bold text-foreground tracking-tight">
                Thông tin chung
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-y-8 gap-x-12">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Bắt đầu
                </p>
                <p className="text-foreground font-semibold text-lg">
                  {formatDateTime(displayExam.startTime)}
                </p>
              </div>

              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Kết thúc
                </p>
                <p className="text-foreground font-semibold text-lg">
                  {formatDateTime(displayExam.endTime)}
                </p>
              </div>

              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Thời lượng
                </p>
                <p className="text-foreground font-semibold text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary/60" />
                  {displayExam.durationMinutes} phút
                </p>
              </div>

              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Số câu hỏi
                </p>
                <p className="text-foreground font-semibold text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary/60" />
                  {questionCount} câu
                </p>
              </div>

              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Trạng thái
                </p>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusMeta.className}`}
                  >
                    {statusMeta.label}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-blue-900 mb-1">
                  Đặc tả CSDL
                </p>
                <p className="text-foreground font-semibold text-lg flex items-center gap-2">
                  <Database className="h-5 w-5 text-primary/60" />
                  {specificationLabel}
                </p>
              </div>
            </div>

            <div className="mt-8 pt-8 border-slate-100">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-3">
                Mô tả và nội quy
              </p>
              {displayExam.description ? (
                <div className="bg-muted/30 rounded-lg p-4 italic text-muted-foreground text-sm whitespace-pre-wrap">
                  {displayExam.description}
                </div>
              ) : (
                <div className="bg-muted rounded-xs p-4 italic text-slate-500 text-sm">
                  Chưa có mô tả và nội quy.
                </div>
              )}
            </div>
          </section>

          <div className="space-y-4 border-l border-border pl-4">
            <div className="rounded-lg bg-card overflow-hidden p-4">
              <div className="flex items-center gap-2.5 border-b border-border bg-muted/20 px-4 py-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-500/10">
                  <Database className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-sm font-semibold text-foreground">
                  Quy định nộp bài
                </h2>
              </div>
              <div className="p-4">
                <dl className="space-y-3 text-sm">
                  <div className="flex items-center justify-between gap-3 border-b border-border/50 pb-2.5 last:border-0 last:pb-0">
                    <dt className="text-muted-foreground text-[13px]">
                      Xuất bản ngay
                    </dt>
                    <dd className="font-medium text-foreground text-right text-[13px]">
                      {yesNo(displayExam.isPublished)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3 border-b border-border/50 pb-2.5 last:border-0 last:pb-0">
                    <dt className="text-muted-foreground text-[13px]">
                      Làm tối đa
                    </dt>
                    <dd className="font-medium text-foreground text-right text-[13px]">
                      {displayExam.maxAttempts}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3 border-b border-border/50 pb-2.5 last:border-0 last:pb-0">
                    <dt className="text-muted-foreground text-[13px]">
                      Ngưỡng nộp trễ
                    </dt>
                    <dd className="font-medium text-foreground text-right text-[13px]">
                      {displayExam.lateThreshold} phút
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3 border-b border-border/50 pb-2.5 last:border-0 last:pb-0">
                    <dt className="text-muted-foreground text-[13px]">
                      Tính điểm
                    </dt>
                    <dd className="font-medium text-foreground text-right text-[13px] truncate pl-2">
                      {mapGradingMethod(displayExam.settings?.gradingMethod)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3 border-b border-border/50 pb-2.5 last:border-0 last:pb-0">
                    <dt className="text-muted-foreground text-[13px]">
                      Hiện điểm
                    </dt>
                    <dd className="font-medium text-foreground text-right text-[13px] truncate pl-2">
                      {mapScoreDisplayMode(
                        displayExam.settings?.scoreDisplayMode
                      )}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            <div className="rounded-lg overflow-hidden p-4">
              <div className="flex items-center gap-2.5 border-b border-border bg-muted/20 px-4 py-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-rose-500/10">
                  <ShieldAlert className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                </div>
                <h2 className="text-sm font-semibold text-foreground">
                  Cài đặt chống gian lận
                </h2>
              </div>
              <div className="p-4">
                <dl className="space-y-3 text-sm">
                  <div className="flex items-center justify-between gap-3 border-b border-border/50 pb-2.5 last:border-0 last:pb-0">
                    <dt className="text-muted-foreground text-[13px]">
                      Chống Copy
                    </dt>
                    <dd className="font-medium text-foreground text-right text-[13px]">
                      {yesNo(displayExam.settings?.preventCopyPaste)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3 border-b border-border/50 pb-2.5 last:border-0 last:pb-0">
                    <dt className="text-muted-foreground text-[13px]">
                      Toàn màn hình
                    </dt>
                    <dd className="font-medium text-foreground text-right text-[13px]">
                      {yesNo(displayExam.settings?.forceFullscreen)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3 border-b border-border/50 pb-2.5 last:border-0 last:pb-0">
                    <dt className="text-muted-foreground text-[13px]">
                      Đổi tab
                    </dt>
                    <dd className="font-medium text-foreground text-right text-[13px]">
                      {yesNo(displayExam.settings?.trackTabSwitch)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3 border-b border-border/50 pb-2.5 last:border-0 last:pb-0">
                    <dt className="text-muted-foreground text-[13px]">
                      Nộp khi vi phạm
                    </dt>
                    <dd className="font-medium text-foreground text-right text-[13px]">
                      {yesNo(displayExam.settings?.autoSubmitOnViolation)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3 border-b border-border/50 pb-2.5 last:border-0 last:pb-0">
                    <dt className="text-muted-foreground text-[13px]">
                      Xem lại
                    </dt>
                    <dd className="font-medium text-foreground text-right text-[13px]">
                      {yesNo(displayExam.settings?.allowReview)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3 border-b border-border/50 pb-2.5 last:border-0 last:pb-0">
                    <dt className="text-muted-foreground text-[13px]">
                      Được nộp trễ
                    </dt>
                    <dd className="font-medium text-foreground text-right text-[13px]">
                      {yesNo(displayExam.settings?.allowOvertime)}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </div>
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-2xl tracking-tight font-bold text-title">
            Đặc tả đề thi
          </h2>
          {!hasSpecification ? (
            <Link href={PATH.TEACHER_EXAM_SPECIFICATION(exam.id)}>
              <Button variant="outline" className="gap-2">
                <Database className="h-4 w-4" />
                Tạo đặc tả trước
              </Button>
            </Link>
          ) : (
            <Link href={PATH.TEACHER_SPECIFICATION_EDIT(exam.specificationId)}>
              <Button variant="outline" className="gap-2">
                <Edit className="h-4 w-4" />
                Chỉnh sửa đặc tả
              </Button>
            </Link>
          )}
        </div>

        {specification && (
          <div className="mb-6">
            <ExamSpecificationView specification={specification} />
          </div>
        )}

        <ExamQuestionsView examId={exam.id} initialQuestions={questions} />
      </div>
    </div>
  )
}
