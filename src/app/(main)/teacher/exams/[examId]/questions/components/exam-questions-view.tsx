'use client'

import {
  ArrowRight,
  Award,
  Box,
  Code2,
  Database,
  FunctionSquare,
  Hash,
  Loader2,
  Plus,
  Save,
  Search,
  Settings,
  Share2,
  Sparkles,
  Table2,
  Terminal,
  Users,
  X,
  Zap
} from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

import { RichTextEditor } from '@/components/shared/rich-text-editor'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { useApi } from '@/hooks/use-api'
import {
  createExamQuestionsBatch,
  deleteExamQuestion,
  shareExamAsTemplate,
  updateExamQuestion
} from '@/lib/actions'
import { PATH } from '@/lib/constants'
import {
  CreateExamQuestionBatch,
  ExamQuestionItem,
  ExamSpecification,
  GradingRubric,
  SpecificationDetailResponse,
  TeacherExamTemplateVersionsResponse,
  UpdateExamQuestionRequest
} from '@/lib/types'
import { CreateTableQueryFromSpec } from './create-table-query-from-spec'
import { CreateTableRubricEditor } from './create-table-rubric-editor'
import { InsertDataRubricEditor } from './insert-data-rubric-editor'
import { InsertDataTestGrader } from './insert-data-test-grader'
import { QuestionItem } from './question-item'
import { RubricTestGrader } from './rubric-test-grader'
import { SelectQueryRubricEditor } from './select-query-rubric-editor'
import { SelectQueryTestGrader } from './select-query-test-grader'
import { TeacherSqlEditor } from './teacher-sql-editor'

const QUESTION_TYPES = [
  {
    value: 'CREATE_TABLE',
    label: 'CREATE TABLE',
    icon: Table2,
    desc: 'Tạo cấu trúc bảng'
  },
  {
    value: 'INSERT_DATA',
    label: 'INSERT DATA',
    icon: Database,
    desc: 'Thêm dữ liệu'
  },
  {
    value: 'SELECT_QUERY',
    label: 'SELECT QUERY',
    icon: Search,
    desc: 'Truy vấn bảng'
  },
  { value: 'TRIGGER', label: 'TRIGGER', icon: Zap, desc: 'Ràng buộc tự động' },
  {
    value: 'FUNCTION',
    label: 'FUNCTION',
    icon: FunctionSquare,
    desc: 'Hàm xử lý'
  },
  {
    value: 'STORED_PROCEDURE',
    label: 'STORED PROCEDURE',
    icon: Box,
    desc: 'Thủ tục lưu trữ'
  }
]

interface ExamQuestionsViewProps {
  examId: number
  initialQuestions: ExamQuestionItem[]
  specification?: ExamSpecification | SpecificationDetailResponse | null
  templateManagement: TeacherExamTemplateVersionsResponse | null
  canShareTemplate: boolean
  shareDisabledReason?: string
  variant?: 'standalone' | 'embedded'
}

interface QuestionFormState extends CreateExamQuestionBatch {
  id: string // temp id for form
  rubricData?: GradingRubric | null
  wizardStep?: number
}

function formatVersionTimestamp(value?: string) {
  return value ? new Date(value).toLocaleString('vi-VN') : '-'
}

export function ExamQuestionsView({
  examId,
  initialQuestions,
  specification = null,
  templateManagement,
  canShareTemplate,
  shareDisabledReason,
  variant = 'standalone'
}: ExamQuestionsViewProps) {
  const { callApi, isLoading } = useApi()
  const router = useRouter()
  const pathname = usePathname()
  const [questions, setQuestions] = useState(initialQuestions)
  const [isSharing, setIsSharing] = useState(false)

  const versions = templateManagement?.versions ?? []
  const canManage = templateManagement?.canManage ?? false
  const visibleVersions = versions.filter((version) => version.isVisible)
  const latestVersion = versions[0] ?? null
  const latestVisibleVersion = visibleVersions[0] ?? null
  const recentVersions = versions.slice(0, 3)
  const isDedicatedQuestionsPage =
    pathname === PATH.TEACHER_EXAM_QUESTIONS(examId)

  // Single wizard form state
  const [creatingQuestion, setCreatingQuestion] =
    useState<QuestionFormState | null>(null)
  const [isTypeSelectorOpen, setIsTypeSelectorOpen] = useState(false)

  const handleShareAsTemplate = async () => {
    setIsSharing(true)
    try {
      const result = await shareExamAsTemplate({ examId })
      toast.success(
        `Đã chia sẻ phiên bản v${result.data?.version ?? '?'} (${result.data?.questionCount ?? 0} câu hỏi)`
      )
      router.refresh()
    } catch {
      toast.error('Chia sẻ đề thi thất bại')
    } finally {
      setIsSharing(false)
    }
  }

  const startCreatingQuestion = (type: string) => {
    const newQuestion: QuestionFormState = {
      id: Date.now().toString(),
      content: '',
      correctQuery: '',
      verifyScript: '',
      points: 1,
      orderIndex: questions.length + 1,
      questionType: type as QuestionFormState['questionType'],
      difficultyLevel: 1,
      rubricData: null,
      wizardStep: 1
    }
    setCreatingQuestion(newQuestion)
    setIsTypeSelectorOpen(false)
  }

  const updateCreatingQuestion = (updates: Partial<QuestionFormState>) => {
    setCreatingQuestion((prev) => (prev ? { ...prev, ...updates } : null))
  }

  const [updatingQuestionId, setUpdatingQuestionId] = useState<number | null>(
    null
  )
  const [deletingQuestionId, setDeletingQuestionId] = useState<number | null>(
    null
  )

  const handleUpdateExistingQuestion = async (
    id: number,
    data: UpdateExamQuestionRequest
  ) => {
    setUpdatingQuestionId(id)
    try {
      const res = await updateExamQuestion(examId, id, data)
      if (res.data) {
        setQuestions((prev) => prev.map((q) => (q.id === id ? res.data! : q)))
        toast.success('Cập nhật câu hỏi thành công')
      }
    } catch {
      toast.error('Cập nhật câu hỏi thất bại')
    } finally {
      setUpdatingQuestionId(null)
    }
  }

  const handleDeleteExistingQuestion = async (id: number) => {
    setDeletingQuestionId(id)
    try {
      await deleteExamQuestion(examId, id)
      setQuestions((prev) => prev.filter((q) => q.id !== id))
      toast.success('Đã xóa câu hỏi')
    } catch {
      toast.error('Xóa câu hỏi thất bại')
    } finally {
      setDeletingQuestionId(null)
    }
  }

  const handleSubmitQuestion = async () => {
    if (!creatingQuestion) return
    const q = creatingQuestion

    if (!q.content.trim()) {
      toast.error('Vui lòng nhập nội dung đề bài')
      return
    }
    if (q.questionType === 'INSERT_DATA' && !q.correctQuery?.trim()) {
      toast.error(
        'Câu INSERT DATA: vui lòng nhập script đáp án chuẩn trước khi tạo rubric AI'
      )
      return
    }
    if (!q.points || q.points <= 0) {
      toast.error('Điểm phải lớn hơn 0')
      return
    }
    if (
      ['CREATE_TABLE', 'INSERT_DATA', 'SELECT_QUERY'].includes(q.questionType)
    ) {
      if (!q.rubricData) {
        toast.error(
          'Vui lòng hoàn thành Bước 3 (Thiết lập cách chấm điểm chấm điểm) trước khi lưu'
        )
        return
      }
    }

    const questionsToCreate = [
      {
        content: q.content,
        correctQuery: q.correctQuery,
        verifyScript: q.verifyScript,
        points: q.points,
        orderIndex: q.orderIndex,
        questionType: q.questionType,
        difficultyLevel: q.difficultyLevel,
        gradingRubric: q.rubricData ? JSON.stringify(q.rubricData) : undefined
      }
    ]

    const result = await callApi(
      createExamQuestionsBatch(examId, { questions: questionsToCreate }),
      false
    )

    if (result.data) {
      setQuestions((prev) => [...prev, ...result.data!.questions])
      setCreatingQuestion(null)
      toast.success('Đã tạo câu hỏi thành công')
    }
  }

  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0)

  return (
    <div className="space-y-8 px-4">
      {/* Header */}
      <div className="flex flex-col gap-3 pt-4 pb-1 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 border-l-4 border-primary/60 pl-3">
          <div>
            {variant === 'embedded' ? (
              <h2 className="text-xl font-bold tracking-tight text-title md:text-2xl">
                Danh sách câu hỏi
              </h2>
            ) : (
              <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-title">
                Danh sách câu hỏi
              </h1>
            )}
            <div className="mt-1 flex flex-wrap items-center gap-2 text-muted-foreground">
              <p className="text-sm">
                Bài thi #{examId} · {questions.length} câu · {totalPoints} điểm
              </p>
              {latestVisibleVersion && (
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-600">
                  Đang public · v{latestVisibleVersion.version}
                </span>
              )}
            </div>
          </div>
        </div>

        {variant === 'embedded' && !creatingQuestion && (
          <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
            <Button
              className="gap-2"
              onClick={() => setIsTypeSelectorOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Thêm câu hỏi
            </Button>
          </div>
        )}

        {variant === 'standalone' && !creatingQuestion && (
          <div className="flex flex-col items-end gap-2">
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Link href={PATH.TEACHER_EXAM_DETAIL(examId)}>
                <Button variant="outline" className="gap-2">
                  <Settings className="h-4 w-4" />
                  Cài đặt bài thi
                </Button>
              </Link>
              <Link href={`/teacher/exams/${examId}/results`}>
                <Button variant="outline" className="gap-2">
                  <Users className="h-4 w-4" />
                  Xem kết quả
                </Button>
              </Link>
              {canManage && (
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={handleShareAsTemplate}
                  disabled={isSharing || !canShareTemplate}
                  title={shareDisabledReason}
                >
                  {isSharing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Share2 className="h-4 w-4" />
                  )}
                  {versions.length > 0
                    ? 'Chia sẻ phiên bản mới'
                    : 'Chia sẻ đề thi'}
                </Button>
              )}
              <Button
                onClick={() => setIsTypeSelectorOpen(true)}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Thêm câu hỏi
              </Button>
            </div>
            {canManage && !canShareTemplate && shareDisabledReason && (
              <p className="max-w-md text-right text-xs text-destructive">
                {shareDisabledReason}
              </p>
            )}
          </div>
        )}
      </div>

      <Dialog open={isTypeSelectorOpen} onOpenChange={setIsTypeSelectorOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Chọn loại câu hỏi</DialogTitle>
            <DialogDescription>
              Loại câu hỏi sẽ quyết định cách hệ thống hỗ trợ biên soạn và chấm
              điểm tự động. Vui lòng chọn bên dưới:
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {QUESTION_TYPES.map((t) => {
              const Icon = t.icon
              return (
                <Button
                  key={t.value}
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-center justify-center gap-3 border-border hover:border-primary hover:bg-primary/5 transition-all text-center"
                  onClick={() => startCreatingQuestion(t.value)}
                >
                  <div className="p-3 bg-sub-background rounded-full group-hover:bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="font-bold text-foreground mb-1">
                      {t.label}
                    </div>
                    <div className="text-xs text-muted-foreground font-normal">
                      {t.desc}
                    </div>
                  </div>
                </Button>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>

      {isDedicatedQuestionsPage && (canManage || versions.length > 0) && (
        <section className="rounded-2xl border border-sub-primary/15 bg-linear-to-br from-sub-primary/6 via-card to-card p-5 shadow-sm">
          <div className="space-y-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-semibold text-foreground">
                    Phiên bản thư viện
                  </h2>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      latestVisibleVersion
                        ? 'bg-emerald-500/10 text-emerald-600'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {latestVisibleVersion
                      ? `Đang public v${latestVisibleVersion.version}`
                      : 'Chưa public'}
                  </span>
                  {versions.length > 0 && (
                    <span className="rounded-full bg-sub-primary/10 px-2.5 py-1 text-xs font-medium text-sub-primary">
                      {visibleVersions.length}/{versions.length} phiên bản hiển
                      thị
                    </span>
                  )}
                </div>
                <p className="max-w-2xl text-sm text-muted-foreground">
                  Theo dõi lịch sử chia sẻ đề thi ngay tại trang câu hỏi. Việc
                  ẩn hoặc hiện phiên bản được quản lý trong tab thư viện của
                  trang chi tiết bài thi.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link href={PATH.TEACHER_EXAM_DETAIL(examId)}>
                  <Button variant="outline" className="gap-2">
                    <Settings className="h-4 w-4" />
                    Quản lý tất cả phiên bản
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-xl border border-border/70 bg-card/80 px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Lần chia sẻ gần nhất
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {formatVersionTimestamp(latestVersion?.createdAt)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {latestVersion?.sharedByName ?? 'Chưa có dữ liệu'}
                </p>
              </div>
              <div className="rounded-xl border border-border/70 bg-card/80 px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Phiên bản hiển thị
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {visibleVersions.length} phiên bản
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {latestVisibleVersion
                    ? `Bản công khai mới nhất là v${latestVisibleVersion.version}`
                    : 'Chưa có phiên bản nào đang hiển thị'}
                </p>
              </div>
              <div className="rounded-xl border border-border/70 bg-card/80 px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Câu hỏi hiện tại
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {questions.length} câu hỏi
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Tổng {totalPoints} điểm trong đề đang biên soạn
                </p>
              </div>
            </div>

            {recentVersions.length > 0 ? (
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Lịch sử phiên bản gần nhất
                  </p>
                  {versions.length > recentVersions.length && (
                    <p className="text-xs text-muted-foreground">
                      Hiển thị {recentVersions.length}/{versions.length} phiên
                      bản gần đây nhất
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  {recentVersions.map((version) => (
                    <div
                      key={version.templateId}
                      className="flex flex-col gap-3 rounded-xl border border-border/70 bg-card/85 px-4 py-3 md:flex-row md:items-center md:justify-between"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-sub-primary/10 px-2.5 py-0.5 text-xs font-medium text-sub-primary">
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
                          {version.questionCount} câu hỏi ·{' '}
                          {formatVersionTimestamp(version.createdAt)} ·{' '}
                          {version.sharedByName}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border bg-card/60 px-4 py-6 text-sm text-muted-foreground">
                Chưa có phiên bản nào trong thư viện. Sau khi hoàn thiện đề và
                đặc tả, hãy chia sẻ phiên bản đầu tiên ngay tại đây.
              </div>
            )}
          </div>
        </section>
      )}

      {/* Add Single Question Wizard */}
      {creatingQuestion &&
        (() => {
          const q = creatingQuestion
          const step = q.wizardStep || 1
          const hasWizard = [
            'CREATE_TABLE',
            'INSERT_DATA',
            'SELECT_QUERY'
          ].includes(q.questionType)

          return (
            <div className="rounded-xl border border-border bg-card shadow-lg overflow-hidden transition-all mb-8">
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-4 bg-muted/20 px-5 py-4 border-b border-border">
                <div className="flex items-center gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sub-primary/10 text-sm font-bold text-sub-primary">
                    <Sparkles className="h-4 w-4" />
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground">
                      Đang tạo câu hỏi mới
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCreatingQuestion(null)}
                  >
                    <X className="h-5 w-5 text-muted-foreground" />
                  </Button>
                </div>
              </div>

              {/* Stepper Header */}
              <div className="px-6 py-5 bg-card border-b border-border/50 overflow-x-auto">
                <nav aria-label="Progress" className="min-w-fit">
                  <ol role="list" className="flex items-center">
                    {(hasWizard
                      ? [
                          { step: 1, label: 'Nội dung & Đáp án' },
                          { step: 2, label: 'Cấu hình kỳ vọng' },
                          { step: 3, label: 'Thiết lập cách chấm điểm' },
                          { step: 4, label: 'Hoàn thành' }
                        ]
                      : [
                          { step: 1, label: 'Nội dung & Đáp án' },
                          { step: 4, label: 'Hoàn thành' }
                        ]
                    ).map((s, i, arr) => (
                      <li
                        key={s.step}
                        className={`relative flex items-center ${i !== arr.length - 1 ? 'flex-1' : ''}`}
                      >
                        <div
                          className="flex items-center cursor-pointer group select-none"
                          onClick={() => {
                            if (
                              s.step > step &&
                              step === 1 &&
                              (!q.content || !q.correctQuery)
                            ) {
                              toast.error(
                                'Vui lòng nhập nội dung đề bài và đáp án chuẩn'
                              )
                              return
                            }
                            updateCreatingQuestion({ wizardStep: s.step })
                          }}
                        >
                          <span
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200 ${
                              step === s.step
                                ? 'border-primary bg-primary text-primary-foreground shadow-sm scale-110'
                                : step > s.step
                                  ? 'border-primary bg-primary/10 text-primary'
                                  : 'border-muted-foreground/30 bg-muted text-muted-foreground hover:border-primary/50'
                            }`}
                          >
                            <span className="text-sm font-semibold">
                              {s.step}
                            </span>
                          </span>
                          <span
                            className={`ml-3 text-sm font-medium whitespace-nowrap transition-colors duration-200 hidden sm:block ${
                              step === s.step
                                ? 'text-foreground font-bold'
                                : step > s.step
                                  ? 'text-primary'
                                  : 'text-muted-foreground/60 group-hover:text-muted-foreground/80'
                            }`}
                          >
                            {s.label}
                          </span>
                        </div>

                        {i !== arr.length - 1 && (
                          <div className="flex-1 min-w-[2rem] mx-4 sm:mx-6">
                            <div
                              className={`h-[2px] w-full rounded-full transition-colors duration-300 ${
                                step > s.step
                                  ? 'bg-primary'
                                  : 'bg-muted-foreground/20'
                              }`}
                            />
                          </div>
                        )}
                      </li>
                    ))}
                  </ol>
                </nav>
              </div>

              {/* Card Body */}
              <div className="p-5 space-y-6">
                {/* Step 1 & 4: Content and SQL Editors */}
                {(step === 1 || step === 4) && (
                  <div
                    className={`space-y-6 ${step === 4 ? 'opacity-90' : ''}`}
                  >
                    <div className="space-y-6">
                      {/* Meta Settings */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 p-5 rounded-lg bg-muted/10 border border-border/50">
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Loại câu hỏi
                          </label>
                          <select
                            value={q.questionType}
                            onChange={(e) =>
                              updateCreatingQuestion({
                                questionType: e.target
                                  .value as QuestionFormState['questionType'],
                                wizardStep: 1
                              })
                            }
                            className="w-full rounded-md border border-border bg-sub-background px-3 py-2 text-sm font-medium"
                            disabled={step === 4}
                          >
                            {QUESTION_TYPES.map((t) => (
                              <option key={t.value} value={t.value}>
                                {t.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Điểm số
                          </label>
                          <input
                            type="number"
                            value={q.points}
                            onChange={(e) =>
                              updateCreatingQuestion({
                                points: Number(e.target.value)
                              })
                            }
                            min={0.5}
                            step={0.5}
                            className="w-full rounded-md border border-border bg-sub-background px-3 py-2 text-sm"
                            readOnly={step === 4}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Độ khó (1-5)
                          </label>
                          <input
                            type="number"
                            value={q.difficultyLevel ?? 1}
                            onChange={(e) =>
                              updateCreatingQuestion({
                                difficultyLevel: Number(e.target.value)
                              })
                            }
                            min={1}
                            max={5}
                            className="w-full rounded-md border border-border bg-sub-background px-3 py-2 text-sm"
                            readOnly={step === 4}
                          />
                        </div>
                      </div>

                      {/* Main Content */}
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-foreground">
                          Nội dung câu hỏi{' '}
                          <span className="text-destructive">*</span>
                        </label>
                        <div className="min-h-[160px] rounded-md border border-border bg-background">
                          <RichTextEditor
                            content={q.content}
                            onChange={(val) =>
                              updateCreatingQuestion({ content: val })
                            }
                            placeholder="Nhập yêu cầu câu hỏi..."
                            editable={step !== 4}
                          />
                        </div>
                      </div>
                    </div>

                    {/* SQL Editors */}
                    <div
                      className={`grid gap-5 ${!hasWizard ? 'lg:grid-cols-2' : ''}`}
                    >
                      <div className="space-y-2">
                        <label className="flex items-center justify-between text-sm font-semibold text-foreground">
                          <span className="flex items-center gap-1.5">
                            <Code2 className="h-4 w-4 text-primary" />
                            Đáp án chuẩn{' '}
                            <span className="text-destructive">*</span>
                          </span>
                        </label>
                        {q.questionType === 'CREATE_TABLE' && step !== 4 && (
                          <CreateTableQueryFromSpec
                            specification={specification}
                            onApply={(sql) =>
                              updateCreatingQuestion({ correctQuery: sql })
                            }
                          />
                        )}
                        <div className="h-[160px] overflow-hidden rounded-md border border-border bg-background">
                          <TeacherSqlEditor
                            value={q.correctQuery}
                            onChange={(value) =>
                              updateCreatingQuestion({
                                correctQuery: value || ''
                              })
                            }
                            height="100%"
                            readOnly={step === 4}
                          />
                        </div>
                      </div>
                      {!hasWizard && (
                        <div className="space-y-2">
                          <label className="flex items-center justify-between text-sm font-semibold text-foreground">
                            <span className="flex items-center gap-1.5">
                              <Terminal className="h-4 w-4 text-muted-foreground" />
                              Script kiểm thử (Verify Script)
                            </span>
                          </label>
                          <div className="h-[160px] overflow-hidden rounded-md border border-border bg-background">
                            <TeacherSqlEditor
                              value={q.verifyScript}
                              onChange={(value) =>
                                updateCreatingQuestion({
                                  verifyScript: value || ''
                                })
                              }
                              height="100%"
                              readOnly={step === 4}
                            />
                          </div>
                          {!q.verifyScript && (
                            <p className="flex items-center gap-1.5 text-[11px] text-primary italic">
                              <Sparkles className="h-3 w-3" />
                              AI sẽ tự động tạo script dựa trên nội dung đề bài
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 2 & 3: Rubric Editors */}
                {(step === 2 || step === 3) && hasWizard && (
                  <div className="rounded-lg p-4 space-y-4">
                    <h4 className="flex items-center gap-2 text-sm font-bold text-sub-primary">
                      <Sparkles className="h-4 w-4" />
                      {step === 2
                        ? 'Bước 2: Cấu hình kỳ vọng kỳ vọng từ đáp án'
                        : 'Bước 3: Thiết lập cách chấm điểm chấm điểm AI'}
                    </h4>
                    {q.questionType === 'CREATE_TABLE' && (
                      <CreateTableRubricEditor
                        examId={examId}
                        totalPoints={q.points}
                        rubric={q.rubricData ?? null}
                        onChange={(rubric) =>
                          updateCreatingQuestion({ rubricData: rubric })
                        }
                        correctQuery={q.correctQuery}
                        questionContent={q.content}
                        wizardStep={step}
                      />
                    )}
                    {q.questionType === 'INSERT_DATA' && (
                      <InsertDataRubricEditor
                        examId={examId}
                        totalPoints={q.points}
                        rubric={q.rubricData ?? null}
                        onChange={(rubric) =>
                          updateCreatingQuestion({ rubricData: rubric })
                        }
                        correctQuery={q.correctQuery}
                        questionContent={q.content}
                        wizardStep={step}
                      />
                    )}
                    {q.questionType === 'SELECT_QUERY' && (
                      <SelectQueryRubricEditor
                        examId={examId}
                        totalPoints={q.points}
                        rubric={q.rubricData ?? null}
                        onChange={(rubric) =>
                          updateCreatingQuestion({ rubricData: rubric })
                        }
                        correctQuery={q.correctQuery}
                        questionContent={q.content}
                        contextQueries={questions
                          .filter(
                            (item) =>
                              (item.questionType === 'CREATE_TABLE' ||
                                item.questionType === 'INSERT_DATA') &&
                              Boolean(item.correctQuery?.trim())
                          )
                          .map((item) => ({
                            questionType: item.questionType,
                            content: item.content,
                            correctQuery: item.correctQuery
                          }))}
                        wizardStep={step}
                      />
                    )}
                  </div>
                )}

                {/* Step 4: Final Grader Preview */}
                {step === 4 && (
                  <div className="rounded-lg border border-border p-4 space-y-4 bg-muted/10">
                    <div className="flex items-center gap-2 mb-4">
                      <Award className="h-5 w-5 text-sub-primary" />
                      <h3 className="text-lg font-bold">Chấm thử & Xác nhận</h3>
                    </div>
                    {q.questionType === 'CREATE_TABLE' && (
                      <RubricTestGrader
                        correctQuery={q.correctQuery}
                        rubric={q.rubricData ?? null}
                      />
                    )}
                    {q.questionType === 'INSERT_DATA' && (
                      <InsertDataTestGrader
                        examId={examId}
                        correctQuery={q.correctQuery}
                        rubric={q.rubricData ?? null}
                      />
                    )}
                    {q.questionType === 'SELECT_QUERY' && (
                      <SelectQueryTestGrader
                        examId={examId}
                        correctQuery={q.correctQuery}
                        rubric={q.rubricData ?? null}
                      />
                    )}
                  </div>
                )}
              </div>

              {/* Stepper Navigation */}
              <div className="flex items-center justify-between gap-3 p-4 bg-muted/10 border-t border-border">
                <Button
                  variant="ghost"
                  onClick={() => setCreatingQuestion(null)}
                >
                  Hủy bỏ
                </Button>
                <div className="flex items-center gap-3">
                  {step > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        let prev = step - 1
                        if (prev === 3 && !hasWizard) prev = 1
                        updateCreatingQuestion({ wizardStep: prev })
                      }}
                    >
                      Quay lại
                    </Button>
                  )}
                  {step < 4 ? (
                    <Button
                      type="button"
                      onClick={() => {
                        if (step === 1 && (!q.content || !q.correctQuery)) {
                          toast.error(
                            'Vui lòng nhập nội dung đề bài và đáp án chuẩn'
                          )
                          return
                        }
                        let nxt = step + 1
                        if (nxt === 2 && !hasWizard) nxt = 4
                        updateCreatingQuestion({ wizardStep: nxt })
                      }}
                    >
                      Bước tiếp theo <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  ) : (
                    <Button onClick={handleSubmitQuestion} disabled={isLoading}>
                      {isLoading ? (
                        <Loader2 className="animate-spin h-4 w-4 mr-2" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Hoàn thành & Lưu câu hỏi
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )
        })()}

      {/* Questions list */}
      {questions.length === 0 && !creatingQuestion ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
          <Hash className="h-10 w-10 text-muted-foreground/40" />
          <h3 className="mt-4 text-lg font-semibold text-foreground">
            Chưa có câu hỏi nào
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Bắt đầu thêm câu hỏi cho bài thi này.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((q) => (
            <QuestionItem
              key={q.id}
              question={q}
              onDelete={handleDeleteExistingQuestion}
              onUpdate={handleUpdateExistingQuestion}
              isUpdating={updatingQuestionId === q.id}
              isDeleting={deletingQuestionId === q.id}
              allQuestions={questions}
              specification={specification}
              examId={examId}
            />
          ))}
        </div>
      )}
    </div>
  )
}
