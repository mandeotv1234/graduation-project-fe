'use client'

import React, { useMemo, useState } from 'react'
import { toast } from 'sonner'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { TeacherSqlEditor } from './teacher-sql-editor'
import { RichTextEditor } from '@/components/shared/rich-text-editor'
import {
  ExamQuestionItem,
  SpecificationDataset,
  SpecificationSchemaJsonTable,
  UpdateExamQuestionRequest,
  ExamSpecification,
  SpecificationDetailResponse
} from '@/lib/types'
import {
  generateCreateTableQuestionFromSchema,
  sanitizeSchemaTables
} from './create-table-question-generator'
import {
  generateInsertDataQuestionFromDataset,
  getDatasetTableNames
} from './insert-data-question-generator'
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
  examId,
  specificationSchemaJson,
  specificationDatasets
}: {
  question: ExamQuestionItem
  onDelete: (id: number) => void
  onUpdate: (id: number, data: UpdateExamQuestionRequest) => void
  isUpdating: boolean
  isDeleting: boolean
  allQuestions: ExamQuestionItem[]
  specification?: ExamSpecification | SpecificationDetailResponse | null
  examId: number
  specificationSchemaJson?: string | SpecificationSchemaJsonTable[] | null
  specificationDatasets?: SpecificationDataset[] | null
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  const [createTableModalOpen, setCreateTableModalOpen] = useState(false)
  const [insertDataModalOpen, setInsertDataModalOpen] = useState(false)
  const [editCreateTableSelections, setEditCreateTableSelections] = useState<
    string[]
  >([])
  const [editCreateTableIncludeFk, setEditCreateTableIncludeFk] = useState(true)
  const [editInsertDatasetName, setEditInsertDatasetName] = useState('')
  const [editInsertTableNames, setEditInsertTableNames] = useState<string[]>([])

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

  const selectedInsertDataset = useMemo(
    () =>
      availableDatasets.find((d) => d.name === editInsertDatasetName) ?? null,
    [availableDatasets, editInsertDatasetName]
  )

  const insertDatasetTableNames = useMemo(
    () =>
      selectedInsertDataset ? getDatasetTableNames(selectedInsertDataset) : [],
    [selectedInsertDataset]
  )

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

  const openEdit = () => {
    setEditForm({
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
    setCreateTableModalOpen(false)
    setInsertDataModalOpen(false)
    setEditCreateTableSelections([])
    setEditCreateTableIncludeFk(true)
    setEditInsertDatasetName('')
    setEditInsertTableNames([])
    setIsEditing(true)
  }

  const handleEditQuestionTypeChange = (
    nextType: ExamQuestionItem['questionType']
  ) => {
    setEditForm((prev) => ({ ...prev, questionType: nextType }))
    setCreateTableModalOpen(false)
    setInsertDataModalOpen(false)
    if (nextType === 'CREATE_TABLE') {
      setCreateTableModalOpen(true)
    }
    if (nextType === 'INSERT_DATA') {
      const defaultDataset = availableDatasets[0]
      const defaultTable = defaultDataset
        ? getDatasetTableNames(defaultDataset)[0] || ''
        : ''
      setEditInsertDatasetName(defaultDataset?.name || '')
      setEditInsertTableNames(defaultTable ? [defaultTable] : [])
      setInsertDataModalOpen(true)
    }
  }

  const toggleEditCreateTableSelection = (
    tableName: string,
    checked: boolean
  ) => {
    setEditCreateTableSelections((prev) =>
      checked ? [...prev, tableName] : prev.filter((name) => name !== tableName)
    )
  }

  const selectAllEditCreateTables = () => {
    setEditCreateTableSelections(
      availableSchemaTables.map((table) => table.tableName)
    )
  }

  const clearAllEditCreateTables = () => {
    setEditCreateTableSelections([])
  }

  const handleAutoGenerateCreateTableEdit = () => {
    if (editCreateTableSelections.length === 0) {
      toast.error('Vui lòng chọn ít nhất một bảng để sinh câu hỏi')
      return
    }
    const generated = generateCreateTableQuestionFromSchema(
      availableSchemaTables,
      editCreateTableSelections,
      { includeForeignKeys: editCreateTableIncludeFk }
    )
    if (!generated.content || !generated.correctQuery) {
      toast.error('Không thể sinh câu hỏi từ schema hiện tại')
      return
    }
    setEditForm((prev) => ({
      ...prev,
      content: generated.content,
      correctQuery: generated.correctQuery,
      questionType: 'CREATE_TABLE'
    }))
    toast.success('Đã tự sinh nội dung và đáp án cho câu CREATE TABLE')
    setCreateTableModalOpen(false)
  }

  const handleAutoGenerateInsertDataEdit = () => {
    if (!editInsertDatasetName) {
      toast.error('Vui lòng chọn một dataset để sinh câu hỏi INSERT DATA')
      return
    }
    const dataset = availableDatasets.find(
      (item) => item.name === editInsertDatasetName
    )
    if (!dataset) {
      toast.error('Không tìm thấy dataset đã chọn')
      return
    }
    const generated = generateInsertDataQuestionFromDataset(
      dataset,
      editInsertTableNames
    )
    if (!generated.content || !generated.correctQuery) {
      toast.error('Dataset chưa có data script để sinh đáp án')
      return
    }
    setEditForm((prev) => ({
      ...prev,
      content: generated.content,
      correctQuery: generated.correctQuery,
      questionType: 'INSERT_DATA'
    }))
    toast.success('Đã tự sinh nội dung và đáp án cho câu INSERT DATA')
    setInsertDataModalOpen(false)
  }

  const selectAllEditInsertTables = (tableNames: string[]) => {
    setEditInsertTableNames(tableNames)
  }

  const clearAllEditInsertTables = () => {
    setEditInsertTableNames([])
  }

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
        <Dialog
          open={createTableModalOpen}
          onOpenChange={setCreateTableModalOpen}
        >
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>Sinh câu CREATE TABLE từ schema</DialogTitle>
              <DialogDescription>
                Chọn bảng và bấm sinh để tự điền nội dung đề bài và đáp án
                chuẩn.
              </DialogDescription>
            </DialogHeader>
            {availableSchemaTables.length === 0 ? (
              <p className="rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                Chưa có schemaJson trong đặc tả của đề thi để sinh tự động.
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
                          editCreateTableSelections.length ===
                            availableSchemaTables.length
                        }
                        onChange={(event) => {
                          if (event.target.checked) {
                            selectAllEditCreateTables()
                          } else {
                            clearAllEditCreateTables()
                          }
                        }}
                      />
                      Chọn tất cả
                    </label>
                  </div>
                  <div className="max-h-56 space-y-2 overflow-y-auto rounded-md border bg-muted/20 p-3">
                    {availableSchemaTables.map((table) => {
                      const checked = editCreateTableSelections.includes(
                        table.tableName
                      )
                      return (
                        <label
                          key={table.tableName}
                          className="flex items-center gap-2 rounded px-1 py-1 text-sm hover:bg-background/80"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(event) =>
                              toggleEditCreateTableSelection(
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
                      checked={editCreateTableIncludeFk}
                      onChange={(event) =>
                        setEditCreateTableIncludeFk(event.target.checked)
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
                onClick={() => setCreateTableModalOpen(false)}
              >
                Đóng
              </Button>
              <Button
                type="button"
                onClick={handleAutoGenerateCreateTableEdit}
                disabled={availableSchemaTables.length === 0}
              >
                Sinh nội dung và đáp án
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={insertDataModalOpen}
          onOpenChange={setInsertDataModalOpen}
        >
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>Sinh câu INSERT DATA từ dataset</DialogTitle>
              <DialogDescription>
                Chọn một dataset để tự điền nội dung đề bài và đáp án chuẩn.
              </DialogDescription>
            </DialogHeader>
            {availableDatasets.length === 0 ? (
              <p className="rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                Chưa có dataset có data script trong đặc tả của đề thi.
              </p>
            ) : (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  Chọn dataset
                </p>
                <select
                  value={editInsertDatasetName}
                  onChange={(event) => {
                    const nextDatasetName = event.target.value
                    setEditInsertDatasetName(nextDatasetName)
                    const nextDataset = availableDatasets.find(
                      (dataset) => dataset.name === nextDatasetName
                    )
                    const nextTableName = nextDataset
                      ? getDatasetTableNames(nextDataset)[0] || ''
                      : ''
                    setEditInsertTableNames(
                      nextTableName ? [nextTableName] : []
                    )
                  }}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="" disabled>
                    -- Chọn dataset --
                  </option>
                  {availableDatasets.map((dataset) => (
                    <option
                      key={dataset.id ?? dataset.name}
                      value={dataset.name}
                    >
                      {dataset.name}
                    </option>
                  ))}
                </select>
                {insertDatasetTableNames.length > 0 && (
                  <div className="pt-2 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-medium text-muted-foreground">
                        Chọn table trong dataset
                      </p>
                      <label className="flex items-center gap-2 text-xs text-muted-foreground">
                        <input
                          type="checkbox"
                          checked={
                            insertDatasetTableNames.length > 0 &&
                            editInsertTableNames.length ===
                              insertDatasetTableNames.length
                          }
                          onChange={(event) => {
                            if (event.target.checked) {
                              selectAllEditInsertTables(insertDatasetTableNames)
                            } else {
                              clearAllEditInsertTables()
                            }
                          }}
                        />
                        Chọn tất cả
                      </label>
                    </div>
                    <div className="max-h-40 space-y-2 overflow-y-auto rounded-md border bg-muted/20 p-3">
                      {insertDatasetTableNames.map((tableName) => {
                        const checked = editInsertTableNames.includes(tableName)
                        return (
                          <label
                            key={`${editInsertDatasetName}-${tableName}`}
                            className="flex items-center gap-2 rounded px-1 py-1 text-sm hover:bg-background/80"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(event) => {
                                setEditInsertTableNames((prev) => {
                                  if (event.target.checked) {
                                    return [...prev, tableName]
                                  }
                                  return prev.filter((n) => n !== tableName)
                                })
                              }}
                            />
                            {tableName}
                          </label>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setInsertDataModalOpen(false)}
              >
                Đóng
              </Button>
              <Button
                type="button"
                onClick={handleAutoGenerateInsertDataEdit}
                disabled={availableDatasets.length === 0}
              >
                Sinh nội dung và đáp án
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="flex flex-wrap items-center justify-between gap-4 bg-muted/20 px-5 py-3 border-b border-border">
          <div className="flex flex-wrap items-center gap-4">
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
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">
                Loại:
              </span>
              <select
                value={editForm.questionType}
                onChange={(e) =>
                  handleEditQuestionTypeChange(
                    e.target.value as ExamQuestionItem['questionType']
                  )
                }
                className="rounded-md border border-border bg-sub-background px-3 py-1.5 text-sm font-medium"
              >
                {QUESTION_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              {editForm.questionType === 'CREATE_TABLE' && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCreateTableModalOpen(true)}
                >
                  Mở modal CREATE
                </Button>
              )}
              {editForm.questionType === 'INSERT_DATA' && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setInsertDataModalOpen(true)}
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
                      totalPoints={editForm.points}
                    />
                  )}
                  {editForm.questionType === 'INSERT_DATA' && (
                    <InsertDataTestGrader
                      rubric={editForm.rubricData}
                      correctQuery={editForm.correctQuery}
                      examId={examId}
                      totalPoints={editForm.points}
                    />
                  )}
                  {editForm.questionType === 'SELECT_QUERY' && (
                    <SelectQueryTestGrader
                      examId={examId}
                      rubric={editForm.rubricData}
                      correctQuery={editForm.correctQuery}
                      totalPoints={editForm.points}
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
              onClick={openEdit}
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
