'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Plus,
  Hash,
  Award,
  CheckCircle,
  Save,
  X
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { createExamQuestion } from '@/lib/actions'
import { useApi } from '@/hooks/use-api'
import { ExamQuestionItem } from '@/lib/types'

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

export function ExamQuestionsView({
  examId,
  initialQuestions
}: ExamQuestionsViewProps) {
  const router = useRouter()
  const { callApi, isLoading } = useApi()
  const [questions, setQuestions] = useState(initialQuestions)
  const [showAddForm, setShowAddForm] = useState(false)

  // Form state
  const [content, setContent] = useState('')
  const [points, setPoints] = useState(1)
  const [orderIndex, setOrderIndex] = useState(questions.length + 1)
  const [questionType, setQuestionType] = useState('CREATE_TABLE')
  // removed correctQuery and verifyScript fields per GRAD-30

  const resetForm = () => {
    setContent('')
    setPoints(1)
    setOrderIndex(questions.length + 2)
    setQuestionType('CREATE_TABLE')
    setShowAddForm(false)
  }

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!content.trim()) {
      toast.error('Vui lòng nhập nội dung câu hỏi')
      return
    }

    const result = await callApi(
      createExamQuestion(examId, {
        content,
        points,
        orderIndex,
        questionType,
        // backend still expects correctQuery field; send empty string since UI no longer collects it
        correctQuery: ''
      })
    )

    if (result.data) {
      setQuestions((prev) => [...prev, result.data!])
      resetForm()
    }
  }

  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0)

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
          <Button
            onClick={() => {
              setOrderIndex(questions.length + 1)
              setShowAddForm(true)
            }}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Thêm câu hỏi
          </Button>
        )}
      </div>

      {/* Add question form */}
      {showAddForm && (
        <form
          onSubmit={handleAddQuestion}
          className="rounded-xl border-2 border-primary/30 bg-card p-6 space-y-5 shadow-md"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Thêm câu hỏi mới
            </h2>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={resetForm}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Loại câu hỏi <span className="text-destructive">*</span>
              </label>
              <select
                value={questionType}
                onChange={(e) => setQuestionType(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {QUESTION_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Điểm <span className="text-destructive">*</span>
              </label>
              <input
                type="number"
                value={points}
                onChange={(e) => setPoints(Number(e.target.value))}
                min={0.5}
                step={0.5}
                className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Thứ tự
              </label>
              <input
                type="number"
                value={orderIndex}
                onChange={(e) => setOrderIndex(Number(e.target.value))}
                min={1}
                className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Nội dung đề bài <span className="text-destructive">*</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
              placeholder="Mô tả yêu cầu câu hỏi cho sinh viên..."
              className="flex w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              required
            />
          </div>

          {/* correctQuery and verifyScript removed per GRAD-30 */}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={resetForm}>
              Hủy
            </Button>
            <Button type="submit" disabled={isLoading} className="gap-2">
              <Save className="h-4 w-4" />
              {isLoading ? 'Đang lưu...' : 'Lưu câu hỏi'}
            </Button>
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
