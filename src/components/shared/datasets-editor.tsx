'use client'

import { ArrowDown, ArrowUp, Database, Plus, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { SpecificationDataset } from '@/lib/types'

interface DatasetsEditorProps {
  datasets: SpecificationDataset[]
  onAdd: () => void
  onUpdate: (
    index: number,
    field: keyof SpecificationDataset,
    value: string | boolean | number
  ) => void
  onRemove: (index: number) => void
  onMove: (index: number, direction: -1 | 1) => void
}

export function DatasetsEditor({
  datasets,
  onAdd,
  onUpdate,
  onRemove,
  onMove
}: DatasetsEditorProps) {
  return (
    <section className="space-y-4 rounded-xl border border-border/80 bg-background/30 p-5">
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Database className="h-4 w-4 text-primary" />
            Datasets
          </label>
          <p className="text-xs text-muted-foreground">
            Khai báo script dữ liệu mẫu cho bài thi.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onAdd}
          className="gap-1.5"
        >
          <Plus className="h-3.5 w-3.5" />
          Thêm dataset
        </Button>
      </div>

      {datasets.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border bg-muted/20 px-3 py-4 text-center text-xs text-muted-foreground">
          Chưa có dataset nào. Bạn có thể thêm nhiều dataset và sắp xếp theo thứ
          tự.
        </p>
      ) : (
        <div className="space-y-3">
          {datasets.map((dataset, index) => (
            <article
              key={`${index}-${dataset.orderIndex}`}
              className="space-y-3 rounded-xl border border-border/80 bg-card p-4"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
                  Dataset #{index + 1}
                </span>
                <input
                  type="text"
                  value={dataset.name}
                  onChange={(e) => onUpdate(index, 'name', e.target.value)}
                  placeholder="Tên dataset"
                  className="flex h-9 min-w-[220px] flex-1 rounded-md border border-border bg-background px-3 text-sm placeholder:text-muted-foreground transition-colors focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <label className="flex h-9 items-center gap-1 rounded-md border border-border bg-background px-2 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={dataset.isActive}
                    onChange={(e) =>
                      onUpdate(index, 'isActive', e.target.checked)
                    }
                  />
                  Active
                </label>
                <label className="flex h-9 items-center gap-1 rounded-md border border-border bg-background px-2 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={dataset.visibleToStudent ?? false}
                    onChange={(e) =>
                      onUpdate(index, 'visibleToStudent', e.target.checked)
                    }
                  />
                  SV xem
                </label>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onMove(index, -1)}
                  disabled={index === 0}
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onMove(index, 1)}
                  disabled={index === datasets.length - 1}
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => onRemove(index)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>

              <textarea
                value={dataset.dataScript}
                onChange={(e) => onUpdate(index, 'dataScript', e.target.value)}
                rows={8}
                placeholder="INSERT INTO ...;"
                className="flex min-h-[220px] w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-xs placeholder:text-muted-foreground transition-colors focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
