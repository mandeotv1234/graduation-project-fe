'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  Plus,
  Hash,
  Award,
  Save,
  X,
  Database,
  Trash2,
  Loader2,
  Code2,
  Terminal,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Users,
  Play
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { RichTextEditor } from '@/components/shared/rich-text-editor'
import { RubricTestGrader } from './rubric-test-grader'
import { TeacherSqlEditor } from './teacher-sql-editor'
import { createExamQuestionsBatch } from '@/lib/actions'
import { useApi } from '@/hooks/use-api'
import {
  ExamQuestionItem,
  CreateExamQuestionBatch,
  GradingRubric
} from '@/lib/types'
import { PATH } from '@/lib/constants'
import { CreateTableRubricEditor } from './create-table-rubric-editor'
import { InsertDataRubricEditor } from './insert-data-rubric-editor'
import { InsertDataTestGrader } from './insert-data-test-grader'
import { SelectQueryRubricEditor } from './select-query-rubric-editor'
import { SelectQueryTestGrader } from './select-query-test-grader'

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
  rubricData?: GradingRubric | null
}

export function ExamQuestionsView({
  examId,
  initialQuestions
}: ExamQuestionsViewProps) {
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
      <div className="flex items-center justify-between pt-4 pb-1">
        <div className="border-l-4 border-primary/60 pl-3">
          <div>
            <h1 className="flex items-center gap-2 text-2xl tracking-tight font-bold text-title">
              Danh sách câu hỏi
            </h1>
            <p className="text-foreground font-medium">
              {questions.length} câu hỏi · Tổng điểm: {totalPoints}đ
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
            <Link href={`/teacher/exams/${examId}/results`}>
              <Button variant="outline" className="gap-2">
                <Users className="h-4 w-4" />
                Xem kết quả
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
        <form onSubmit={handleSubmitQuestions} className="rounded-ms space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
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
            <div className="overflow-x-auto rounded-lg border border-border bg-card">
              <table className="w-full table-fixed text-sm">
                <thead className="bg-surface-container-high">
                  <tr className="border-b border-border">
                    <th className="px-3 py-2 text-left font-semibold w-5">
                      STT
                    </th>
                    <th className="px-3 py-2 text-left font-semibold w-[62%]">
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
                    <React.Fragment key={q.id}>
                      <tr className={`${idx % 2 === 0 ? '' : 'bg-muted/10'}`}>
                        <td className="px-3 py-4 text-muted-foreground font-medium align-top">
                          {idx + 1}
                        </td>
                        <td className="px-3 py-4 align-top min-w-0">
                          <RichTextEditor
                            content={q.content}
                            onChange={(html) =>
                              updateQuestion(q.id, {
                                content: html
                              })
                            }
                            placeholder="Mô tả yêu cầu câu hỏi..."
                            minHeight="100px"
                          />
                        </td>
                        <td className="px-3 py-4 align-top">
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
                        <td className="px-3 py-4 align-top text-center">
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
                            className="w-full rounded bg-background px-2 py-1 text-xs text-center focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          />
                        </td>
                        <td className="px-3 py-4 align-top text-center">
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
                        <td className="px-3 py-4 text-center align-top">
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
                      <tr
                        className={`border-b border-border last:border-0 ${
                          idx % 2 === 0 ? '' : 'bg-muted/10'
                        }`}
                      >
                        <td colSpan={1} />
                        <td colSpan={5} className="px-3 pb-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                                <Code2 className="h-4 w-4" />
                                Đáp án (Correct Query)
                              </label>
                              <div className="h-[120px] overflow-hidden rounded border border-border bg-background">
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
                                  <div className="flex items-center gap-1 text-[10px] text-primary italic">
                                    <Sparkles className="h-2.5 w-2.5" />
                                    AI sẽ tự động tạo đáp án dựa trên nội dung
                                    đề bài
                                  </div>
                                )}
                              {!q.correctQuery &&
                                q.questionType === 'INSERT_DATA' && (
                                  <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 italic">
                                    <Sparkles className="h-2.5 w-2.5" />
                                    Câu INSERT DATA cần script đáp án chuẩn để
                                    AI tạo rubric chấm điểm chính xác
                                  </div>
                                )}
                            </div>
                            <div className="space-y-1.5">
                              <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                                <Terminal className="h-4 w-4" />
                                Script kiểm thử (Verify Script)
                              </label>
                              <div className="h-[120px] overflow-hidden rounded border border-border bg-background">
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
                                <div className="flex items-center gap-1 text-[10px] text-primary italic">
                                  <Sparkles className="h-2.5 w-2.5" />
                                  AI sẽ tự động tạo script dựa trên nội dung đề
                                  bài
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Rubric editor for CREATE_TABLE */}
                          {q.questionType === 'CREATE_TABLE' && (
                            <div className="mt-4 pt-4 border-t border-border/50">
                              <h4 className="flex items-center gap-2 text-xs font-bold text-primary mb-3">
                                <Sparkles className="h-3.5 w-3.5" />
                                Cấu hình quy tắc chấm điểm (Rubric)
                              </h4>
                              <CreateTableRubricEditor
                                totalPoints={q.points}
                                rubric={q.rubricData ?? null}
                                onChange={(rubric) =>
                                  updateQuestion(q.id, { rubricData: rubric })
                                }
                                correctQuery={q.correctQuery}
                                questionContent={q.content}
                              />

                              {/* Test grading zone */}
                              <div className="mt-5 pt-5 border-t border-border/50">
                                <h4 className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400 mb-3">
                                  <Play className="h-3.5 w-3.5" />
                                  Vùng chấm thử
                                </h4>
                                <RubricTestGrader
                                  rubric={q.rubricData ?? null}
                                  correctQuery={q.correctQuery}
                                />
                              </div>
                            </div>
                          )}

                          {/* Rubric editor for INSERT_DATA */}
                          {q.questionType === 'INSERT_DATA' && (
                            <div className="mt-4 pt-4 border-t border-border/50">
                              <h4 className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-3">
                                <Sparkles className="h-3.5 w-3.5" />
                                Cấu hình quy tắc chấm điểm Cột & Dữ liệu
                              </h4>
                              <InsertDataRubricEditor
                                totalPoints={q.points}
                                rubric={q.rubricData ?? null}
                                onChange={(rubric) =>
                                  updateQuestion(q.id, { rubricData: rubric })
                                }
                                correctQuery={q.correctQuery}
                                questionContent={q.content}
                              />

                              {/* Test grading zone */}
                              <div className="mt-5 pt-5 border-t border-border/50">
                                <h4 className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400 mb-3">
                                  <Play className="h-3.5 w-3.5" />
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

                          {/* Rubric editor for SELECT_QUERY */}
                          {q.questionType === 'SELECT_QUERY' && (
                            <div className="mt-4 pt-4 border-t border-border/50">
                              <h4 className="flex items-center gap-2 text-xs font-bold text-violet-600 dark:text-violet-400 mb-3">
                                <Sparkles className="h-3.5 w-3.5" />
                                Cau hinh rubric SELECT theo test case
                              </h4>

                              <SelectQueryRubricEditor
                                totalPoints={q.points}
                                rubric={q.rubricData ?? null}
                                onChange={(rubric) =>
                                  updateQuestion(q.id, { rubricData: rubric })
                                }
                                correctQuery={q.correctQuery}
                                questionContent={q.content}
                                contextQueries={[
                                  ...questions
                                    .filter(
                                      (item) =>
                                        item.id !== Number(q.id) &&
                                        (item.questionType === 'CREATE_TABLE' ||
                                          item.questionType ===
                                            'INSERT_DATA') &&
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
                                          item.questionType ===
                                            'INSERT_DATA') &&
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
                                    label: `#${existingQ.orderIndex} - Cau da luu`
                                  })),
                                  ...pendingQuestions
                                    .filter((other) => other.id !== q.id)
                                    .map((other) => ({
                                      value: other.id,
                                      label: `#${other.orderIndex} - Cau dang tao`
                                    }))
                                ]}
                              />

                              <div className="mt-5 pt-5 border-t border-border/50">
                                <h4 className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400 mb-3">
                                  <Play className="h-3.5 w-3.5" />
                                  Vung cham thu SELECT
                                </h4>
                                <SelectQueryTestGrader
                                  examId={examId}
                                  rubric={q.rubricData ?? null}
                                  correctQuery={q.correctQuery}
                                />
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    </React.Fragment>
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
            <QuestionItem key={q.id} question={q} />
          ))}
        </div>
      )}
    </div>
  )
}

function QuestionItem({ question }: { question: ExamQuestionItem }) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="rounded-sm shadow-sm bg-card transition-all hover:shadow-md">
      <div className="p-5">
        <div className="flex items-start gap-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
            {question.orderIndex}
          </span>

          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${QUESTION_TYPE_COLORS[question.questionType] || 'bg-muted text-muted-foreground'}`}
              >
                {question.questionType}
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                <Award className="h-3 w-3" />
                {question.points}đ
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Hash className="h-3 w-3" />
                Độ khó: {question.difficultyLevel}
              </span>
            </div>

            <div className="editor-container">
              <div
                className="text-sm gap-2 text-foreground whitespace-pre-wrap ProseMirror"
                dangerouslySetInnerHTML={{ __html: question.content || '' }}
              />
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 w-8 p-0"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-border bg-muted/30 p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <Code2 className="h-3.5 w-3.5" />
                Đáp án (Correct Query)
              </div>
              <div className="h-[180px] overflow-hidden rounded-lg border border-border bg-background">
                <TeacherSqlEditor
                  value={question.correctQuery || '-- Không có đáp án'}
                  onChange={() => {}}
                  height="100%"
                  readOnly
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <Terminal className="h-3.5 w-3.5" />
                Script kiểm thử (Verify Script)
              </div>
              <div className="h-[180px] overflow-hidden rounded-lg border border-border bg-background">
                <TeacherSqlEditor
                  value={question.verifyScript || '-- Không có script'}
                  onChange={() => {}}
                  height="100%"
                  readOnly
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
