'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Plus,
  Save,
  Trash2,
  Table,
  ChevronDown,
  ChevronRight,
  GripVertical,
  Key,
  Eye,
  EyeOff,
  Database,
  Loader2,
  ArrowRight
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { saveExamSpecification } from '@/lib/actions'
import { useApi } from '@/hooks/use-api'
import { PATH } from '@/lib/constants'
import {
  ExamSpecification,
  SaveExamSpecificationRequest,
  SpecEntity,
  SpecAttribute
} from '@/lib/types'
import { ExamSpecificationView } from '@/components/shared/exam-specification-view'

const DATA_TYPES = [
  'INT',
  'BIGINT',
  'SMALLINT',
  'TINYINT',
  'VARCHAR(50)',
  'VARCHAR(100)',
  'VARCHAR(255)',
  'NVARCHAR(50)',
  'NVARCHAR(100)',
  'NVARCHAR(255)',
  'CHAR(5)',
  'CHAR(10)',
  'NCHAR(5)',
  'NCHAR(10)',
  'TEXT',
  'NTEXT',
  'DECIMAL(10,2)',
  'NUMERIC(10,2)',
  'FLOAT',
  'REAL',
  'MONEY',
  'DATE',
  'DATETIME',
  'TIME',
  'BIT'
]

function emptyAttribute(orderIndex: number): SpecAttribute {
  return {
    attributeName: '',
    dataType: 'VARCHAR(50)',
    description: '',
    isPrimaryKey: false,
    isNullable: true,
    orderIndex
  }
}

function emptyEntity(orderIndex: number): SpecEntity {
  return {
    entityName: '',
    displayName: '',
    description: '',
    orderIndex,
    attributes: [emptyAttribute(1)]
  }
}

interface EntityFormProps {
  entity: SpecEntity
  entityIdx: number
  onChange: (updated: SpecEntity) => void
  onRemove: () => void
  canRemove: boolean
}

function EntityForm({
  entity,
  entityIdx,
  onChange,
  onRemove,
  canRemove
}: EntityFormProps) {
  const [expanded, setExpanded] = useState(true)

  const updateAttr = (
    attrIdx: number,
    field: keyof SpecAttribute,
    value: unknown
  ) => {
    const updated = entity.attributes.map((a, i) =>
      i === attrIdx ? { ...a, [field]: value } : a
    )
    onChange({ ...entity, attributes: updated })
  }

  const addAttr = () => {
    onChange({
      ...entity,
      attributes: [
        ...entity.attributes,
        emptyAttribute(entity.attributes.length + 1)
      ]
    })
  }

  const removeAttr = (attrIdx: number) => {
    onChange({
      ...entity,
      attributes: entity.attributes
        .filter((_, i) => i !== attrIdx)
        .map((a, i) => ({ ...a, orderIndex: i + 1 }))
    })
  }

  return (
    <div className="rounded-xl border-2 border-border bg-card shadow-sm">
      {/* Entity header */}
      <div className="flex items-center gap-2 p-3 border-b border-border bg-muted/20">
        <GripVertical className="h-4 w-4 text-muted-foreground/40 shrink-0" />
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors shrink-0"
        >
          {expanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>

        <div className="flex items-center gap-1 text-primary shrink-0">
          <Table className="h-4 w-4" />
          <span className="text-xs font-medium text-muted-foreground">
            #{entityIdx + 1}
          </span>
        </div>

        <input
          value={entity.entityName}
          onChange={(e) => onChange({ ...entity, entityName: e.target.value })}
          placeholder="Tên bảng (e.g. PHIM)"
          className="flex-1 min-w-0 h-8 rounded-md border border-border bg-background px-2 text-sm font-mono font-semibold placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <input
          value={entity.displayName}
          onChange={(e) => onChange({ ...entity, displayName: e.target.value })}
          placeholder="Tên hiển thị (e.g. Phim)"
          className="flex-1 min-w-0 h-8 rounded-md border border-border bg-background px-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />

        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive shrink-0"
            onClick={onRemove}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {expanded && (
        <div className="p-3 space-y-3">
          {/* Entity description */}
          <textarea
            value={entity.description}
            onChange={(e) =>
              onChange({ ...entity, description: e.target.value })
            }
            placeholder="Mô tả tàn từ, ràng buộc, ghi chú cho bảng này..."
            rows={2}
            className="flex w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-muted-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
          />

          {/* Attributes */}
          <div className="rounded-lg border border-border overflow-hidden">
            <div className="grid grid-cols-[2fr_2fr_3fr_auto_auto_auto] gap-0 bg-muted/40 border-b border-border">
              {['Thuộc tính', 'Kiểu dữ liệu', 'Mô tả', 'PK', 'NULL', ''].map(
                (h) => (
                  <div
                    key={h}
                    className="px-2 py-1.5 text-xs font-semibold text-muted-foreground"
                  >
                    {h}
                  </div>
                )
              )}
            </div>

            {entity.attributes.map((attr, attrIdx) => (
              <div
                key={attrIdx}
                className={`grid grid-cols-[2fr_2fr_3fr_auto_auto_auto] gap-0 border-b border-border last:border-0 items-center ${attr.isPrimaryKey ? 'bg-amber-500/5' : attrIdx % 2 === 0 ? '' : 'bg-muted/5'}`}
              >
                {/* Attribute name */}
                <div className="px-2 py-1.5">
                  <div className="flex items-center gap-1">
                    {attr.isPrimaryKey && (
                      <Key className="h-3 w-3 text-amber-500 shrink-0" />
                    )}
                    <input
                      value={attr.attributeName}
                      onChange={(e) =>
                        updateAttr(attrIdx, 'attributeName', e.target.value)
                      }
                      placeholder="TenCot"
                      className="w-full h-7 rounded border border-border bg-background px-2 text-xs font-mono placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                  </div>
                </div>

                {/* Data type */}
                <div className="px-2 py-1.5">
                  <input
                    list={`dt-list-${entityIdx}-${attrIdx}`}
                    value={attr.dataType}
                    onChange={(e) =>
                      updateAttr(attrIdx, 'dataType', e.target.value)
                    }
                    placeholder="INT"
                    className="w-full h-7 rounded border border-border bg-background px-2 text-xs font-mono placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                  <datalist id={`dt-list-${entityIdx}-${attrIdx}`}>
                    {DATA_TYPES.map((t) => (
                      <option key={t} value={t} />
                    ))}
                  </datalist>
                </div>

                {/* Description */}
                <div className="px-2 py-1.5">
                  <input
                    value={attr.description}
                    onChange={(e) =>
                      updateAttr(attrIdx, 'description', e.target.value)
                    }
                    placeholder="Mô tả thuộc tính..."
                    className="w-full h-7 rounded border border-border bg-background px-2 text-xs placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>

                {/* PK checkbox */}
                <div className="px-2 py-1.5 flex justify-center">
                  <input
                    type="checkbox"
                    checked={attr.isPrimaryKey}
                    onChange={(e) =>
                      updateAttr(attrIdx, 'isPrimaryKey', e.target.checked)
                    }
                    className="h-4 w-4 accent-amber-500 cursor-pointer"
                    title="Khóa chính"
                  />
                </div>

                {/* Nullable checkbox */}
                <div className="px-2 py-1.5 flex justify-center">
                  <input
                    type="checkbox"
                    checked={attr.isNullable}
                    onChange={(e) =>
                      updateAttr(attrIdx, 'isNullable', e.target.checked)
                    }
                    className="h-4 w-4 accent-primary cursor-pointer"
                    title="Cho phép NULL"
                  />
                </div>

                {/* Remove attribute */}
                <div className="px-1 py-1.5 flex justify-center">
                  <button
                    type="button"
                    onClick={() => removeAttr(attrIdx)}
                    disabled={entity.attributes.length <= 1}
                    className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground/40 hover:text-destructive disabled:pointer-events-none disabled:opacity-20 transition-colors"
                    title="Xóa thuộc tính"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add attribute */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addAttr}
            className="gap-1.5 text-xs h-7"
          >
            <Plus className="h-3 w-3" />
            Thêm thuộc tính
          </Button>
        </div>
      )}
    </div>
  )
}

// ────────────────────────────────────────────────────────────────
// Main component
// ────────────────────────────────────────────────────────────────

interface ExamSpecificationEditorProps {
  examId: number
  initialSpecification?: ExamSpecification | null
}

export function ExamSpecificationEditor({
  examId,
  initialSpecification
}: ExamSpecificationEditorProps) {
  const router = useRouter()
  const { callApi, isLoading } = useApi()

  const [preview, setPreview] = useState(false)
  const [justSaved, setJustSaved] = useState(false)
  const [title, setTitle] = useState(initialSpecification?.title ?? '')
  const [description, setDescription] = useState(
    initialSpecification?.description ?? ''
  )
  const [entities, setEntities] = useState<SpecEntity[]>(
    initialSpecification?.entities?.length
      ? [...initialSpecification.entities].sort(
          (a, b) => a.orderIndex - b.orderIndex
        )
      : [emptyEntity(1)]
  )

  const updateEntity = useCallback((idx: number, updated: SpecEntity) => {
    setEntities((prev) => prev.map((e, i) => (i === idx ? updated : e)))
  }, [])

  const addEntity = () => {
    setEntities((prev) => [...prev, emptyEntity(prev.length + 1)])
  }

  const removeEntity = (idx: number) => {
    setEntities((prev) =>
      prev
        .filter((_, i) => i !== idx)
        .map((e, i) => ({ ...e, orderIndex: i + 1 }))
    )
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      toast.error('Vui lòng nhập tiêu đề đặc tả')
      return
    }

    for (const entity of entities) {
      if (!entity.entityName.trim()) {
        toast.error('Vui lòng nhập tên bảng cho tất cả các thực thể')
        return
      }
      for (const attr of entity.attributes) {
        if (!attr.attributeName.trim() || !attr.dataType.trim()) {
          toast.error(
            `Bảng "${entity.entityName}": vui lòng điền đầy đủ tên thuộc tính và kiểu dữ liệu`
          )
          return
        }
      }
    }

    const payload: SaveExamSpecificationRequest = {
      title,
      description,
      entities: entities.map((e, ei) => ({
        entityName: e.entityName,
        displayName: e.displayName,
        description: e.description,
        orderIndex: ei + 1,
        attributes: e.attributes.map((a, ai) => ({
          attributeName: a.attributeName,
          dataType: a.dataType,
          description: a.description,
          isPrimaryKey: a.isPrimaryKey,
          isNullable: a.isNullable,
          orderIndex: ai + 1
        }))
      }))
    }

    const result = await callApi(saveExamSpecification(examId, payload))
    if (result.data) {
      toast.success('Đã lưu đặc tả cơ sở dữ liệu')
      setJustSaved(true)
    }
  }

  const previewSpec: ExamSpecification = { title, description, entities }

  return (
    <div className="space-y-6">
      {/* Info banner */}
      {!justSaved && (
        <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 p-4">
          <div className="flex items-start gap-3">
            <Database className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Đặc tả đã được tự động sinh từ Schema Template
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Bạn có thể xem lại và chỉnh sửa đặc tả này trước khi tiếp tục
                tạo câu hỏi. Đặc tả sẽ hiển thị cho sinh viên khi làm bài thi.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Database className="h-7 w-7 text-primary" />
              Đặc tả cơ sở dữ liệu
            </h1>
            <p className="text-muted-foreground">
              Bài thi #{examId} · Mô tả schema cho sinh viên
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPreview((v) => !v)}
            className="gap-2"
          >
            {preview ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
            {preview ? 'Chỉnh sửa' : 'Xem trước'}
          </Button>
        </div>
      </div>

      {preview ? (
        /* ── Preview mode ── */
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <ExamSpecificationView specification={previewSpec} />
        </div>
      ) : (
        /* ── Editor mode ── */
        <form onSubmit={handleSave} className="space-y-5">
          {/* Title & description */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-sm">
            <h2 className="text-sm font-semibold text-foreground">
              Thông tin chung
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Tiêu đề đặc tả <span className="text-destructive">*</span>
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="VD: Mô tả cơ sở dữ liệu quản lý phim"
                  className="flex h-9 w-full rounded-lg border border-border bg-background px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Mô tả tổng quan
                </label>
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả ngắn về CSDL của bài thi..."
                  className="flex h-9 w-full rounded-lg border border-border bg-background px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </div>
          </div>

          {/* Entities */}
          <div className="space-y-3">
            {entities.map((entity, idx) => (
              <EntityForm
                key={idx}
                entity={entity}
                entityIdx={idx}
                onChange={(updated) => updateEntity(idx, updated)}
                onRemove={() => removeEntity(idx)}
                canRemove={entities.length > 1}
              />
            ))}
          </div>

          {/* Add entity */}
          <Button
            type="button"
            variant="outline"
            onClick={addEntity}
            className="gap-2 w-full border-dashed"
          >
            <Plus className="h-4 w-4" />
            Thêm bảng
          </Button>

          {/* Save */}
          <div className="flex items-center justify-between pt-2">
            {justSaved && (
              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-500">
                <div className="h-2 w-2 rounded-full bg-green-600 dark:bg-green-500 animate-pulse" />
                Đặc tả đã được lưu
              </div>
            )}
            <div className="flex items-center gap-3 ml-auto">
              <Button
                type="submit"
                disabled={isLoading}
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
                    Lưu đặc tả
                  </>
                )}
              </Button>
              {justSaved && (
                <Button
                  type="button"
                  onClick={() =>
                    router.push(PATH.TEACHER_EXAM_QUESTIONS(examId))
                  }
                  className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                >
                  Tiếp tục tạo câu hỏi
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </form>
      )}
    </div>
  )
}
