'use client'

import React, { useState } from 'react'
import {
  ChevronDown,
  ChevronUp,
  Code2,
  Terminal,
  Award,
  Hash,
  Trash2,
  Edit,
  Save,
  Loader2,
  Play
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TeacherSqlEditor } from './teacher-sql-editor'
import { RichTextEditor } from '@/components/shared/rich-text-editor'
import {
  ExamQuestionItem,
  UpdateExamQuestionRequest,
  ExamSpecification,
  SpecificationDetailResponse
} from '@/lib/types'
import { CreateTableRubricEditor } from './create-table-rubric-editor'
import { InsertDataRubricEditor } from './insert-data-rubric-editor'
import { SelectQueryRubricEditor } from './select-query-rubric-editor'
import { RubricTestGrader } from './rubric-test-grader'
import { InsertDataTestGrader } from './insert-data-test-grader'
import { SelectQueryTestGrader } from './select-query-test-grader'
import { CreateTableQueryFromSpec } from './create-table-query-from-spec'
import { InsertQueryFromSpec } from './insert-query-from-spec'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog'

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

export function QuestionItem({
  question,
  onDelete,
  onUpdate,
  isUpdating,
  isDeleting,
  allQuestions,
  specification = null,
  examId
}: {
  question: ExamQuestionItem
  onDelete: (id: number) => void
  onUpdate: (id: number, data: UpdateExamQuestionRequest) => void
  isUpdating: boolean
  isDeleting: boolean
  allQuestions: ExamQuestionItem[]
  specification?: ExamSpecification | SpecificationDetailResponse | null
  examId: number
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  const [editForm, setEditForm] = useState({
    content: question.content || '',
    correctQuery: question.correctQuery || '',
    verifyScript: question.verifyScript || '',
    points: question.points || 1,
    difficultyLevel: question.difficultyLevel || 1,
    orderIndex: question.orderIndex || 1,
    questionType: question.questionType || 'SELECT_QUERY',
    rubricData: question.gradingRubric
      ? JSON.parse(question.gradingRubric)
      : null
  })

  const handleUpdate = () => {
    onUpdate(question.id, {
      ...editForm,
      gradingRubric: editForm.rubricData
        ? JSON.stringify(editForm.rubricData)
        : undefined
    })
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden transition-all">
        <div className="flex flex-wrap items-center justify-between gap-4 bg-muted/20 px-5 py-3 border-b border-border">
          <div className="flex items-center gap-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sub-primary/10 text-sm font-bold text-sub-primary">
              <input
                type="number"
                value={editForm.orderIndex}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    orderIndex: Number(e.target.value)
                  }))
                }
                className="w-10 rounded-md border-transparent bg-transparent text-center focus:border-border font-bold p-0 text-sub-primary"
              />
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">
                Loại:
              </span>
              <select
                value={editForm.questionType}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    questionType: e.target
                      .value as ExamQuestionItem['questionType']
                  }))
                }
                className="rounded-md border border-border bg-sub-background px-3 py-1.5 text-sm font-medium"
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
                value={editForm.points}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    points: Number(e.target.value)
                  }))
                }
                min={0.5}
                step={0.5}
                className="w-16 rounded-md border border-border bg-sub-background px-2 py-1.5 text-sm text-center"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-muted-foreground">
                Độ khó:
              </label>
              <input
                type="number"
                value={editForm.difficultyLevel}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    difficultyLevel: Number(e.target.value)
                  }))
                }
                min={1}
                max={5}
                className="w-16 rounded-md border border-border bg-sub-background px-2 py-1.5 text-sm text-center"
              />
            </div>
            <div className="h-5 w-px bg-border mx-1"></div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(false)}
            >
              Hủy
            </Button>
            <Button size="sm" onClick={handleUpdate} disabled={isUpdating}>
              {isUpdating ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Save className="h-4 w-4 mr-1" />
              )}{' '}
              Lưu
            </Button>
          </div>
        </div>

        <div className="p-5 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">
              Nội dung đề bài
            </label>
            <div className="rounded-md overflow-hidden">
              <RichTextEditor
                content={editForm.content}
                onChange={(html) =>
                  setEditForm((prev) => ({ ...prev, content: html }))
                }
                placeholder="Mô tả yêu cầu câu hỏi..."
                minHeight="120px"
              />
            </div>
          </div>

          <div
            className={`grid gap-4 ${
              ['CREATE_TABLE', 'INSERT_DATA', 'SELECT_QUERY'].includes(
                editForm.questionType
              )
                ? 'grid-cols-1'
                : 'grid-cols-1 md:grid-cols-2'
            }`}
          >
            <div className="space-y-2">
              <label className="flex items-center justify-between text-sm font-semibold text-foreground">
                <span className="flex items-center gap-1.5">
                  <Code2 className="h-4 w-4 text-sub-primary" /> Đáp án (Correct
                  Query)
                </span>
              </label>
              {editForm.questionType === 'CREATE_TABLE' && (
                <CreateTableQueryFromSpec
                  specification={specification}
                  onApply={(sql) =>
                    setEditForm((prev) => ({ ...prev, correctQuery: sql }))
                  }
                />
              )}
              {editForm.questionType === 'INSERT_DATA' && (
                <InsertQueryFromSpec
                  specification={specification}
                  onApply={(sql) =>
                    setEditForm((prev) => ({ ...prev, correctQuery: sql }))
                  }
                />
              )}
              <div className="h-[160px] overflow-hidden rounded-md border border-border bg-sub-background">
                <TeacherSqlEditor
                  value={editForm.correctQuery}
                  onChange={(v) =>
                    setEditForm((prev) => ({ ...prev, correctQuery: v || '' }))
                  }
                  height="100%"
                />
              </div>
            </div>
            {!['CREATE_TABLE', 'INSERT_DATA', 'SELECT_QUERY'].includes(
              editForm.questionType
            ) && (
              <div className="space-y-2">
                <label className="flex items-center justify-between text-sm font-semibold text-foreground">
                  <span className="flex items-center gap-1.5">
                    <Terminal className="h-4 w-4 text-muted-foreground" />{' '}
                    Script kiểm thử
                  </span>
                </label>
                <div className="h-[160px] overflow-hidden rounded-md border border-border bg-background">
                  <TeacherSqlEditor
                    value={editForm.verifyScript}
                    onChange={(v) =>
                      setEditForm((prev) => ({
                        ...prev,
                        verifyScript: v || ''
                      }))
                    }
                    height="100%"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Rubric Editors */}
          {(editForm.questionType === 'CREATE_TABLE' ||
            editForm.questionType === 'INSERT_DATA' ||
            editForm.questionType === 'SELECT_QUERY') && (
            <div className="rounded-lg space-y-4">
              {editForm.questionType === 'CREATE_TABLE' && (
                <CreateTableRubricEditor
                  totalPoints={editForm.points}
                  rubric={editForm.rubricData}
                  onChange={(rubric) =>
                    setEditForm((prev) => ({
                      ...prev,
                      rubricData: rubric
                    }))
                  }
                  correctQuery={editForm.correctQuery}
                  questionContent={editForm.content}
                />
              )}
              {editForm.questionType === 'INSERT_DATA' && (
                <InsertDataRubricEditor
                  examId={examId}
                  totalPoints={editForm.points}
                  rubric={editForm.rubricData}
                  onChange={(rubric) =>
                    setEditForm((prev) => ({
                      ...prev,
                      rubricData: rubric
                    }))
                  }
                  correctQuery={editForm.correctQuery}
                  questionContent={editForm.content}
                />
              )}
              {editForm.questionType === 'SELECT_QUERY' && (
                <SelectQueryRubricEditor
                  examId={examId}
                  totalPoints={editForm.points}
                  rubric={editForm.rubricData}
                  onChange={(rubric) =>
                    setEditForm((prev) => ({
                      ...prev,
                      rubricData: rubric
                    }))
                  }
                  correctQuery={editForm.correctQuery}
                  questionContent={editForm.content}
                  contextQueries={allQuestions
                    .filter(
                      (q) =>
                        q.id !== question.id &&
                        (q.questionType === 'CREATE_TABLE' ||
                          q.questionType === 'INSERT_DATA') &&
                        q.correctQuery
                    )
                    .map((q) => ({
                      questionType: q.questionType,
                      content: q.content,
                      correctQuery: q.correctQuery
                    }))}
                  dependencyOptions={allQuestions
                    .filter((q) => q.id !== question.id)
                    .map((q) => ({
                      value: String(q.id),
                      label: `#${q.orderIndex} - Câu đã lưu`
                    }))}
                />
              )}

              {/* Vùng chấm thử — MAIN SECTION */}
              {editForm.rubricData && (
                <div className="mt-5 rounded-lg border border-amber-500/20 bg-amber-500/3 p-4 space-y-3">
                  <h4 className="flex items-center gap-2 text-sm font-bold text-amber-600 dark:text-amber-400">
                    <Play className="h-4 w-4" /> Vùng chấm thử
                  </h4>

                  {editForm.questionType === 'CREATE_TABLE' && (
                    <RubricTestGrader
                      rubric={editForm.rubricData}
                      correctQuery={editForm.correctQuery}
                    />
                  )}
                  {editForm.questionType === 'INSERT_DATA' && (
                    <InsertDataTestGrader
                      rubric={editForm.rubricData}
                      correctQuery={editForm.correctQuery}
                      examId={examId}
                    />
                  )}
                  {editForm.questionType === 'SELECT_QUERY' && (
                    <SelectQueryTestGrader
                      examId={examId}
                      rubric={editForm.rubricData}
                      correctQuery={editForm.correctQuery}
                    />
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-sm shadow-sm bg-card transition-all hover:shadow-md border border-border">
      <div className="p-5">
        <div className="flex items-start gap-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sub-primary/10 text-sm font-bold text-sub-primary">
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
                <Award className="h-3 w-3" /> {question.points}đ
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Hash className="h-3 w-3" /> Độ khó: {question.difficultyLevel}
              </span>
            </div>
            <div className="editor-container">
              <div
                className="text-sm gap-2 text-foreground whitespace-pre-wrap ProseMirror"
                dangerouslySetInnerHTML={{ __html: question.content || '' }}
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="h-8 w-8 p-0"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isDeleting}
                  className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                >
                  {isDeleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Xác nhận xóa câu hỏi</AlertDialogTitle>
                  <AlertDialogDescription>
                    Bạn có chắc chắn muốn xóa câu hỏi này không? Hành động này
                    không thể hoàn tác.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Hủy</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDelete(question.id)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Xóa
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
      {isExpanded && (
        <div className="border-t border-border bg-muted/30 p-5 space-y-4">
          <div
            className={`grid gap-4 ${
              ['CREATE_TABLE', 'INSERT_DATA', 'SELECT_QUERY'].includes(
                question.questionType
              )
                ? 'grid-cols-1'
                : 'grid-cols-1 md:grid-cols-2'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <Code2 className="h-3.5 w-3.5" /> Đáp án (Correct Query)
              </div>
              <div className="h-[180px] overflow-hidden rounded-lg border border-border bg-sub-background">
                <TeacherSqlEditor
                  value={question.correctQuery || '-- Không có đáp án'}
                  onChange={() => {}}
                  height="100%"
                  readOnly
                />
              </div>
            </div>
            {!['CREATE_TABLE', 'INSERT_DATA', 'SELECT_QUERY'].includes(
              question.questionType
            ) && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <Terminal className="h-3.5 w-3.5" /> Script kiểm thử (Verify
                  Script)
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
            )}
            </div>
          </div>
      )}
    </div>
  )
}
