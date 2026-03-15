'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Plus,
  Hash,
  Award,
  CheckCircle,
  Save,
  X,
  Database,
  Trash2,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { createExamQuestionsBatch } from '@/lib/actions'
import { useApi } from '@/hooks/use-api'
import { ExamQuestionItem, CreateExamQuestionBatch } from '@/lib/types'
import { PATH } from '@/lib/constants'

const QUESTION_TYPES = [
  { value: 'CREATE_TABLE', label: 'CREATE TABLE' },
  { value: 'INSERT_DATA', label: 'INSERT DATA' },
  { value: 'SELECT_QUERY', label: 'SELECT QUERY' },
  { value: 'TRIGGER', label: 'TRIGGER' },
  { value: 'FUNCTION', label: 'FUNCTION' },
  { value: 'STORED_PROCEDURE', label: 'STORED PROCEDURE' }
]

const QUESTION_TYPE_COLORS: Record<string, string> = {
  CREATE_TABLE: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  INSERT_DATA: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  SELECT_QUERY: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  TRIGGER: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  FUNCTION: 'bg-pink-500/10 text-pink-600 dark:text-pink-400',
  STORED_PROCEDURE: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400'
}

interface ExamQuestionsViewProps {
  examId: number
  initialQuestions: ExamQuestionItem[]
}

interface QuestionFormState extends CreateExamQuestionBatch {
  id: string // temp id for form
}

export function ExamQuestionsView({
  examId,
  initialQuestions
}: ExamQuestionsViewProps) {
  const router = useRouter()
  const { callApi, isLoading } = useApi()
  const [questions, setQuestions] = useState(initialQuestions)
  const [showAddForm, setShowAddForm] = useState(false)

  // Batch form state — multiple questions
  const [pendingQuestions, setPendingQuestions] = useState<QuestionFormState[]>(
    []
  )

  const addEmptyQuestion = () => {
    const newQuestion: QuestionFormState = {
      id: Date.now().toString(),
      content: '',
      points: 1,
      orderIndex: questions.length + pendingQuestions.length + 1,
      questionType: 'CREATE_TABLE',
      difficultyLevel: 1
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
      if (!q.points || q.points <= 0) {
        toast.error(`Câu hỏi #${q.orderIndex}: điểm phải lớn hơn 0`)
        return
      }
    }

    // Prepare batch request (excluding the temporary id)
    const questionsToCreate = pendingQuestions.map((q) => ({
      content: q.content,
      points: q.points,
      orderIndex: q.orderIndex,
      questionType: q.questionType,
      difficultyLevel: q.difficultyLevel
    }))

    const result = await callApi(
      createExamQuestionsBatch(examId, { questions: questionsToCreate })
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Quản lý câu hỏi
            </h1>
            <p className="text-muted-foreground">
              Bài thi #{examId} · {questions.length} câu · {totalPoints} điểm
            </p>
          </div>
        </div>

        {!showAddForm && (
          <div className="flex items-center gap-2">
            <Link href={PATH.TEACHER_EXAM_SPECIFICATION(examId)}>
              <Button variant="outline" className="gap-2">
                <Database className="h-4 w-4" />
                Đặc tả CSDL
              </Button>
            </Link>
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
        )}
      </div>

      {/* Add questions form (batch) */}
      {showAddForm && (
        <form
          onSubmit={handleSubmitQuestions}
          className="rounded-xl border-2 border-primary/30 bg-card p-6 space-y-5 shadow-md"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Thêm câu hỏi ({pendingQuestions.length})
            </h2>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addEmptyQuestion}
                className="gap-1"
              >
                <Plus className="h-3 w-3" />
                Thêm hàng
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => {
                  setPendingQuestions([])
                  setShowAddForm(false)
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Questions table */}
          {pendingQuestions.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-border bg-muted/20">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-3 py-2 text-left font-semibold w-12">
                      STT
                    </th>
                    <th className="px-3 py-2 text-left font-semibold flex-1 min-w-[300px]">
                      Nội dung đề bài
                    </th>
                    <th className="px-3 py-2 text-left font-semibold w-24">
                      Loại
                    </th>
                    <th className="px-3 py-2 text-center font-semibold w-16">
                      Điểm
                    </th>
                    <th className="px-3 py-2 text-center font-semibold w-16">
                      Độ khó
                    </th>
                    <th className="px-3 py-2 text-center font-semibold w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {pendingQuestions.map((q, idx) => (
                    <tr
                      key={q.id}
                      className={`border-b border-border last:border-0 ${
                        idx % 2 === 0 ? '' : 'bg-muted/10'
                      }`}
                    >
                      <td className="px-3 py-2 text-muted-foreground font-medium">
                        {idx + 1}
                      </td>
                      <td className="px-3 py-2">
                        <textarea
                          value={q.content}
                          onChange={(e) =>
                            updateQuestion(q.id, { content: e.target.value })
                          }
                          placeholder="Mô tả yêu cầu câu hỏi..."
                          className="w-full rounded border border-border bg-background px-2 py-1 text-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                          rows={2}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={q.questionType}
                          onChange={(e) =>
                            updateQuestion(q.id, {
                              questionType: e.target.value
                            })
                          }
                          className="w-full rounded border border-border bg-background px-2 py-1 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                          {QUESTION_TYPES.map((t) => (
                            <option key={t.value} value={t.value}>
                              {t.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2">
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
                          className="w-full rounded border border-border bg-background px-2 py-1 text-xs text-center focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        />
                      </td>
                      <td className="px-3 py-2">
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
                          className="w-full rounded border border-border bg-background px-2 py-1 text-xs text-center focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeQuestion(q.id)}
                          className="inline-flex h-7 w-7 items-center justify-center rounded hover:bg-destructive/10 transition-colors"
                          title="Xóa"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Summary */}
          <div className="flex items-center justify-between text-sm rounded-lg border border-border bg-muted/30 px-3 py-2">
            <span className="text-muted-foreground">
              {pendingQuestions.length} câu hỏi · {pendingTotalPoints} điểm
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setPendingQuestions([])
                  setShowAddForm(false)
                }}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={isLoading || pendingQuestions.length === 0}
                className="gap-2"
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
            <div
              key={q.id}
              className="rounded-xl border border-border bg-card p-5 transition-all hover:shadow-sm"
            >
              <div className="flex items-start gap-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                  {q.orderIndex}
                </span>

                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${QUESTION_TYPE_COLORS[q.questionType] || 'bg-muted text-muted-foreground'}`}
                    >
                      {q.questionType}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                      <Award className="h-3 w-3" />
                      {q.points}đ
                    </span>
                  </div>

                  <p className="text-sm text-foreground whitespace-pre-wrap">
                    {q.content}
                  </p>

                  {/* answer view removed per GRAD-30 */}
                </div>

                <CheckCircle className="h-5 w-5 shrink-0 text-emerald-500" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
