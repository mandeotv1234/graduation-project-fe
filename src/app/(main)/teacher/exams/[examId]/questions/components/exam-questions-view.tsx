'use client'

import { formatDateTime } from '@/lib/utils/time'
import {
  ArrowRight,
  Code2,
  Hash,
  Loader2,
  Play,
  Plus,
  Save,
  Settings,
  Share2,
  Sparkles,
  Terminal,
  Trash2,
  Users
} from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { RichTextEditor } from '@/components/shared/rich-text-editor'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
  SpecificationDataset,
  SpecificationDetailResponse,
  SpecificationSchemaJsonTable,
  TeacherExamTemplateVersionsResponse,
  UpdateExamQuestionRequest
} from '@/lib/types'
import { CreateTableQueryFromSpec } from './create-table-query-from-spec'
import {
  generateCreateTableQuestionFromSchema,
  sanitizeSchemaTables
} from './create-table-question-generator'
import { CreateTableRubricEditor } from './create-table-rubric-editor'
import {
  generateInsertDataQuestionFromDataset,
  getDatasetTableNames
} from './insert-data-question-generator'
import { InsertDataRubricEditor } from './insert-data-rubric-editor'
import { InsertDataTestGrader } from './insert-data-test-grader'
import { InsertQueryFromSpec } from './insert-query-from-spec'
import { QuestionItem } from './question-item'
import { RubricTestGrader } from './rubric-test-grader'
import { SelectQueryRubricEditor } from './select-query-rubric-editor'
import { SelectQueryTestGrader } from './select-query-test-grader'
import { TeacherSqlEditor } from './teacher-sql-editor'

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
  examTitle: string
  initialQuestions: ExamQuestionItem[]
  specification?: ExamSpecification | SpecificationDetailResponse | null
  templateManagement: TeacherExamTemplateVersionsResponse | null
  canShareTemplate: boolean
  shareDisabledReason?: string
  variant?: 'standalone' | 'embedded'
  specificationSchemaJson?: string | SpecificationSchemaJsonTable[] | null
  specificationDatasets?: SpecificationDataset[] | null
}

interface QuestionFormState extends CreateExamQuestionBatch {
  id: string // temp id for form
  rubricData?: GradingRubric | null
  wizardStep?: number
}

function formatVersionTimestamp(value?: string) {
  return formatDateTime(value)
}

export function ExamQuestionsView({
  examId,
  examTitle,
  initialQuestions,
  specification = null,
  templateManagement,
  canShareTemplate,
  shareDisabledReason,
  variant = 'standalone',
  specificationSchemaJson,
  specificationDatasets
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
  const [createTableSelections, setCreateTableSelections] = useState<
    Record<string, string[]>
  >({})
  const [createTableOptions, setCreateTableOptions] = useState<
    Record<string, { includeForeignKeys: boolean }>
  >({})
  const [createTableModalOpen, setCreateTableModalOpen] = useState<
    Record<string, boolean>
  >({})
  const [insertDataModalOpen, setInsertDataModalOpen] = useState<
    Record<string, boolean>
  >({})
  const [insertDataSelections, setInsertDataSelections] = useState<
    Record<string, string>
  >({})
  const [insertDataTableSelections, setInsertDataTableSelections] = useState<
    Record<string, string[]>
  >({})
  const availableSchemaTables = useMemo(() => {
    try {
      const parsed =
        typeof specificationSchemaJson === 'string'
          ? JSON.parse(specificationSchemaJson || '[]')
          : specificationSchemaJson || []
      return sanitizeSchemaTables(parsed)
    } catch {
      return []
    }
  }, [specificationSchemaJson])
  const availableDatasets = useMemo(
    () =>
      (specificationDatasets || []).filter(
        (dataset) => !!dataset.dataScript?.trim()
      ),
    [specificationDatasets]
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
      rubricData: null,
      wizardStep: 1
    }
    setPendingQuestions((prev) => [...prev, newQuestion])
  }

  const updateQuestion = (id: string, updates: Partial<QuestionFormState>) => {
    setPendingQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, ...updates } : q))
    )
  }

  const removeQuestion = (id: string) => {
    setPendingQuestions((prev) => {
      const next = prev.filter((q) => q.id !== id)
      if (next.length === 0) {
        setShowAddForm(false)
      }
      return next
    })
    setCreateTableSelections((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
    setCreateTableOptions((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
    setCreateTableModalOpen((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
    setInsertDataModalOpen((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
    setInsertDataSelections((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
    setInsertDataTableSelections((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  const toggleCreateTableSelection = (
    questionId: string,
    tableName: string,
    checked: boolean
  ) => {
    setCreateTableSelections((prev) => {
      const existing = prev[questionId] || []
      const nextValues = checked
        ? [...existing, tableName]
        : existing.filter((name) => name !== tableName)
      return { ...prev, [questionId]: nextValues }
    })
  }

  const selectAllCreateTables = (questionId: string) => {
    setCreateTableSelections((prev) => ({
      ...prev,
      [questionId]: availableSchemaTables.map((table) => table.tableName)
    }))
  }

  const clearAllCreateTables = (questionId: string) => {
    setCreateTableSelections((prev) => ({ ...prev, [questionId]: [] }))
  }

  const updateCreateTableOption = (
    questionId: string,
    key: 'includeForeignKeys',
    value: boolean
  ) => {
    setCreateTableOptions((prev) => ({
      ...prev,
      [questionId]: {
        includeForeignKeys:
          key === 'includeForeignKeys'
            ? value
            : (prev[questionId]?.includeForeignKeys ?? true)
      }
    }))
  }

  const handleAutoGenerateCreateTableQuestion = (questionId: string) => {
    const selected = createTableSelections[questionId] || []
    if (selected.length === 0) {
      toast.error('Vui lòng chọn ít nhất một bảng để sinh câu hỏi')
      return
    }
    const options = createTableOptions[questionId] || {
      includeForeignKeys: true
    }
    const generated = generateCreateTableQuestionFromSchema(
      availableSchemaTables,
      selected,
      options
    )
    if (!generated.content || !generated.correctQuery) {
      toast.error('Không thể sinh câu hỏi từ schema hiện tại')
      return
    }
    updateQuestion(questionId, {
      content: generated.content,
      correctQuery: generated.correctQuery,
      questionType: 'CREATE_TABLE'
    })
    toast.success('Đã tự sinh nội dung và đáp án cho câu CREATE TABLE')
    setCreateTableModalOpen((prev) => ({ ...prev, [questionId]: false }))
  }

  const handleQuestionTypeChange = (questionId: string, nextType: string) => {
    updateQuestion(questionId, { questionType: nextType, wizardStep: 1 })
    if (nextType === 'CREATE_TABLE') {
      setCreateTableModalOpen((prev) => ({ ...prev, [questionId]: true }))
    }
    if (nextType === 'INSERT_DATA') {
      const defaultDataset = availableDatasets[0]
      const defaultTable = defaultDataset
        ? getDatasetTableNames(defaultDataset)[0] || ''
        : ''
      setInsertDataModalOpen((prev) => ({ ...prev, [questionId]: true }))
      setInsertDataSelections((prev) => ({
        ...prev,
        [questionId]: prev[questionId] || defaultDataset?.name || ''
      }))
      setInsertDataTableSelections((prev) => ({
        ...prev,
        [questionId]: prev[questionId] || (defaultTable ? [defaultTable] : [])
      }))
    }
  }

  const handleAutoGenerateInsertDataQuestion = (questionId: string) => {
    const selectedDatasetName = insertDataSelections[questionId]
    if (!selectedDatasetName) {
      toast.error('Vui lòng chọn một dataset để sinh câu hỏi INSERT DATA')
      return
    }
    const dataset = availableDatasets.find(
      (item) => item.name === selectedDatasetName
    )
    if (!dataset) {
      toast.error('Không tìm thấy dataset đã chọn')
      return
    }
    const selectedTableNames = insertDataTableSelections[questionId] || []
    const generated = generateInsertDataQuestionFromDataset(
      dataset,
      selectedTableNames
    )
    if (!generated.content || !generated.correctQuery) {
      toast.error('Dataset chưa có data script để sinh đáp án')
      return
    }
    updateQuestion(questionId, {
      content: generated.content,
      correctQuery: generated.correctQuery,
      questionType: 'INSERT_DATA'
    })
    toast.success('Đã tự sinh nội dung và đáp án cho câu INSERT DATA')
    setInsertDataModalOpen((prev) => ({ ...prev, [questionId]: false }))
  }

  const selectAllInsertTables = (questionId: string, tableNames: string[]) => {
    setInsertDataTableSelections((prev) => ({
      ...prev,
      [questionId]: tableNames
    }))
  }

  const clearAllInsertTables = (questionId: string) => {
    setInsertDataTableSelections((prev) => ({ ...prev, [questionId]: [] }))
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

  const handleSubmitSingleQuestion = async (questionId: string) => {
    const q = pendingQuestions.find((item) => item.id === questionId)
    if (!q) return

    if (!q.content.trim()) {
      toast.error('Vui lòng nhập nội dung câu hỏi')
      return
    }
    if (!q.correctQuery?.trim()) {
      toast.error('Vui lòng nhập đáp án chuẩn trước khi lưu')
      return
    }
    if (q.questionType === 'INSERT_DATA' && !q.correctQuery?.trim()) {
      toast.error(
        'Câu INSERT DATA cần script đáp án chuẩn trước khi tạo rubric AI'
      )
      return
    }
    if (!q.points || q.points <= 0) {
      toast.error('Điểm phải lớn hơn 0')
      return
    }

    const payload = {
      questions: [
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
    }

    const result = await callApi(
      createExamQuestionsBatch(examId, payload),
      false
    )
    const createdQuestions = result.data?.questions ?? []
    if (createdQuestions.length > 0) {
      setQuestions((prev) => [...prev, ...createdQuestions])
      setPendingQuestions((prev) =>
        prev.filter((item) => item.id !== questionId)
      )
      setShowAddForm(false)
      toast.success('Đã tạo câu hỏi thành công')
    }
  }

  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-3 pt-3 pb-1 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 pl-3">
          <div>
            {variant === 'embedded' ? (
              <h2 className="text-xl font-bold tracking-tight text-foreground md:text-2xl">
                Danh sách câu hỏi
              </h2>
            ) : (
              <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-title">
                Danh sách câu hỏi
              </h1>
            )}
            <div className="mt-1 flex flex-wrap items-center gap-2 text-muted-foreground">
              <p className="text-sm">
                {examTitle} · {questions.length} câu · {totalPoints} điểm
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
        <div className="space-y-6">
          {/* Pending Questions List (Cards instead of Table) */}
          {pendingQuestions.length > 0 && (
            <div className="space-y-6">
              {pendingQuestions.slice(0, 1).map((q, idx) => {
                const step = q.wizardStep || 1
                const hasWizard = [
                  'CREATE_TABLE',
                  'INSERT_DATA',
                  'SELECT_QUERY'
                ].includes(q.questionType)
                const stepItems = hasWizard
                  ? [
                      { step: 1, label: 'Nội dung & đáp án' },
                      { step: 2, label: 'Cấu hình kỳ vọng' },
                      { step: 3, label: 'Quy tắc chấm điểm' },
                      { step: 4, label: 'Hoàn tất' }
                    ]
                  : [
                      { step: 1, label: 'Nội dung & đáp án' },
                      { step: 4, label: 'Hoàn tất' }
                    ]

                return (
                  <div
                    key={q.id}
                    className="rounded-xl border border-border bg-card shadow-sm overflow-hidden transition-all hover:shadow-md"
                  >
                    <Dialog
                      open={createTableModalOpen[q.id] ?? false}
                      onOpenChange={(open) =>
                        setCreateTableModalOpen((prev) => ({
                          ...prev,
                          [q.id]: open
                        }))
                      }
                    >
                      <DialogContent className="sm:max-w-xl">
                        <DialogHeader>
                          <DialogTitle>
                            Sinh câu CREATE TABLE từ schema
                          </DialogTitle>
                          <DialogDescription>
                            Chọn bảng và bấm sinh để tự điền nội dung đề bài và
                            đáp án chuẩn.
                          </DialogDescription>
                        </DialogHeader>
                        {availableSchemaTables.length === 0 ? (
                          <p className="rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                            Chưa có schemaJson trong đặc tả của đề thi để sinh
                            tự động.
                          </p>
                        ) : (
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-xs font-medium text-muted-foreground">
                                  Chọn bảng cần tạo
                                </p>
                                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <input
                                    type="checkbox"
                                    checked={
                                      availableSchemaTables.length > 0 &&
                                      (createTableSelections[q.id] || [])
                                        .length === availableSchemaTables.length
                                    }
                                    onChange={(event) => {
                                      if (event.target.checked) {
                                        selectAllCreateTables(q.id)
                                      } else {
                                        clearAllCreateTables(q.id)
                                      }
                                    }}
                                  />
                                  Chọn tất cả
                                </label>
                              </div>
                              <div className="max-h-56 space-y-2 overflow-y-auto rounded-md border bg-muted/20 p-3">
                                {availableSchemaTables.map((table) => {
                                  const checked = (
                                    createTableSelections[q.id] || []
                                  ).includes(table.tableName)
                                  return (
                                    <label
                                      key={`${q.id}-${table.tableName}`}
                                      className="flex items-center gap-2 rounded px-1 py-1 text-sm hover:bg-background/80"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={(event) =>
                                          toggleCreateTableSelection(
                                            q.id,
                                            table.tableName,
                                            event.target.checked
                                          )
                                        }
                                      />
                                      {table.tableName}
                                    </label>
                                  )
                                })}
                              </div>
                            </div>
                            <div className="rounded-md border bg-background px-3 py-2">
                              <label className="flex items-center gap-2 text-sm">
                                <input
                                  type="checkbox"
                                  checked={
                                    createTableOptions[q.id]
                                      ?.includeForeignKeys ?? true
                                  }
                                  onChange={(event) =>
                                    updateCreateTableOption(
                                      q.id,
                                      'includeForeignKeys',
                                      event.target.checked
                                    )
                                  }
                                />
                                Bao gồm khóa ngoại
                              </label>
                            </div>
                          </div>
                        )}
                        <DialogFooter>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                              setCreateTableModalOpen((prev) => ({
                                ...prev,
                                [q.id]: false
                              }))
                            }
                          >
                            Đóng
                          </Button>
                          <Button
                            type="button"
                            onClick={() =>
                              handleAutoGenerateCreateTableQuestion(q.id)
                            }
                            disabled={availableSchemaTables.length === 0}
                          >
                            Sinh nội dung và đáp án
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    <Dialog
                      open={insertDataModalOpen[q.id] ?? false}
                      onOpenChange={(open) =>
                        setInsertDataModalOpen((prev) => ({
                          ...prev,
                          [q.id]: open
                        }))
                      }
                    >
                      <DialogContent className="sm:max-w-xl">
                        <DialogHeader>
                          <DialogTitle>
                            Sinh câu INSERT DATA từ dataset
                          </DialogTitle>
                          <DialogDescription>
                            Chọn một dataset để tự điền nội dung đề bài và đáp
                            án chuẩn.
                          </DialogDescription>
                        </DialogHeader>
                        {availableDatasets.length === 0 ? (
                          <p className="rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                            Chưa có dataset có data script trong đặc tả của đề
                            thi.
                          </p>
                        ) : (
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-muted-foreground">
                              Chọn dataset
                            </p>
                            <select
                              value={insertDataSelections[q.id] || ''}
                              onChange={(event) => {
                                const nextDatasetName = event.target.value
                                setInsertDataSelections((prev) => ({
                                  ...prev,
                                  [q.id]: nextDatasetName
                                }))
                                const nextDataset = availableDatasets.find(
                                  (dataset) => dataset.name === nextDatasetName
                                )
                                const nextTableName = nextDataset
                                  ? getDatasetTableNames(nextDataset)[0] || ''
                                  : ''
                                setInsertDataTableSelections((prev) => ({
                                  ...prev,
                                  [q.id]: nextTableName ? [nextTableName] : []
                                }))
                              }}
                              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                              <option value="" disabled>
                                -- Chọn dataset --
                              </option>
                              {availableDatasets.map((dataset) => (
                                <option
                                  key={`${q.id}-${dataset.id ?? dataset.name}`}
                                  value={dataset.name}
                                >
                                  {dataset.name}
                                </option>
                              ))}
                            </select>
                            {(() => {
                              const selectedDatasetName =
                                insertDataSelections[q.id]
                              const selectedDataset = availableDatasets.find(
                                (dataset) =>
                                  dataset.name === selectedDatasetName
                              )
                              const tableNames = selectedDataset
                                ? getDatasetTableNames(selectedDataset)
                                : []
                              if (tableNames.length === 0) return null

                              return (
                                <div className="pt-2 space-y-2">
                                  <div className="flex items-center justify-between gap-2">
                                    <p className="text-xs font-medium text-muted-foreground">
                                      Chọn table trong dataset
                                    </p>
                                    <label className="flex items-center gap-2 text-xs text-muted-foreground">
                                      <input
                                        type="checkbox"
                                        checked={
                                          tableNames.length > 0 &&
                                          (
                                            insertDataTableSelections[q.id] ||
                                            []
                                          ).length === tableNames.length
                                        }
                                        onChange={(event) => {
                                          if (event.target.checked) {
                                            selectAllInsertTables(
                                              q.id,
                                              tableNames
                                            )
                                          } else {
                                            clearAllInsertTables(q.id)
                                          }
                                        }}
                                      />
                                      Chọn tất cả
                                    </label>
                                  </div>
                                  <div className="max-h-40 space-y-2 overflow-y-auto rounded-md border bg-muted/20 p-3">
                                    {tableNames.map((tableName) => {
                                      const selectedTables =
                                        insertDataTableSelections[q.id] || []
                                      const checked =
                                        selectedTables.includes(tableName)
                                      return (
                                        <label
                                          key={`${q.id}-${selectedDatasetName}-${tableName}`}
                                          className="flex items-center gap-2 rounded px-1 py-1 text-sm hover:bg-background/80"
                                        >
                                          <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={(event) => {
                                              setInsertDataTableSelections(
                                                (prev) => {
                                                  const existing =
                                                    prev[q.id] || []
                                                  let nextValues = existing
                                                  if (event.target.checked) {
                                                    nextValues = [
                                                      ...existing,
                                                      tableName
                                                    ]
                                                  } else {
                                                    nextValues =
                                                      existing.filter(
                                                        (name) =>
                                                          name !== tableName
                                                      )
                                                  }
                                                  return {
                                                    ...prev,
                                                    [q.id]: nextValues
                                                  }
                                                }
                                              )
                                            }}
                                          />
                                          {tableName}
                                        </label>
                                      )
                                    })}
                                  </div>
                                </div>
                              )
                            })()}
                          </div>
                        )}
                        <DialogFooter>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                              setInsertDataModalOpen((prev) => ({
                                ...prev,
                                [q.id]: false
                              }))
                            }
                          >
                            Đóng
                          </Button>
                          <Button
                            type="button"
                            onClick={() =>
                              handleAutoGenerateInsertDataQuestion(q.id)
                            }
                            disabled={availableDatasets.length === 0}
                          >
                            Sinh nội dung và đáp án
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

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
                              handleQuestionTypeChange(q.id, e.target.value)
                            }
                            disabled={step === 4}
                            className="rounded-md border border-border bg-sub-background px-3 py-1.5 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            {QUESTION_TYPES.map((t) => (
                              <option key={t.value} value={t.value}>
                                {t.label}
                              </option>
                            ))}
                          </select>
                          {q.questionType === 'CREATE_TABLE' && (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={step === 4}
                              onClick={() =>
                                setCreateTableModalOpen((prev) => ({
                                  ...prev,
                                  [q.id]: true
                                }))
                              }
                            >
                              Mở modal CREATE
                            </Button>
                          )}
                          {q.questionType === 'INSERT_DATA' && (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={step === 4}
                              onClick={() =>
                                setInsertDataModalOpen((prev) => ({
                                  ...prev,
                                  [q.id]: true
                                }))
                              }
                            >
                              Mở modal INSERT
                            </Button>
                          )}
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
                            readOnly={step === 4}
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
                            readOnly={step === 4}
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

                    <div className="border-b border-border/70 bg-card/40 px-5 py-4 overflow-x-auto">
                      <ol className="flex min-w-fit items-center">
                        {stepItems.map((item, itemIndex) => (
                          <li
                            key={`${q.id}-${item.step}`}
                            className={`relative flex items-center ${
                              itemIndex !== stepItems.length - 1 ? 'flex-1' : ''
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                if (
                                  item.step > step &&
                                  step === 1 &&
                                  (!q.content?.trim() ||
                                    !q.correctQuery?.trim())
                                ) {
                                  toast.error(
                                    'Vui lòng nhập nội dung đề bài và đáp án chuẩn trước khi qua bước tiếp theo'
                                  )
                                  return
                                }
                                updateQuestion(q.id, { wizardStep: item.step })
                              }}
                              className="group inline-flex items-center"
                            >
                              <span
                                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-semibold transition-all ${
                                  step === item.step
                                    ? 'border-primary bg-primary text-primary-foreground'
                                    : step > item.step
                                      ? 'border-primary bg-primary/10 text-primary'
                                      : 'border-muted-foreground/30 bg-muted text-muted-foreground group-hover:border-primary/50'
                                }`}
                              >
                                {item.step}
                              </span>
                              <span
                                className={`ml-3 hidden whitespace-nowrap text-sm sm:block ${
                                  step === item.step
                                    ? 'font-semibold text-foreground'
                                    : step > item.step
                                      ? 'text-primary'
                                      : 'text-muted-foreground'
                                }`}
                              >
                                {item.label}
                              </span>
                            </button>
                            {itemIndex !== stepItems.length - 1 && (
                              <div className="mx-4 h-px min-w-8 flex-1 bg-border/70" />
                            )}
                          </li>
                        ))}
                      </ol>
                    </div>

                    {/* Card Body */}
                    <div className="p-5 space-y-6">
                      {(step === 1 || step === 4) && (
                        <>
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
                                editable={step !== 4}
                              />
                            </div>
                          </div>

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
                                  Đáp án
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
                                  readOnly={step === 4}
                                />
                              </div>
                              {!q.correctQuery &&
                                q.questionType === 'INSERT_DATA' && (
                                  <p className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 italic">
                                    <Sparkles className="h-3 w-3" />
                                    Câu INSERT DATA cần script đáp án chuẩn để
                                    AI tạo rubric
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
                                    readOnly={step === 4}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </>
                      )}

                      {(step === 2 || step === 3) && hasWizard && (
                        <div className="rounded-lg border border-sub-primary/20 p-4 space-y-4">
                          <h4 className="flex items-center gap-2 text-sm font-bold text-sub-primary">
                            <Sparkles className="h-4 w-4" />
                            {step === 2
                              ? 'Bước 2: Cấu hình kỳ vọng'
                              : 'Bước 3: Thiết lập quy tắc chấm điểm'}
                          </h4>
                          {q.questionType === 'CREATE_TABLE' && (
                            <CreateTableRubricEditor
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
                              wizardStep={step}
                            />
                          )}
                          {q.questionType === 'INSERT_DATA' && (
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
                              wizardStep={step}
                            />
                          )}
                          {q.questionType === 'SELECT_QUERY' && (
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
                              wizardStep={step}
                            />
                          )}
                        </div>
                      )}

                      {step === 4 &&
                        (q.questionType === 'CREATE_TABLE' ||
                          q.questionType === 'INSERT_DATA' ||
                          q.questionType === 'SELECT_QUERY') && (
                          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 space-y-3">
                            <h4 className="flex items-center gap-2 text-sm font-bold text-amber-600 dark:text-amber-400">
                              <Play className="h-4 w-4" />
                              Kiểm tra chấm điểm với câu truy vấn
                            </h4>
                            {q.questionType === 'CREATE_TABLE' && (
                              <RubricTestGrader
                                rubric={q.rubricData ?? null}
                                correctQuery={q.correctQuery}
                                totalPoints={q.points}
                              />
                            )}
                            {q.questionType === 'INSERT_DATA' && (
                              <InsertDataTestGrader
                                rubric={q.rubricData ?? null}
                                correctQuery={q.correctQuery}
                                examId={examId}
                                totalPoints={q.points}
                              />
                            )}
                            {q.questionType === 'SELECT_QUERY' && (
                              <SelectQueryTestGrader
                                examId={examId}
                                rubric={q.rubricData ?? null}
                                correctQuery={q.correctQuery}
                                totalPoints={q.points}
                              />
                            )}
                          </div>
                        )}
                    </div>

                    <div className="flex items-center justify-between gap-3 border-t border-border bg-muted/10 px-5 py-4">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          setPendingQuestions([])
                          setShowAddForm(false)
                        }}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        Hủy
                      </Button>
                      <div className="flex items-center gap-2">
                        {step > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              let prevStep = step - 1
                              if (prevStep === 3 && !hasWizard) prevStep = 1
                              updateQuestion(q.id, { wizardStep: prevStep })
                            }}
                          >
                            Quay lại
                          </Button>
                        )}
                        {step < 4 ? (
                          <Button
                            type="button"
                            onClick={() => {
                              if (
                                step === 1 &&
                                (!q.content?.trim() || !q.correctQuery?.trim())
                              ) {
                                toast.error(
                                  'Vui lòng nhập nội dung đề bài và đáp án chuẩn trước khi qua bước tiếp theo'
                                )
                                return
                              }
                              let nextStep = step + 1
                              if (nextStep === 2 && !hasWizard) nextStep = 4
                              updateQuestion(q.id, { wizardStep: nextStep })
                            }}
                          >
                            Bước tiếp theo
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            onClick={() => handleSubmitSingleQuestion(q.id)}
                            disabled={isLoading}
                          >
                            {isLoading ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Đang lưu...
                              </>
                            ) : (
                              <>
                                <Save className="mr-2 h-4 w-4" />
                                Hoàn tất và lưu câu hỏi
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
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
              specificationSchemaJson={specificationSchemaJson}
              specificationDatasets={specificationDatasets ?? []}
            />
          ))}
        </div>
      )}
    </div>
  )
}
