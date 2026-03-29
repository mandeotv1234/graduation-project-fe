'use client'

import { Code2, Database, FileText, Loader2, Save, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  SpecificationDataset,
  SpecificationEntity,
  SpecificationEntityAttribute
} from '@/lib/types'
import { DatasetsEditor } from '@/components/shared/datasets-editor'
import { EntitiesEditor } from '@/components/shared/entities-editor'

interface SpecificationFormProps {
  mode: 'create' | 'edit'
  isLoading: boolean
  name: string
  ddlScript: string
  description: string
  entities: SpecificationEntity[]
  datasets: SpecificationDataset[]
  onNameChange: (value: string) => void
  onDdlScriptChange: (value: string) => void
  onDescriptionChange: (value: string) => void
  onSubmit: (e: React.FormEvent) => void
  onCancel: () => void
  onAddEntity: () => void
  onRemoveEntity: (entityIndex: number) => void
  onMoveEntity: (entityIndex: number, direction: -1 | 1) => void
  onUpdateEntity: (
    entityIndex: number,
    field: keyof SpecificationEntity,
    value: string
  ) => void
  onAddAttribute: (entityIndex: number) => void
  onUpdateAttribute: (
    entityIndex: number,
    attributeIndex: number,
    field: keyof SpecificationEntityAttribute,
    value: string | boolean | number
  ) => void
  onRemoveAttribute: (entityIndex: number, attributeIndex: number) => void
  onAddDataset: () => void
  onUpdateDataset: (
    index: number,
    field: keyof SpecificationDataset,
    value: string | boolean | number
  ) => void
  onRemoveDataset: (index: number) => void
  onMoveDataset: (index: number, direction: -1 | 1) => void
}

export function SpecificationForm({
  mode,
  isLoading,
  name,
  ddlScript,
  description,
  entities,
  datasets,
  onNameChange,
  onDdlScriptChange,
  onDescriptionChange,
  onSubmit,
  onCancel,
  onAddEntity,
  onRemoveEntity,
  onMoveEntity,
  onUpdateEntity,
  onAddAttribute,
  onUpdateAttribute,
  onRemoveAttribute,
  onAddDataset,
  onUpdateDataset,
  onRemoveDataset,
  onMoveDataset
}: SpecificationFormProps) {
  const isEditMode = mode === 'edit'

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-6 rounded-2xl border border-primary/20 bg-card p-6 shadow-sm"
    >
      <div className="relative overflow-hidden rounded-xl border border-border/70 bg-linear-to-r from-primary/10 via-background to-background px-4 py-4">
        <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-primary/10 blur-2xl" />
        <div className="relative flex items-start justify-between gap-3">
          <div className="space-y-1">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <Database className="h-5 w-5 text-primary" />
              {isEditMode ? 'Chỉnh sửa đặc tả CSDL' : 'Tạo đặc tả CSDL mới'}
            </h2>
            <p className="text-xs text-muted-foreground">
              {isEditMode
                ? 'Cập nhật thông tin cơ bản, entities và datasets.'
                : 'Điền thông tin cơ bản, sau đó thêm entities và datasets.'}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onCancel}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-4 rounded-xl border border-border/80 bg-background/40 p-5">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <h3 className="text-sm font-semibold text-foreground">
            Thông tin cơ bản
          </h3>
          <span className="rounded-full bg-primary/10 px-2 py-1 text-[11px] font-medium text-primary">
            Bắt buộc: tên + DDL
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5 md:col-span-2">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <FileText className="h-4 w-4 text-primary" />
              Tên đặc tả CSDL <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="VD: Quản lý sinh viên"
              className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground transition-colors focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              required
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Code2 className="h-4 w-4 text-primary" />
              DDL Script <span className="text-destructive">*</span>
            </label>
            <textarea
              value={ddlScript}
              onChange={(e) => onDdlScriptChange(e.target.value)}
              rows={8}
              placeholder="CREATE TABLE students (..."
              className="flex w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm placeholder:text-muted-foreground transition-colors focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              required
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="text-sm font-medium text-foreground">Mô tả</label>
            <textarea
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              rows={3}
              placeholder="Mô tả ngắn về đặc tả CSDL..."
              className="flex w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground transition-colors focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </div>
      </div>

      <EntitiesEditor
        entities={entities}
        onAddEntity={onAddEntity}
        onRemoveEntity={onRemoveEntity}
        onMoveEntity={onMoveEntity}
        onUpdateEntity={onUpdateEntity}
        onAddAttribute={onAddAttribute}
        onUpdateAttribute={onUpdateAttribute}
        onRemoveAttribute={onRemoveAttribute}
      />

      <DatasetsEditor
        datasets={datasets}
        onAdd={onAddDataset}
        onUpdate={onUpdateDataset}
        onRemove={onRemoveDataset}
        onMove={onMoveDataset}
      />

      <div className="sticky bottom-2 z-10 flex justify-end gap-3 rounded-xl border border-border/60 bg-card/95 px-3 py-2 backdrop-blur">
        <Button type="button" variant="outline" onClick={onCancel}>
          Hủy
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          className="min-w-[150px] gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {isEditMode ? 'Đang lưu...' : 'Đang tạo...'}
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              {isEditMode ? 'Lưu chỉnh sửa' : 'Tạo đặc tả CSDL'}
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
