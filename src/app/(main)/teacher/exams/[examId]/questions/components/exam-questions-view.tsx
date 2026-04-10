'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Plus,
  Hash,
  Save,
  Share2,
  Settings,
  X,
  Trash2,
  Loader2,
  Code2,
  Terminal,
  Sparkles,
  Users,
  Play,
  ArrowRight
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { RichTextEditor } from '@/components/shared/rich-text-editor'
import { RubricTestGrader } from './rubric-test-grader'
import { TeacherSqlEditor } from './teacher-sql-editor'
import {
  createExamQuestionsBatch,
  shareExamAsTemplate,
  deleteExamQuestion,
  updateExamQuestion
} from '@/lib/actions'
import { useApi } from '@/hooks/use-api'
import {
  ExamQuestionItem,
  CreateExamQuestionBatch,
  GradingRubric,
  ExamSpecification,
  SpecificationDetailResponse,
  TeacherExamTemplateVersionsResponse,
  UpdateExamQuestionRequest
} from '@/lib/types'
import { PATH } from '@/lib/constants'
import { CreateTableRubricEditor } from './create-table-rubric-editor'
import { InsertDataRubricEditor } from './insert-data-rubric-editor'
import { InsertDataTestGrader } from './insert-data-test-grader'
import { SelectQueryRubricEditor } from './select-query-rubric-editor'
import { SelectQueryTestGrader } from './select-query-test-grader'
import { QuestionItem } from './question-item'
import { CreateTableQueryFromSpec } from './create-table-query-from-spec'
import { InsertQueryFromSpec } from './insert-query-from-spec'

const QUESTION_TYPES = [
  { value: 'CREATE_TABLE', label: 'CREATE TABLE' },
  { value: 'INSERT_DATA', label: 'INSERT DATA' },
  { value: 'SELECT_QUERY', label: 'SELECT QUERY' },
  { value: 'TRIGGER', label: 'TRIGGER' },
  { value: 'FUNCTION', label: 'FUNCTION' },
  { value: 'STORED_PROCEDURE', label: 'STORED PROCEDURE' }
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
  const [showAddForm, setShowAddForm] = useState(false)
  const [isSharing, setIsSharing] = useState(false)

  const versions = templateManagement?.versions ?? []
  const canManage = templateManagement?.canManage ?? false
  const visibleVersions = versions.filter((version) => version.isVisible)
  const latestVersion = versions[0] ?? null
  const latestVisibleVersion = visibleVersions[0] ?? null
  const recentVersions = versions.slice(0, 3)
  const isDedicatedQuestionsPage =
    pathname === PATH.TEACHER_EXAM_QUESTIONS(examId)

  // Batch form state — multiple questions
  const [pendingQuestions, setPendingQuestions] = useState<QuestionFormState[]>(
    []
  )

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

  const addEmptyQuestion = () => {
    const newQuestion: QuestionFormState = {
      id: Date.now().toString(),
      content: '',
      correctQuery: '',
      verifyScript: '',
      points: 1,
      orderIndex: questions.length + pendingQuestions.length + 1,
      questionType: 'SELECT_QUERY',
      difficultyLevel: 1,
      rubricData: null
    }
    setPendingQuestions((prev) => [...prev, newQuestion])
  }

  const updateQuestion = (id: string, updates: Partial<QuestionFormState>) => {
    setPendingQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, ...updates } : q))
    )
  }

  const removeQuestion = (id: string) => {
    setPendingQuestions((prev) => prev.filter((q) => q.id !== id))
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

  const handleSubmitQuestions = async (e: React.FormEvent) => {
    e.preventDefault()

    if (pendingQuestions.length === 0) {
      toast.error('Vui lòng thêm ít nhất một câu hỏi')
      return
    }

    // Validate all questions
    for (const q of pendingQuestions) {
      if (!q.content.trim()) {
        toast.error(`Câu hỏi #${q.orderIndex}: vui lòng nhập nội dung`)
        return
      }
      if (q.questionType === 'INSERT_DATA' && !q.correctQuery?.trim()) {
        toast.error(
          `Câu hỏi #${q.orderIndex} (INSERT DATA): vui lòng nhập script đáp án chuẩn trước khi tạo rubric AI`
        )
        return
      }
      if (!q.points || q.points <= 0) {
        toast.error(`Câu hỏi #${q.orderIndex}: điểm phải lớn hơn 0`)
        return
      }
    }

    // Prepare batch request (excluding the temporary id)
    const questionsToCreate = pendingQuestions.map((q) => ({
      content: q.content,
      correctQuery: q.correctQuery,
      verifyScript: q.verifyScript,
      points: q.points,
      orderIndex: q.orderIndex,
      questionType: q.questionType,
      difficultyLevel: q.difficultyLevel,
      gradingRubric: q.rubricData ? JSON.stringify(q.rubricData) : undefined
    }))

    const result = await callApi(
      createExamQuestionsBatch(examId, { questions: questionsToCreate }),
      false
    )

    if (result.data) {
      setQuestions((prev) => [...prev, ...result.data!.questions])
      setPendingQuestions([])
      setShowAddForm(false)
      toast.success(`${result.data.totalCreated} câu hỏi được tạo thành công`)
    }
  }

  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0)
  const pendingTotalPoints = pendingQuestions.reduce(
    (sum, q) => sum + q.points,
    0
  )

  return (
    <div className="space-y-8">
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

        {variant === 'embedded' && !showAddForm && (
          <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
            <Button
              className="gap-2"
              onClick={() => {
                setShowAddForm(true)
                if (pendingQuestions.length === 0) {
                  addEmptyQuestion()
                }
              }}
            >
              <Plus className="h-4 w-4" />
              Thêm câu hỏi
            </Button>
          </div>
        )}

        {variant === 'standalone' && !showAddForm && (
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
                onClick={() => {
                  setShowAddForm(true)
                  if (pendingQuestions.length === 0) {
                    addEmptyQuestion()
                  }
                }}
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

      {/* Add questions form (batch) */}
      {showAddForm && (
        <form onSubmit={handleSubmitQuestions} className="space-y-6">
          {/* Form Header */}
          <div className="flex items-center justify-between bg-muted/30 p-4 rounded-xl border border-border">
            <div>
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                Thêm câu hỏi mới
                <span className="bg-sub-primary/10 text-sub-primary text-xs px-2.5 py-0.5 rounded-full font-medium">
                  {pendingQuestions.length} câu
                </span>
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Biên soạn nội dung, đáp án và cấu hình chấm điểm cho từng câu
                hỏi.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={addEmptyQuestion}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Thêm câu hỏi
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => {
                  setPendingQuestions([])
                  setShowAddForm(false)
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Pending Questions List (Cards instead of Table) */}
          {pendingQuestions.length > 0 && (
            <div className="space-y-6">
              {pendingQuestions.map((q, idx) => (
                <div
                  key={q.id}
                  className="rounded-xl border border-border bg-card shadow-sm overflow-hidden transition-all hover:shadow-md"
                >
                  {/* Card Header */}
                  <div className="flex flex-wrap items-center justify-between gap-4 bg-muted/20 px-5 py-3 border-b border-border">
                    <div className="flex items-center gap-4">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sub-primary/10 text-sm font-bold text-sub-primary">
                        {idx + 1}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground">
                          Loại:
                        </span>
                        <select
                          value={q.questionType}
                          onChange={(e) =>
                            updateQuestion(q.id, {
                              questionType: e.target.value
                            })
                          }
                          className="rounded-md border border-border bg-sub-background px-3 py-1.5 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          {QUESTION_TYPES.map((t) => (
                            <option key={t.value} value={t.value}>
                              {t.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-muted-foreground">
                          Điểm:
                        </label>
                        <input
                          type="number"
                          value={q.points}
                          onChange={(e) =>
                            updateQuestion(q.id, {
                              points: Number(e.target.value)
                            })
                          }
                          min={0.5}
                          step={0.5}
                          className="w-16 rounded-md border border-border bg-sub-background px-2 py-1.5 text-sm text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-muted-foreground">
                          Độ khó:
                        </label>
                        <input
                          type="number"
                          value={q.difficultyLevel ?? 1}
                          onChange={(e) =>
                            updateQuestion(q.id, {
                              difficultyLevel: Number(e.target.value)
                            })
                          }
                          min={1}
                          max={5}
                          className="w-16 rounded-md border border-border bg-sub-background px-2 py-1.5 text-sm text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                      </div>
                      <div className="h-5 w-px bg-border mx-1"></div>
                      <button
                        type="button"
                        onClick={() => removeQuestion(q.id)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                        title="Xóa câu hỏi"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 space-y-6">
                    {/* Content */}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-foreground">
                        Nội dung đề bài
                      </label>
                      <div className="rounded-md border border-border overflow-hidden">
                        <RichTextEditor
                          content={q.content}
                          onChange={(html) =>
                            updateQuestion(q.id, {
                              content: html
                            })
                          }
                          placeholder="Mô tả yêu cầu câu hỏi..."
                          minHeight="120px"
                        />
                      </div>
                    </div>

                    {/* SQL Editors */}
                    <div
                      className={`grid gap-5 ${
                        [
                          'CREATE_TABLE',
                          'INSERT_DATA',
                          'SELECT_QUERY'
                        ].includes(q.questionType)
                          ? 'grid-cols-1'
                          : 'grid-cols-1 lg:grid-cols-2'
                      }`}
                    >
                      <div className="space-y-2">
                        <label className="flex items-center justify-between text-sm font-semibold text-foreground">
                          <span className="flex items-center gap-1.5">
                            <Code2 className="h-4 w-4 text-sub-primary" />
                            Đáp án (Correct Query)
                          </span>
                        </label>
                        {q.questionType === 'CREATE_TABLE' && (
                          <CreateTableQueryFromSpec
                            specification={specification}
                            onApply={(sql) =>
                              updateQuestion(q.id, {
                                correctQuery: sql
                              })
                            }
                          />
                        )}
                        {q.questionType === 'INSERT_DATA' && (
                          <InsertQueryFromSpec
                            specification={specification}
                            onApply={(sql) =>
                              updateQuestion(q.id, {
                                correctQuery: sql
                              })
                            }
                          />
                        )}
                        <div className="h-[160px] overflow-hidden rounded-md border border-border bg-sub-background">
                          <TeacherSqlEditor
                            value={q.correctQuery}
                            onChange={(value) =>
                              updateQuestion(q.id, {
                                correctQuery: value || ''
                              })
                            }
                            height="100%"
                          />
                        </div>
                        {!q.correctQuery &&
                          q.questionType !== 'INSERT_DATA' && (
                            <p className="flex items-center gap-1.5 text-[11px] text-sub-primary italic">
                              <Sparkles className="h-3 w-3" />
                              AI sẽ tự động tạo đáp án dựa trên nội dung đề bài
                            </p>
                          )}
                        {!q.correctQuery &&
                          q.questionType === 'INSERT_DATA' && (
                            <p className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 italic">
                              <Sparkles className="h-3 w-3" />
                              Câu INSERT DATA cần script đáp án chuẩn để AI tạo
                              rubric chấm điểm chính xác
                            </p>
                          )}
                      </div>
                      {![
                        'CREATE_TABLE',
                        'INSERT_DATA',
                        'SELECT_QUERY'
                      ].includes(q.questionType) && (
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
                                updateQuestion(q.id, {
                                  verifyScript: value || ''
                                })
                              }
                              height="100%"
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

                    {/* Rubric Editors */}
                    {(q.questionType === 'CREATE_TABLE' ||
                      q.questionType === 'INSERT_DATA' ||
                      q.questionType === 'SELECT_QUERY') && (
                      <div className="rounded-lg border border-sub-primary/20 p-4 space-y-4">
                        <h4 className="flex items-center gap-2 text-sm font-bold text-sub-primary">
                          <Sparkles className="h-4 w-4" />
                          Cấu hình quy tắc chấm điểm
                        </h4>
                        {q.questionType === 'CREATE_TABLE' && (
                          <div className="space-y-4">
                            <CreateTableRubricEditor
                              totalPoints={q.points}
                              rubric={q.rubricData ?? null}
                              onChange={(rubric) =>
                                updateQuestion(q.id, {
                                  rubricData: rubric
                                })
                              }
                              correctQuery={q.correctQuery}
                              questionContent={q.content}
                            />
                            <div className="mt-4 pt-4 border-t border-sub-primary/10">
                              <h4 className="flex items-center gap-2 text-sm font-bold text-amber-600 dark:text-amber-400 mb-3">
                                <Play className="h-4 w-4" />
                                Vùng chấm thử
                              </h4>
                              <RubricTestGrader
                                rubric={q.rubricData ?? null}
                                correctQuery={q.correctQuery}
                              />
                            </div>
                          </div>
                        )}
                        {q.questionType === 'INSERT_DATA' && (
                          <div className="space-y-4">
                            <InsertDataRubricEditor
                              examId={examId}
                              totalPoints={q.points}
                              rubric={q.rubricData ?? null}
                              onChange={(rubric) =>
                                updateQuestion(q.id, {
                                  rubricData: rubric
                                })
                              }
                              correctQuery={q.correctQuery}
                              questionContent={q.content}
                            />
                            <div className="mt-4 pt-4 border-t border-emerald-500/10">
                              <h4 className="flex items-center gap-2 text-sm font-bold text-amber-600 dark:text-amber-400 mb-3">
                                <Play className="h-4 w-4" />
                                Vùng giả lập chấm thi INSERT
                              </h4>
                              <InsertDataTestGrader
                                rubric={q.rubricData ?? null}
                                correctQuery={q.correctQuery}
                                examId={examId}
                              />
                            </div>
                          </div>
                        )}
                        {q.questionType === 'SELECT_QUERY' && (
                          <div className="space-y-4">
                            <SelectQueryRubricEditor
                              examId={examId}
                              totalPoints={q.points}
                              rubric={q.rubricData ?? null}
                              onChange={(rubric) =>
                                updateQuestion(q.id, {
                                  rubricData: rubric
                                })
                              }
                              correctQuery={q.correctQuery}
                              questionContent={q.content}
                              contextQueries={[
                                ...questions
                                  .filter(
                                    (item) =>
                                      item.id !== Number(q.id) &&
                                      (item.questionType === 'CREATE_TABLE' ||
                                        item.questionType === 'INSERT_DATA') &&
                                      Boolean(item.correctQuery?.trim())
                                  )
                                  .map((item) => ({
                                    questionType: item.questionType,
                                    content: item.content,
                                    correctQuery: item.correctQuery
                                  })),
                                ...pendingQuestions
                                  .filter(
                                    (item) =>
                                      item.id !== q.id &&
                                      (item.questionType === 'CREATE_TABLE' ||
                                        item.questionType === 'INSERT_DATA') &&
                                      Boolean(item.correctQuery?.trim())
                                  )
                                  .map((item) => ({
                                    questionType: item.questionType,
                                    content: item.content,
                                    correctQuery: item.correctQuery
                                  }))
                              ]}
                              dependencyOptions={[
                                ...questions.map((existingQ) => ({
                                  value: String(existingQ.id),
                                  label: `#${existingQ.orderIndex} - Câu đã lưu`
                                })),
                                ...pendingQuestions
                                  .filter((other) => other.id !== q.id)
                                  .map((other) => ({
                                    value: other.id,
                                    label: `#${other.orderIndex} - Câu đang tạo`
                                  }))
                              ]}
                            />
                            <div className="mt-4 pt-4 border-t border-violet-500/10">
                              <h4 className="flex items-center gap-2 text-sm font-bold text-amber-600 dark:text-amber-400 mb-3">
                                <Play className="h-4 w-4" />
                                Vùng chấm thử SELECT
                              </h4>
                              <SelectQueryTestGrader
                                examId={examId}
                                rubric={q.rubricData ?? null}
                                correctQuery={q.correctQuery}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Form Actions (Sticky Bottom Bar) */}
          <div className="sticky bottom-4 z-10 flex items-center justify-between rounded-xl border border-border bg-sub-background/95 backdrop-blur supports-backdrop-filter:bg-sub-background/80 p-4 shadow-lg">
            <div className="flex items-center gap-4">
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-foreground">
                  Tổng kết
                </span>
                <span className="text-xs text-muted-foreground">
                  {pendingQuestions.length} câu hỏi · {pendingTotalPoints} điểm
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addEmptyQuestion}
                className="gap-2 ml-4"
              >
                <Plus className="h-4 w-4" />
                Thêm câu hỏi nữa
              </Button>
            </div>

            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setPendingQuestions([])
                  setShowAddForm(false)
                }}
              >
                Hủy bỏ
              </Button>
              <Button
                type="submit"
                disabled={isLoading || pendingQuestions.length === 0}
                className="gap-2 min-w-[140px]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    {`Lưu ${pendingQuestions.length} câu`}
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* Questions list */}
      {questions.length === 0 && !showAddForm ? (
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
