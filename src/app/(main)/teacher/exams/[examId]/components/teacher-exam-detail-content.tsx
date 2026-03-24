'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Database, Edit, FileText, ShieldAlert } from 'lucide-react'

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
      <div className="rounded-xl pt-1 pb-6 mb-1">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {displayExam.title}
            </h1>
          </div>

          <div className="flex flex-wrap gap-2">
            <EditExamModalButton exam={displayExam} onSaved={setDisplayExam} />
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card shadow-sm lg:col-span-2 flex flex-col overflow-hidden">
          <div className="flex items-center gap-3 border-b border-border px-5 py-4 bg-muted/20">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Thông tin chung
            </h2>
          </div>

          <div className="flex-1 p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-3">
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Nhận diện bài thi
                </h3>
                <div className="grid gap-3 rounded-xl border border-border bg-muted/20 p-3.5">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Tiêu đề bài thi
                    </p>
                    <p className="text-sm font-medium leading-snug text-foreground">
                      {displayExam.title}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Đặc tả CSDL
                    </p>
                    <p className="text-sm font-medium text-foreground">
                      {specificationLabel}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Khung thời gian
                </h3>
                <div className="grid gap-3 rounded-xl border border-border bg-muted/20 p-3.5">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Thời gian bắt đầu
                    </p>
                    <p className="text-sm font-medium text-foreground">
                      {formatDateTime(displayExam.startTime)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Thời gian kết thúc
                    </p>
                    <p className="text-sm font-medium text-foreground">
                      {formatDateTime(displayExam.endTime)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="sm:col-span-2 grid gap-3 grid-cols-3">
                <div className="rounded-xl border border-border bg-card p-3 flex flex-col items-center justify-center text-center">
                  <span className="text-xs text-muted-foreground mb-1">
                    Thời lượng
                  </span>
                  <span className="text-xl font-bold text-foreground">
                    {displayExam.durationMinutes}{' '}
                    <span className="text-[11px] font-normal text-muted-foreground">
                      phút
                    </span>
                  </span>
                </div>
                <div className="rounded-xl border border-border bg-card p-3 flex flex-col items-center justify-center text-center">
                  <span className="text-xs text-muted-foreground mb-1">
                    Số câu hỏi
                  </span>
                  <span className="text-xl font-bold text-foreground">
                    {questionCount}
                  </span>
                </div>
                <div className="rounded-xl border border-border bg-card p-3 flex flex-col items-center justify-center text-center">
                  <span className="text-xs text-muted-foreground mb-1.5">
                    Trạng thái
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${statusMeta.className}`}
                  >
                    {statusMeta.label}
                  </span>
                </div>
              </div>

              {displayExam.description ? (
                <div className="sm:col-span-2 space-y-2 pt-1">
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Mô tả và nội quy
                  </h3>
                  <div className="rounded-xl border border-border bg-muted/10 p-3.5">
                    <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                      {displayExam.description}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="sm:col-span-2 space-y-2 pt-1">
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Mô tả và nội quy
                  </h3>
                  <div className="rounded-xl border border-dashed border-border p-3 flex items-center justify-center bg-transparent">
                    <span className="text-[13px] text-muted-foreground italic">
                      Chưa có mô tả và nội quy.
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
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

          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
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
                  <dt className="text-muted-foreground text-[13px]">Đổi tab</dt>
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
                  <dt className="text-muted-foreground text-[13px]">Xem lại</dt>
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

      <div className="rounded-xl border border-border bg-card p-6">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-2xl tracking-tight font-bold text-foreground">
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
