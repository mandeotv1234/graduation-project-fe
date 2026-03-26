'use client'

import { useState, useCallback } from 'react'
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
  Loader2
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { useApi } from '@/hooks/use-api'
import { updateSpecification } from '@/lib/actions'
import { PATH } from '@/lib/constants'
import {
  SpecificationDataset,
  SpecificationEntity,
  SpecificationEntityAttribute,
  SpecificationResponse
} from '@/lib/types'
import { DatasetsEditor } from '@/app/(main)/teacher/specifications/components/datasets-editor'

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

interface SpecificationEditViewProps {
  specification: SpecificationResponse
}

function emptyAttribute(orderIndex: number): SpecificationEntityAttribute {
  return {
    attributeName: '',
    dataType: 'VARCHAR(255)',
    description: '',
    isPrimaryKey: false,
    isNullable: true,
    orderIndex
  }
}

function emptyEntity(orderIndex: number): SpecificationEntity {
  return {
    entityName: '',
    displayName: '',
    description: '',
    orderIndex,
    attributes: [emptyAttribute(1)]
  }
}

interface EntityFormProps {
  entity: SpecificationEntity
  entityIdx: number
  onChange: (updated: SpecificationEntity) => void
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
    field: keyof SpecificationEntityAttribute,
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
      <div className="flex items-center gap-2 border-b border-border bg-muted/20 p-3">
        <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground/40" />
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex shrink-0 items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
        >
          {expanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>

        <div className="flex shrink-0 items-center gap-1 text-primary">
          <Table className="h-4 w-4" />
          <span className="text-xs font-medium text-muted-foreground">
            #{entityIdx + 1}
          </span>
        </div>

        <input
          value={entity.entityName}
          onChange={(e) => onChange({ ...entity, entityName: e.target.value })}
          placeholder="Tên bảng (e.g. PHIM)"
          className="h-8 min-w-0 flex-1 rounded-md border border-border bg-background px-2 text-sm font-mono font-semibold placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <input
          value={entity.displayName ?? ''}
          onChange={(e) => onChange({ ...entity, displayName: e.target.value })}
          placeholder="Tên hiển thị"
          className="h-8 min-w-0 flex-1 rounded-md border border-border bg-background px-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />

        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
            onClick={onRemove}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {expanded && (
        <div className="space-y-3 p-3">
          <textarea
            value={entity.description ?? ''}
            onChange={(e) =>
              onChange({ ...entity, description: e.target.value })
            }
            placeholder="Mô tả bảng..."
            rows={2}
            className="flex w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-xs text-muted-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />

          <div className="overflow-hidden rounded-lg border border-border">
            <div className="grid grid-cols-[2fr_2fr_3fr_auto_auto_auto] gap-0 border-b border-border bg-muted/40">
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
                className={`grid grid-cols-[2fr_2fr_3fr_auto_auto_auto] gap-0 items-center border-b border-border last:border-0 ${
                  attr.isPrimaryKey
                    ? 'bg-amber-500/5'
                    : attrIdx % 2 === 0
                      ? ''
                      : 'bg-muted/5'
                }`}
              >
                <div className="px-2 py-1.5">
                  <div className="flex items-center gap-1">
                    {attr.isPrimaryKey && (
                      <Key className="h-3 w-3 shrink-0 text-amber-500" />
                    )}
                    <input
                      value={attr.attributeName}
                      onChange={(e) =>
                        updateAttr(attrIdx, 'attributeName', e.target.value)
                      }
                      placeholder="TênCột"
                      className="h-7 w-full rounded border border-border bg-background px-2 text-xs font-mono placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                  </div>
                </div>

                <div className="px-2 py-1.5">
                  <input
                    list={`dt-list-${entityIdx}-${attrIdx}`}
                    value={attr.dataType}
                    onChange={(e) =>
                      updateAttr(attrIdx, 'dataType', e.target.value)
                    }
                    placeholder="INT"
                    className="h-7 w-full rounded border border-border bg-background px-2 text-xs font-mono placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                  <datalist id={`dt-list-${entityIdx}-${attrIdx}`}>
                    {DATA_TYPES.map((t) => (
                      <option key={t} value={t} />
                    ))}
                  </datalist>
                </div>

                <div className="px-2 py-1.5">
                  <input
                    value={attr.description ?? ''}
                    onChange={(e) =>
                      updateAttr(attrIdx, 'description', e.target.value)
                    }
                    placeholder="Mô tả thuộc tính..."
                    className="h-7 w-full rounded border border-border bg-background px-2 text-xs placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>

                <div className="flex justify-center px-2 py-1.5">
                  <input
                    type="checkbox"
                    checked={attr.isPrimaryKey}
                    onChange={(e) =>
                      updateAttr(attrIdx, 'isPrimaryKey', e.target.checked)
                    }
                    className="h-4 w-4 cursor-pointer accent-amber-500"
                    title="Khóa chính"
                  />
                </div>

                <div className="flex justify-center px-2 py-1.5">
                  <input
                    type="checkbox"
                    checked={attr.isNullable}
                    onChange={(e) =>
                      updateAttr(attrIdx, 'isNullable', e.target.checked)
                    }
                    className="h-4 w-4 cursor-pointer accent-primary"
                    title="Cho phép NULL"
                  />
                </div>

                <div className="flex justify-center px-1 py-1.5">
                  <button
                    type="button"
                    onClick={() => removeAttr(attrIdx)}
                    disabled={entity.attributes.length <= 1}
                    className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground/40 transition-colors hover:text-destructive disabled:pointer-events-none disabled:opacity-20"
                    title="Xóa thuộc tính"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addAttr}
            className="h-7 gap-1.5 text-xs"
          >
            <Plus className="h-3 w-3" />
            Thêm thuộc tính
          </Button>
        </div>
      )}
    </div>
  )
}

export function SpecificationEditView({
  specification
}: SpecificationEditViewProps) {
  const router = useRouter()
  const { callApi, isLoading } = useApi()

  const [name, setName] = useState(specification.name ?? '')
  const [ddlScript, setDdlScript] = useState(specification.ddlScript ?? '')
  const [description, setDescription] = useState(
    specification.description ?? ''
  )
  const [entities, setEntities] = useState<SpecificationEntity[]>(
    [...(specification.entities ?? [])].sort(
      (a, b) => a.orderIndex - b.orderIndex
    )
  )
  const [datasets, setDatasets] = useState<SpecificationDataset[]>(
    [...(specification.datasets ?? [])].sort(
      (a, b) => a.orderIndex - b.orderIndex
    )
  )

  const normalizeEntities = (items: SpecificationEntity[]) =>
    items.map((entity, entityIndex) => ({
      ...entity,
      entityName: entity.entityName.trim(),
      displayName: entity.displayName?.trim() || entity.entityName.trim(),
      description: entity.description?.trim() || '',
      orderIndex: entityIndex + 1,
      attributes: (entity.attributes ?? []).map((attribute, attrIndex) => ({
        ...attribute,
        attributeName: attribute.attributeName.trim(),
        dataType: attribute.dataType.trim(),
        description: attribute.description?.trim() || '',
        orderIndex: attrIndex + 1
      }))
    }))

  const normalizeDatasets = (items: SpecificationDataset[]) =>
    items.map((item, index) => ({
      ...item,
      name: item.name.trim(),
      orderIndex: index + 1
    }))

  const updateEntity = useCallback(
    (idx: number, updated: SpecificationEntity) => {
      setEntities((prev) => prev.map((e, i) => (i === idx ? updated : e)))
    },
    []
  )

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

  const addDataset = () => {
    setDatasets((prev) => [
      ...prev,
      {
        name: '',
        dataScript: '',
        orderIndex: prev.length + 1,
        isActive: true
      }
    ])
  }

  const updateDataset = (
    index: number,
    field: keyof SpecificationDataset,
    value: string | boolean | number
  ) => {
    setDatasets((prev) =>
      prev.map((dataset, idx) =>
        idx === index ? { ...dataset, [field]: value } : dataset
      )
    )
  }

  const removeDataset = (index: number) => {
    setDatasets((prev) =>
      normalizeDatasets(prev.filter((_, idx) => idx !== index))
    )
  }

  const moveDataset = (index: number, direction: -1 | 1) => {
    setDatasets((prev) => {
      const target = index + direction
      if (target < 0 || target >= prev.length) return prev
      const next = [...prev]
      ;[next[index], next[target]] = [next[target], next[index]]
      return normalizeDatasets(next)
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim() || !ddlScript.trim()) {
      toast.error('Vui lòng nhập tên và DDL script')
      return
    }

    const normalizedEntities = normalizeEntities(entities)
    const invalidEntity = normalizedEntities.find(
      (entity) => !entity.entityName
    )
    if (invalidEntity) {
      toast.error('Vui lòng nhập entityName cho tất cả entities')
      return
    }

    const invalidAttribute = normalizedEntities.find((entity) =>
      (entity.attributes ?? []).some(
        (attribute) => !attribute.attributeName || !attribute.dataType
      )
    )
    if (invalidAttribute) {
      toast.error('Vui lòng nhập đầy đủ attributeName và dataType')
      return
    }

    const normalizedDatasets = normalizeDatasets(datasets)
    const invalidDataset = normalizedDatasets.find((dataset) => !dataset.name)
    if (invalidDataset) {
      toast.error('Vui lòng nhập tên cho tất cả datasets')
      return
    }

    const result = await callApi(
      updateSpecification(specification.id, {
        name: name.trim(),
        ddlScript,
        description: description.trim() || undefined,
        entities: normalizedEntities,
        datasets: normalizedDatasets
      })
    )

    if (result.data) {
      toast.success('Đã cập nhật đặc tả CSDL')
      router.push(PATH.TEACHER_SPECIFICATIONS)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Chỉnh sửa đặc tả CSDL
          </h1>
          <p className="text-sm text-muted-foreground">Cập nhật đặc tả CSDL.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground">
            Thông tin chung
          </h2>
          <div className="grid gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Tên đặc tả <span className="text-destructive">*</span>
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Mô tả CSDL quản lý phim"
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
                placeholder="Mô tả ngắn về CSDL..."
                className="flex h-9 w-full rounded-lg border border-border bg-background px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                DDL Script <span className="text-destructive">*</span>
              </label>
              <textarea
                value={ddlScript}
                onChange={(e) => setDdlScript(e.target.value)}
                rows={10}
                placeholder="CREATE TABLE ..."
                className="flex min-h-[240px] w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>
        </div>

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

        <Button
          type="button"
          variant="outline"
          onClick={addEntity}
          className="w-full gap-2 border-dashed"
        >
          <Plus className="h-4 w-4" />
          Thêm bảng
        </Button>

        <DatasetsEditor
          datasets={datasets}
          onAdd={addDataset}
          onUpdate={updateDataset}
          onRemove={removeDataset}
          onMove={moveDataset}
        />

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(PATH.TEACHER_SPECIFICATIONS)}
          >
            Hủy
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="min-w-[140px] gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang lưu...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Lưu chỉnh sửa
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
