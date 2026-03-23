import Link from 'next/link'
import {
  Database,
  FileText,
  PencilLine,
  Settings,
  ShieldAlert
} from 'lucide-react'

import { ExamQuestionsView } from '@/app/(main)/teacher/exams/[examId]/questions/components/exam-questions-view'
import { Button } from '@/components/ui/button'
import { PATH } from '@/lib/constants'
import { ExamQuestionItem, TeacherExamDetail } from '@/lib/types'
import { formatDateTime, getExamStatus } from '@/lib/utils'

type TeacherExamDetailContentProps = {
  exam: TeacherExamDetail
  classLabel: string
  questionCount: number
  hasSpecification: boolean
  specificationLabel: string
  questions: ExamQuestionItem[]
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
      className: 'bg-amber-500/10 text-amber-600 border-amber-500/20'
    }
  }

  if (status === 'in_progress') {
    return {
      label: 'Đang diễn ra',
      className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
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
  questions
}: TeacherExamDetailContentProps) {
  const statusMeta = getStatusMeta(
    getExamStatus(exam.startTime, exam.endTime),
    Boolean(exam.isPublished)
  )

  return (
    <div className="space-y-8">
      <div className="rounded-xl pt-1 pb-6 mb-1">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {exam.title}
            </h1>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link href={PATH.TEACHER_EDIT_EXAM(exam.id)}>
              <Button className="gap-2">
                <PencilLine className="h-4 w-4" />
                Chỉnh sửa bài thi
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-6 lg:col-span-2">
          <div className="mb-5 flex items-center gap-2 border-b border-border pb-4">
            <FileText className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              Thông tin chung
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Nhận diện bài thi
              </p>
              <dl className="mt-3 space-y-3">
                <div>
                  <dt className="text-sm text-muted-foreground">
                    Tiêu đề bài thi
                  </dt>
                  <dd className="text-lg font-semibold leading-snug text-foreground">
                    {exam.title}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Đặc tả CSDL</dt>
                  <dd className="text-base font-semibold text-foreground">
                    {specificationLabel}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="rounded-lg p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Khung thời gian
              </p>
              <dl className="mt-3 space-y-3">
                <div>
                  <dt className="text-sm text-muted-foreground">
                    Thời gian bắt đầu
                  </dt>
                  <dd className="text-base font-semibold text-foreground">
                    {formatDateTime(exam.startTime)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">
                    Thời gian kết thúc
                  </dt>
                  <dd className="text-base font-semibold text-foreground">
                    {formatDateTime(exam.endTime)}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="rounded-lg p-4 sm:col-span-2">
              <dl className="grid gap-4 sm:grid-cols-3">
                <div>
                  <dt className="text-sm text-muted-foreground">Thời lượng</dt>
                  <dd className="mt-1 text-xl font-semibold text-foreground">
                    {exam.durationMinutes} phút
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Số câu hỏi</dt>
                  <dd className="mt-1 text-xl font-semibold text-foreground">
                    {questionCount}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">
                    Trạng thái hiện tại
                  </dt>
                  <dd className="mt-1">
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${statusMeta.className}`}
                    >
                      {statusMeta.label}
                    </span>
                  </dd>
                </div>
              </dl>
            </div>

            <div className="rounded-lg p-4 sm:col-span-2">
              <dt className="text-sm text-muted-foreground">
                Mô tả và nội quy
              </dt>
              <dd className="mt-2 text-base leading-relaxed text-foreground">
                {exam.description || 'Chưa có mô tả và nội quy.'}
              </dd>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-3 flex items-center gap-2 border-b border-border pb-3">
              <Database className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">
                Quy định nộp bài & điểm số
              </h2>
            </div>
            <dl className="space-y-2 text-sm">
              <div className="flex items-center justify-between gap-2">
                <dt className="text-muted-foreground">Xuất bản ngay</dt>
                <dd className="font-medium text-foreground">
                  {yesNo(exam.isPublished)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-muted-foreground">Số lần làm tối đa</dt>
                <dd className="font-medium text-foreground">
                  {exam.maxAttempts}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-muted-foreground">Ngưỡng nộp trễ</dt>
                <dd className="font-medium text-foreground">
                  {exam.lateThreshold} phút
                </dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-muted-foreground">Phương thức tính điểm</dt>
                <dd className="font-medium text-foreground">
                  {mapGradingMethod(exam.settings?.gradingMethod)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-muted-foreground">Hiển thị điểm</dt>
                <dd className="font-medium text-foreground">
                  {mapScoreDisplayMode(exam.settings?.scoreDisplayMode)}
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-3 flex items-center gap-2 border-b border-border pb-3">
              <ShieldAlert className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">
                Cài đặt chống gian lận
              </h2>
            </div>
            <dl className="space-y-2 text-sm">
              <div className="flex items-center justify-between gap-2">
                <dt className="text-muted-foreground">Chống Copy/Paste</dt>
                <dd className="font-medium text-foreground">
                  {yesNo(exam.settings?.preventCopyPaste)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-muted-foreground">
                  Bắt buộc toàn màn hình
                </dt>
                <dd className="font-medium text-foreground">
                  {yesNo(exam.settings?.forceFullscreen)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-muted-foreground">Giám sát chuyển tab</dt>
                <dd className="font-medium text-foreground">
                  {yesNo(exam.settings?.trackTabSwitch)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-muted-foreground">
                  Tự động nộp khi vi phạm
                </dt>
                <dd className="font-medium text-foreground">
                  {yesNo(exam.settings?.autoSubmitOnViolation)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-muted-foreground">Cho phép xem lại bài</dt>
                <dd className="font-medium text-foreground">
                  {yesNo(exam.settings?.allowReview)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-muted-foreground">Cho phép nộp trễ</dt>
                <dd className="font-medium text-foreground">
                  {yesNo(exam.settings?.allowOvertime)}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-xl font-semibold text-foreground">
            <Settings className="h-5 w-5 text-primary" />
            Câu hỏi bài thi
          </h2>
          {!hasSpecification && (
            <Link href={PATH.TEACHER_EXAM_SPECIFICATION(exam.id)}>
              <Button variant="outline" className="gap-2">
                <Database className="h-4 w-4" />
                Tạo đặc tả trước
              </Button>
            </Link>
          )}
        </div>

        <ExamQuestionsView examId={exam.id} initialQuestions={questions} />
      </div>
    </div>
  )
}
