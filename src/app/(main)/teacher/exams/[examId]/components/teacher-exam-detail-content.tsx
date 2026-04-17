'use client'

import {
  Activity,
  ArrowUpRight,
  Clock,
  Database,
  Eye,
  FileText,
  Info,
  Loader2,
  Share2,
  ShieldAlert,
  Upload,
  Users
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getSpecificationDetail, shareExamAsTemplate } from '@/lib/actions'
import { fetchExamPdfBlobUrl } from '@/lib/api/pdf-client'
import { PATH } from '@/lib/constants'
import {
  ExamQuestionItem,
  SpecificationDetailResponse,
  TeacherExamDetail,
  TeacherExamTemplateVersionsResponse
} from '@/lib/types'
import { formatDateTime, getExamStatus } from '@/lib/utils'
import { ExamQuestionsView } from '../questions/components/exam-questions-view'
import { EditExamSectionModal } from './edit-exam-section-modal'
import { TemplateLibraryManagement } from './template-library-management'

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
  value: React.ReactNode
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:flex-nowrap">
      <dt className="text-[13px] font-medium text-muted-foreground">{label}</dt>
      <dd className="text-right text-[13px] font-semibold text-foreground">
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
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false)
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null)
  const [pdfLoading, setPdfLoading] = useState(false)
  const router = useRouter()

  const hasPdf = Boolean(
    displayExam.pdfFilePath && displayExam.pdfFilePath.trim().length > 0
  )

  const handleViewPdf = useCallback(async () => {
    if (pdfBlobUrl) {
      setPdfViewerOpen(true)
      return
    }
    setPdfLoading(true)
    setPdfViewerOpen(true)
    try {
      const url = await fetchExamPdfBlobUrl(exam.id)
      setPdfBlobUrl(url)
    } catch {
      toast.error('Không thể tải file PDF')
      setPdfViewerOpen(false)
    } finally {
      setPdfLoading(false)
    }
  }, [exam.id, pdfBlobUrl])

  useEffect(() => {
    return () => {
      if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl)
    }
  }, [pdfBlobUrl])

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

    const updatedHasPdf =
      updated.pdfFilePath && updated.pdfFilePath.trim().length > 0
    const updatedHasSpec =
      updated.specificationId != null && updated.specificationId > 0

    if (updatedHasPdf) {
      setDisplaySpecification(null)
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl)
        setPdfBlobUrl(null)
      }
    } else if (updatedHasSpec) {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl)
        setPdfBlobUrl(null)
      }
      void getSpecificationDetail(updated.specificationId!).then((res) => {
        if (res.data) setDisplaySpecification(res.data)
      })
    } else {
      setDisplaySpecification(null)
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl)
        setPdfBlobUrl(null)
      }
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
        className="w-full bg-card p-2 space-y-0 rounded-xl"
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
              {hasPdf ? (
                <OverviewItem
                  label="Đặc tả PDF"
                  icon={<Upload className="h-4 w-4 text-red-500/70" />}
                  value={displayExam.originalPdfFileName || 'File PDF'}
                  rightIcon={
                    <button
                      onClick={handleViewPdf}
                      className="rounded-md p-0.5 hover:bg-muted"
                      title="Xem PDF"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  }
                />
              ) : displaySpecification ? (
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
              ) : null}
            </div>

            <div className="border-t border-border pt-6">
              <div className="grid gap-4 lg:grid-cols-2 lg:items-stretch">
                <div className="flex min-h-0 flex-col gap-4">
                  <div className="overflow-hidden bg-card shadow-sm">
                    <div className="flex items-center justify-between gap-3 border-b border-border/30 bg-primary/5 px-4 py-3 dark:bg-primary/5">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/15">
                          <Database className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-bold text-foreground">
                            Quy định nộp bài
                          </h3>
                          <p className="truncate text-xs text-muted-foreground">
                            Quy định xuất bản, điểm số và nộp bài
                          </p>
                        </div>
                      </div>
                      <EditExamSectionModal
                        exam={displayExam}
                        section="submission"
                        onSaved={handleExamSaved}
                      />
                    </div>
                    <dl className="divide-y divide-border/30 text-sm">
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

                  <div className="overflow-hidden bg-card shadow-sm">
                    <div className="flex items-center justify-between gap-3 border-b border-border/30 bg-rose-500/5 px-4 py-3 dark:bg-rose-500/10">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-500/15">
                          <ShieldAlert className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-bold text-foreground">
                            Cài đặt chống gian lận
                          </h3>
                          <p className="truncate text-xs text-muted-foreground">
                            Các thiết lập giám sát và vi phạm
                          </p>
                        </div>
                      </div>
                      <EditExamSectionModal
                        exam={displayExam}
                        section="antiCheat"
                        onSaved={handleExamSaved}
                      />
                    </div>
                    <dl className="divide-y divide-border/30 text-sm">
                      <SettingRow
                        label="Chống Copy/Paste"
                        value={yesNo(displayExam.settings?.preventCopyPaste)}
                      />
                      <SettingRow
                        label="Bắt buộc toàn màn hình"
                        value={yesNo(displayExam.settings?.forceFullscreen)}
                      />
                      <SettingRow
                        label="Giám sát chuyển Tab"
                        value={yesNo(displayExam.settings?.trackTabSwitch)}
                      />
                      <SettingRow
                        label="Tự động nộp khi vi phạm"
                        value={
                          <span>
                            {yesNo(displayExam.settings?.autoSubmitOnViolation)}
                            {displayExam.settings?.autoSubmitOnViolation && (
                              <span className="ml-1 text-muted-foreground font-normal">
                                (Tối đa{' '}
                                {displayExam.settings?.maxViolations ?? 3} lần)
                              </span>
                            )}
                          </span>
                        }
                      />
                    </dl>
                  </div>
                </div>

                <section className="flex min-h-0 flex-col overflow-hidden bg-card shadow-sm lg:h-full">
                  <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border/30 bg-primary/5 px-4 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Info className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-bold text-foreground">
                          Mô tả và nội quy
                        </h3>
                        <p className="truncate text-xs text-muted-foreground">
                          Thông tin và hướng dẫn cho sinh viên
                        </p>
                      </div>
                    </div>
                    <EditExamSectionModal
                      exam={displayExam}
                      section="description"
                      onSaved={handleExamSaved}
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    {displayExam.description ? (
                      <div className="min-h-0 flex-1 overflow-y-auto rounded-md bg-muted/20 p-4 text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                        {displayExam.description}
                      </div>
                    ) : (
                      <div className="flex min-h-[300px] flex-1 flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-primary/20 bg-primary/5 px-4 py-10 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                          <FileText
                            className="h-8 w-8 text-primary/60"
                            aria-hidden
                          />
                        </div>
                        <div className="space-y-1">
                          <p className="text-base font-semibold text-foreground">
                            Chưa có mô tả
                          </p>
                          <p className="max-w-[250px] text-sm text-muted-foreground">
                            Bấm vào biểu tượng bút ở góc trên để thêm nội quy
                            hoặc hướng dẫn cho sinh viên
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              </div>
            </div>
          </section>
        </TabsContent>

        <TabsContent value="questions" className="mt-0 outline-none p-3">
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

      <Dialog open={pdfViewerOpen} onOpenChange={setPdfViewerOpen}>
        <DialogContent className="flex h-[95vh] w-[95vw] max-w-[95vw] sm:max-w-[95vw] flex-col gap-0 overflow-hidden p-0">
          <DialogHeader className="shrink-0 border-b border-border px-6 py-4">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-red-500" />
              {displayExam.originalPdfFileName || 'Đặc tả PDF'}
            </DialogTitle>
            <DialogDescription>Đặc tả bài thi dạng file PDF</DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1">
            {pdfLoading ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : pdfBlobUrl ? (
              <iframe
                src={pdfBlobUrl}
                title={displayExam.originalPdfFileName || 'Exam PDF'}
                className="h-full w-full border-0"
              />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
