'use client'

import {
  Activity,
  ArrowUpRight,
  Clock,
  Database,
  FileText,
  Info,
  ShieldAlert
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

import { EditExamModalButton } from './edit-exam-modal-button'
import { ExamQuestionsView } from '../questions/components/exam-questions-view'
import { Button } from '@/components/ui/button'
import { PATH } from '@/lib/constants'
import {
  ExamQuestionItem,
  SpecificationDetailResponse,
  TeacherExamDetail,
  TeacherExamTemplateVersionsResponse
} from '@/lib/types'
import { formatDateTime, getExamStatus } from '@/lib/utils'

type TeacherExamDetailContentProps = {
  exam: TeacherExamDetail
  classLabel: string
  questionCount: number
  hasSpecification: boolean
  specification: SpecificationDetailResponse | null
  questions: ExamQuestionItem[]
  templateManagement: TeacherExamTemplateVersionsResponse | null
  canShareTemplate: boolean
  shareDisabledReason?: string
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

function OverviewItem({
  label,
  value,
  icon,
  rightIcon
}: {
  label: string
  value: React.ReactNode
  icon?: React.ReactNode
  rightIcon?: React.ReactNode
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground sm:text-base">
        {icon}
        <span>{value}</span>
        {rightIcon}
      </div>
    </div>
  )
}

function SettingRow({
  label,
  value
}: {
  label: string
  value: string | number
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/60 py-2 last:border-0 last:pb-0">
      <dt className="text-[13px] text-muted-foreground">{label}</dt>
      <dd className="text-right text-[13px] font-medium text-foreground">
        {value}
      </dd>
    </div>
  )
}

export function TeacherExamDetailContent({
  exam,
  questionCount,
  specification,
  questions,
  templateManagement,
  canShareTemplate,
  shareDisabledReason
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
    <div className="space-y-6">
      <section className="rounded-lg border bg-sub-primary p-5 md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <h1 className="text-3xl font-bold leading-tight text-primary-container md:text-4xl">
              {displayExam.title}
            </h1>
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${statusMeta.className}`}
            >
              {statusMeta.label}
            </span>
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
      </section>

      <section className="space-y-5 rounded-lg border bg-card p-5 md:p-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-title">
            Tổng quan bài thi
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Theo dõi nhanh các thông tin quan trọng và cấu hình hiện tại của bài
            thi.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <OverviewItem
            label="Bắt đầu"
            value={formatDateTime(displayExam.startTime)}
          />
          <OverviewItem
            label="Kết thúc"
            value={formatDateTime(displayExam.endTime)}
          />
          <OverviewItem
            label="Thời lượng"
            icon={<Clock className="h-4 w-4 text-primary/70" />}
            value={`${displayExam.durationMinutes} phút`}
          />
          <OverviewItem
            label="Số câu hỏi"
            icon={<FileText className="h-4 w-4 text-primary/70" />}
            value={`${questionCount} câu`}
          />
          {specification && (
            <OverviewItem
              label="Đặc tả CSDL"
              icon={<Database className="h-4 w-4 text-primary/70" />}
              value={`${specification?.name} (#${specification?.id})`}
              rightIcon={
                <Link href={PATH.TEACHER_SPECIFICATION_EDIT(specification.id)}>
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              }
            />
          )}
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <section className="space-y-3 rounded-lg border bg-background p-4 lg:col-span-2">
            <div className="flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              <h3 className="text-base font-semibold text-foreground">
                Mô tả và nội quy
              </h3>
            </div>
            {displayExam.description ? (
              <div className="rounded-md bg-muted/30 p-4 text-sm italic text-muted-foreground whitespace-pre-wrap">
                {displayExam.description}
              </div>
            ) : (
              <div className="rounded-md bg-muted p-4 text-sm italic text-muted-foreground">
                Chưa có mô tả và nội quy.
              </div>
            )}
          </section>

          <div className="space-y-4">
            <section className="rounded-lg border bg-background">
              <div className="flex items-center gap-2.5 border-b border-border px-4 py-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-500/10">
                  <Database className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">
                  Quy định nộp bài
                </h3>
              </div>
              <dl className="px-4 pb-3 pt-2 text-sm">
                <SettingRow
                  label="Xuất bản ngay"
                  value={yesNo(displayExam.isPublished)}
                />
                <SettingRow
                  label="Làm tối đa"
                  value={displayExam.maxAttempts}
                />
                <SettingRow
                  label="Ngưỡng nộp trễ"
                  value={`${displayExam.lateThreshold} phút`}
                />
                <SettingRow
                  label="Tính điểm"
                  value={mapGradingMethod(displayExam.settings?.gradingMethod)}
                />
                <SettingRow
                  label="Hiện điểm"
                  value={mapScoreDisplayMode(
                    displayExam.settings?.scoreDisplayMode
                  )}
                />
              </dl>
            </section>

            <section className="rounded-lg border bg-background">
              <div className="flex items-center gap-2.5 border-b border-border px-4 py-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-rose-500/10">
                  <ShieldAlert className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">
                  Cài đặt chống gian lận
                </h3>
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
                      {displayExam.settings?.autoSubmitOnViolation &&
                        ` (Tối đa ${displayExam.settings?.maxViolations ?? 3} lần)`}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3 border-b border-border/50 pb-2.5 last:border-0 last:pb-0">
                    <dt className="text-muted-foreground text-[13px]">
                      Xem lại sau nộp
                    </dt>
                    <dd className="font-medium text-foreground text-right text-[13px]">
                      {yesNo(displayExam.settings?.allowReview)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3 border-b border-border/50 pb-2.5 last:border-0 last:pb-0">
                    <dt className="text-muted-foreground text-[13px]">
                      Xem kết quả ngay
                    </dt>
                    <dd className="font-medium text-foreground text-right text-[13px]">
                      {yesNo(displayExam.settings?.showResultAfterSubmit)}
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
            </section>
          </div>
        </div>
        <ExamQuestionsView
          examId={exam.id}
          initialQuestions={questions}
          templateManagement={templateManagement}
          canShareTemplate={canShareTemplate}
          shareDisabledReason={shareDisabledReason}
        />
      </section>
    </div>
  )
}
