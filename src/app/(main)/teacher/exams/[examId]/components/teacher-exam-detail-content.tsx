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
import { useEffect, useMemo, useState } from 'react'

import { StudentCommonPartView } from '@/components/shared/student-common-part-view'
import { EditExamModalButton } from './edit-exam-modal-button'
import { ExamQuestionsView } from '../questions/components/exam-questions-view'
import { Button } from '@/components/ui/button'
import { PATH } from '@/lib/constants'
import {
  ExamQuestionItem,
  ExamSpecification,
  TeacherExamDetail,
  TeacherExamTemplateVersionsResponse
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
  templateManagement: TeacherExamTemplateVersionsResponse | null
  canShareTemplate: boolean
  shareDisabledReason?: string
}

type StudentCommonPartBlocks = Parameters<
  typeof StudentCommonPartView
>[0]['blocks']

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
  specificationLabel,
  questions,
  specification,
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

  const commonPartBlocks = useMemo<StudentCommonPartBlocks>(() => {
    const blocks: StudentCommonPartBlocks = []

    if (specification?.description?.trim()) {
      blocks.push({
        id: 'common-description',
        kind: 'rich-text',
        title: 'Mô tả chung',
        data: { content: specification.description }
      })
    }

    if ((specification?.entities ?? []).length > 0) {
      blocks.push({
        id: 'common-table-description',
        kind: 'table-description',
        title: 'Mô tả bảng dữ liệu',
        data: { entities: specification?.entities ?? [] }
      })
    }

    if (
      specification?.ddlScript?.trim() &&
      specification.ddlVisibleToStudent === true
    ) {
      blocks.push({
        id: 'common-ddl',
        kind: 'sql-ddl',
        title: 'Mã SQL DDL',
        data: { sql: specification.ddlScript }
      })
    }

    ;(specification?.datasets ?? [])
      .filter(
        (dataset) => dataset.visibleToStudent === true && dataset.dataScript
      )
      .forEach((dataset, index) => {
        blocks.push({
          id: `common-dml-${index + 1}`,
          kind: 'sql-dml',
          title: dataset.name?.trim() || `Dữ liệu mẫu ${index + 1}`,
          data: { sql: dataset.dataScript }
        })
      })

    if (
      specification?.schemaDiagram?.trim() &&
      specification.schemaDiagramVisibleToStudent === true
    ) {
      blocks.push({
        id: 'common-schema-diagram',
        kind: 'schema-diagram',
        title: 'Lược đồ cơ sở dữ liệu',
        data: { diagramData: specification.schemaDiagram }
      })
    }

    return blocks
  }, [specification])

  const hiddenCommonPartBlocks = useMemo<StudentCommonPartBlocks>(() => {
    const blocks: StudentCommonPartBlocks = []

    if (
      specification?.ddlScript?.trim() &&
      specification.ddlVisibleToStudent !== true
    ) {
      blocks.push({
        id: 'hidden-common-ddl',
        kind: 'sql-ddl',
        title: 'Mã SQL DDL',
        data: { sql: specification.ddlScript }
      })
    }

    ;(specification?.datasets ?? [])
      .filter(
        (dataset) => dataset.visibleToStudent !== true && dataset.dataScript
      )
      .forEach((dataset, index) => {
        blocks.push({
          id: `hidden-common-dml-${index + 1}`,
          kind: 'sql-dml',
          title:
            dataset.name?.trim() || `Dữ liệu nội bộ giáo viên ${index + 1}`,
          data: { sql: dataset.dataScript }
        })
      })

    if (
      specification?.schemaDiagram?.trim() &&
      specification.schemaDiagramVisibleToStudent !== true
    ) {
      blocks.push({
        id: 'hidden-schema-diagram',
        kind: 'schema-diagram',
        title: 'Lược đồ cơ sở dữ liệu',
        data: { diagramData: specification.schemaDiagram }
      })
    }

    return blocks
  }, [specification])

  return (
    <div className="space-y-8">
      <div className="p-6 mb-0 bg-sub-primary">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-primary-container headline-font leading-tight">
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
        <div className="border-l-4 border-primary/60 pl-3 mb-4">
          <div className="flex items-center gap-2">
            <h1 className="flex items-center gap-2 text-2xl tracking-tight font-bold text-title">
              Tổng quan về bài thi
            </h1>
          </div>
          <div className="mb-8">
            <p className="text-sm text-muted-foreground">
              Xem lại thông tin chung, mô tả và nội quy của bài thi. Bạn có thể
              chỉnh sửa thông tin và nội quy của bài thi bằng cách nhấn nút
              "Chỉnh sửa" ở góc trên bên phải.
            </p>
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-3 mb-4">
          <div className="lg:col-span-2">
            <section className="bg-card rounded-xs p-6">
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
          </div>

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
            </div>
          </div>
        </div>

        <section className="mb-6 rounded-xs bg-card">
          <div className="mb-4 pb-4 flex items-center justify-between gap-3 border-l-4 border-primary/60 pl-3">
            <div>
              <h1 className="flex items-center gap-2 text-2xl tracking-tight font-bold text-title">
                Phần yêu cầu chung
              </h1>
              <p className="text-sm text-muted-foreground">
                Nội dung chung mà sinh viên xem trong suốt quá trình làm bài
                thi.
              </p>
            </div>
            <Link href={PATH.TEACHER_EXAM_COMMON_PART(exam.id)}>
              <Button variant="outline" className="gap-2">
                <Edit className="h-4 w-4" />
                Chỉnh sửa phần yêu cầu chung
              </Button>
            </Link>
          </div>
          <StudentCommonPartView
            blocks={commonPartBlocks}
            embedded
            hideHeader
          />
        </section>

        <section className="mb-6 rounded-xs bg-card">
          <div className="border-l-4 border-primary/60 pl-3">
            <div>
              <h1 className="flex items-center gap-2 text-2xl tracking-tight font-bold text-title">
                Đặc tả nội bộ giáo viên
              </h1>
            </div>
            <p className="mb-6 text-sm text-muted-foreground">
              Nội dung dưới đây chỉ dành cho giáo viên và sẽ không hiển thị với
              sinh viên.
            </p>
          </div>

          {hiddenCommonPartBlocks.length > 0 ? (
            <StudentCommonPartView
              blocks={hiddenCommonPartBlocks}
              embedded
              hideHeader
            />
          ) : (
            <div className="rounded-md border border-dashed border-border bg-muted/30 px-4 py-6 text-sm text-muted-foreground">
              Hiện chưa có nội dung nội bộ giáo viên trong phần yêu cầu chung.
            </div>
          )}
        </section>

        <ExamQuestionsView
          examId={exam.id}
          initialQuestions={questions}
          templateManagement={templateManagement}
          canShareTemplate={canShareTemplate}
          shareDisabledReason={shareDisabledReason}
        />
      </div>
    </div>
  )
}
