'use client'

import {
  Activity,
  ArrowUpRight,
  Clock,
  Database,
  FileText,
  Info,
  Loader2,
  Share2,
  ShieldAlert,
  Users
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { EditExamSectionModal } from './edit-exam-section-modal'
import { ExamQuestionsView } from '../questions/components/exam-questions-view'
import { TemplateLibraryManagement } from './template-library-management'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PATH } from '@/lib/constants'
import {
  ExamQuestionItem,
  SpecificationDetailResponse,
  TeacherExamDetail,
  TeacherExamTemplateVersionsResponse
} from '@/lib/types'
import { getSpecificationDetail, shareExamAsTemplate } from '@/lib/actions'
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
  const [displaySpecification, setDisplaySpecification] =
    useState<SpecificationDetailResponse | null>(specification)
  const [isSharingTemplate, setIsSharingTemplate] = useState(false)
  const [activeTab, setActiveTab] = useState<
    'overview' | 'questions' | 'library'
  >('overview')
  const router = useRouter()

  const templateVersions = templateManagement?.versions ?? []
  const canManageTemplate = templateManagement?.canManage ?? false

  const handleTabChange = (value: string) => {
    if (value === 'overview' || value === 'questions' || value === 'library') {
      setActiveTab(value)
    }
  }

  useEffect(() => {
    setDisplayExam(exam)
  }, [exam])

  useEffect(() => {
    setDisplaySpecification(specification)
  }, [specification])

  const handleExamSaved = (updated: TeacherExamDetail) => {
    setDisplayExam(updated)
    if (updated.specificationId != null && updated.specificationId > 0) {
      void getSpecificationDetail(updated.specificationId).then((res) => {
        if (res.data) setDisplaySpecification(res.data)
      })
    } else {
      setDisplaySpecification(null)
    }
  }

  const handleShareTemplate = async () => {
    setIsSharingTemplate(true)
    try {
      const result = await shareExamAsTemplate({ examId: exam.id })
      toast.success(
        `Đã chia sẻ phiên bản v${result.data?.version ?? '?'} (${result.data?.questionCount ?? 0} câu hỏi)`
      )
      router.refresh()
    } catch {
      toast.error('Chia sẻ đề thi thất bại')
    } finally {
      setIsSharingTemplate(false)
    }
  }

  const statusMeta = getStatusMeta(
    getExamStatus(displayExam.startTime, displayExam.endTime),
    Boolean(displayExam.isPublished)
  )

  return (
    <div className="space-y-6">
      <section className="rounded-xl bg-sub-primary/90 p-5 shadow-sm md:p-6">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-on-primary md:text-3xl">
              {displayExam.title}
            </h1>
            <span
              className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusMeta.className}`}
            >
              {statusMeta.label}
            </span>
          </div>
          <p className="text-sm text-muted">
            Quản lý thông tin, cấu hình và ngân hàng câu hỏi của bài thi.
          </p>
        </div>

        <div className="mt-5 flex flex-col gap-3 border-t border-border pt-5">
          <div className="flex flex-wrap gap-2">
            <Link href={PATH.TEACHER_EXAM_MONITOR(exam.id)}>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 border-border"
              >
                <Activity className="h-4 w-4" />
                Giám sát thi
              </Button>
            </Link>
            <Link href={`/teacher/exams/${exam.id}/results`}>
              <Button variant="outline" size="sm" className="gap-2">
                <Users className="h-4 w-4" />
                Xem kết quả
              </Button>
            </Link>
            {canManageTemplate && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={handleShareTemplate}
                disabled={isSharingTemplate || !canShareTemplate}
                title={shareDisabledReason}
              >
                {isSharingTemplate ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Share2 className="h-4 w-4" />
                )}
                {templateVersions.length > 0
                  ? 'Chia sẻ phiên bản mới'
                  : 'Chia sẻ đề thi'}
              </Button>
            )}
          </div>
          {canManageTemplate && !canShareTemplate && shareDisabledReason && (
            <p className="max-w-md text-sm text-destructive">
              {shareDisabledReason}
            </p>
          )}
        </div>
      </section>

      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full bg-card shadow-sm p-2 space-y-0 rounded-xl"
      >
        <TabsList className="h-12 w-full justify-start rounded-none border-b bg-transparent p-0">
          <TabsTrigger
            value="overview"
            className="relative h-12 rounded-none border-b-2 border-transparent bg-transparent px-4 pb-3 pt-3 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground data-[state=active]:border-b-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
          >
            Tổng quan và Cài đặt
          </TabsTrigger>

          <TabsTrigger
            value="questions"
            className="relative h-12 rounded-none border-b-2 border-transparent bg-transparent px-4 pb-3 pt-3 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground data-[state=active]:border-b-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
          >
            Câu hỏi ({questionCount})
          </TabsTrigger>

          <TabsTrigger
            value="library"
            className="relative h-12 rounded-none border-b-2 border-transparent bg-transparent px-4 pb-3 pt-3 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground data-[state=active]:border-b-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
          >
            Quản trị phiên bản thư viện
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-0 space-y-5 outline-none">
          <section className="space-y-5 rounded-xl p-5 md:space-y-6 md:p-6">
            {/* Batch 1 — Tổng quan */}
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-xl font-bold tracking-tight text-foreground md:text-2xl">
                  Tổng quan bài thi
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Theo dõi nhanh các thông tin quan trọng và cấu hình hiện tại
                  của bài thi.
                </p>
              </div>
              <EditExamSectionModal
                exam={displayExam}
                section="overview"
                onSaved={handleExamSaved}
              />
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
              {displaySpecification && (
                <OverviewItem
                  label="Đặc tả CSDL"
                  icon={<Database className="h-4 w-4 text-primary/70" />}
                  value={`${displaySpecification.name} (#${displaySpecification.id})`}
                  rightIcon={
                    <Link
                      href={PATH.TEACHER_SPECIFICATION_EDIT(
                        displaySpecification.id
                      )}
                    >
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  }
                />
              )}
            </div>

            <div className="border-t border-border pt-6">
              <div className="grid gap-4 lg:grid-cols-2 lg:items-stretch">
                <div className="flex min-h-0 flex-col gap-4">
                  <div>
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-blue-500/10">
                          <Database className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h3 className="text-base font-semibold text-foreground">
                          Quy định nộp bài
                        </h3>
                      </div>
                      <EditExamSectionModal
                        exam={displayExam}
                        section="submission"
                        onSaved={handleExamSaved}
                      />
                    </div>
                    <div className="rounded-lg border bg-background">
                      <dl className="px-4 pb-3 pt-2 text-sm">
                        <SettingRow
                          label="Xuất bản ngay"
                          value={yesNo(displayExam.isPublished)}
                        />
                        <SettingRow
                          label="Số lần làm tối đa"
                          value={displayExam.maxAttempts}
                        />
                        <SettingRow
                          label="Ngưỡng nộp trễ"
                          value={`${displayExam.lateThreshold} phút`}
                        />
                        <SettingRow
                          label="Tính điểm"
                          value={mapGradingMethod(
                            displayExam.settings?.gradingMethod
                          )}
                        />
                        <SettingRow
                          label="Hiển thị điểm"
                          value={mapScoreDisplayMode(
                            displayExam.settings?.scoreDisplayMode
                          )}
                        />
                        <SettingRow
                          label="Cho phép nộp trễ"
                          value={yesNo(displayExam.settings?.allowOvertime)}
                        />
                        <SettingRow
                          label="Cho phép xem lại bài"
                          value={yesNo(displayExam.settings?.allowReview)}
                        />
                        <SettingRow
                          label="Xem kết quả sau khi nộp bài"
                          value={yesNo(
                            displayExam.settings?.showResultAfterSubmit
                          )}
                        />
                        <SettingRow
                          label="Nạp schema giáo viên"
                          value={yesNo(displayExam.settings?.isLoadDdl)}
                        />
                      </dl>
                    </div>
                  </div>

                  <div>
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-rose-500/10">
                          <ShieldAlert className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                        </div>
                        <h3 className="text-base font-semibold text-foreground">
                          Cài đặt chống gian lận
                        </h3>
                      </div>
                      <EditExamSectionModal
                        exam={displayExam}
                        section="antiCheat"
                        onSaved={handleExamSaved}
                      />
                    </div>
                    <div className="rounded-lg border bg-background p-4">
                      <dl className="space-y-3 text-sm">
                        <div className="flex items-center justify-between gap-3 border-b border-border/50 pb-2.5 last:border-0 last:pb-0">
                          <dt className="text-[13px] text-muted-foreground">
                            Chống Copy/Paste
                          </dt>
                          <dd className="text-right text-[13px] font-medium text-foreground">
                            {yesNo(displayExam.settings?.preventCopyPaste)}
                          </dd>
                        </div>
                        <div className="flex items-center justify-between gap-3 border-b border-border/50 pb-2.5 last:border-0 last:pb-0">
                          <dt className="text-[13px] text-muted-foreground">
                            Bắt buộc toàn màn hình
                          </dt>
                          <dd className="text-right text-[13px] font-medium text-foreground">
                            {yesNo(displayExam.settings?.forceFullscreen)}
                          </dd>
                        </div>
                        <div className="flex items-center justify-between gap-3 border-b border-border/50 pb-2.5 last:border-0 last:pb-0">
                          <dt className="text-[13px] text-muted-foreground">
                            Giám sát chuyển Tab
                          </dt>
                          <dd className="text-right text-[13px] font-medium text-foreground">
                            {yesNo(displayExam.settings?.trackTabSwitch)}
                          </dd>
                        </div>
                        <div className="flex items-center justify-between gap-3 border-b border-border/50 pb-2.5 last:border-0 last:pb-0">
                          <dt className="text-[13px] text-muted-foreground">
                            Tự động nộp khi vi phạm
                          </dt>
                          <dd className="text-right text-[13px] font-medium text-foreground">
                            {yesNo(displayExam.settings?.autoSubmitOnViolation)}
                            {displayExam.settings?.autoSubmitOnViolation &&
                              ` (Tối đa ${displayExam.settings?.maxViolations ?? 3} lần)`}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                </div>

                <section className="flex min-h-0 flex-col gap-3 rounded-lg border bg-background p-4 lg:h-full">
                  <div className="flex shrink-0 items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <Info className="h-5 w-5 shrink-0 text-primary" />
                      <h3 className="text-base font-semibold text-foreground">
                        Mô tả và nội quy
                      </h3>
                    </div>
                    <EditExamSectionModal
                      exam={displayExam}
                      section="description"
                      onSaved={handleExamSaved}
                    />
                  </div>
                  {displayExam.description ? (
                    <div className="min-h-0 flex-1 overflow-y-auto rounded-md bg-muted/30 p-4 text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                      {displayExam.description}
                    </div>
                  ) : (
                    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 rounded-md border border-dashed border-muted-foreground/25 bg-muted/15 px-4 py-10 text-center">
                      <FileText
                        className="h-9 w-9 text-muted-foreground/40"
                        aria-hidden
                      />
                      <p className="max-w-md text-sm text-muted-foreground">
                        Chưa có mô tả và nội quy. Bấm biểu tượng bút để thêm nội
                        dung.
                      </p>
                    </div>
                  )}
                </section>
              </div>
            </div>
          </section>
        </TabsContent>

        <TabsContent value="questions" className="mt-0 outline-none">
          <ExamQuestionsView
            variant="embedded"
            examId={exam.id}
            initialQuestions={questions}
            specification={displaySpecification}
            templateManagement={templateManagement}
            canShareTemplate={canShareTemplate}
            shareDisabledReason={shareDisabledReason}
            specificationSchemaJson={displaySpecification?.schemaJson ?? null}
            specificationDatasets={displaySpecification?.datasets ?? []}
          />
        </TabsContent>

        <TabsContent value="library" className="mt-0 outline-none">
          <TemplateLibraryManagement
            examId={exam.id}
            templateManagement={templateManagement}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
