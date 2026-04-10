'use client'

import { useEffect, useMemo, useState } from 'react'
import { WandSparkles } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'

export type InsertDatasetSpecSource = {
  datasets?: Array<{
    id?: number
    name: string
    dataScript: string
    orderIndex: number
    isActive?: boolean
  }> | null
}

interface InsertQueryFromSpecProps {
  specification?: InsertDatasetSpecSource | null
  onApply: (sql: string) => void
}

function buildDatasetKey(dataset: {
  id?: number
  name: string
  orderIndex: number
}) {
  if (typeof dataset.id === 'number') {
    return `id:${dataset.id}`
  }
  return `name:${dataset.name}|order:${dataset.orderIndex}`
}

export function InsertQueryFromSpec({
  specification,
  onApply
}: InsertQueryFromSpecProps) {
  const availableDatasets = useMemo(() => {
    const datasets = Array.isArray(specification?.datasets)
      ? specification.datasets
      : []

    return datasets
      .filter(
        (dataset) =>
          typeof dataset.name === 'string' &&
          dataset.name.trim().length > 0 &&
          typeof dataset.dataScript === 'string' &&
          dataset.dataScript.trim().length > 0
      )
      .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0))
  }, [specification?.datasets])

  const datasetsKey = useMemo(
    () =>
      availableDatasets
        .map((dataset) => `${buildDatasetKey(dataset)}:${dataset.isActive ?? true}`)
        .join('|'),
    [availableDatasets]
  )

  const [selectedDatasetKeys, setSelectedDatasetKeys] = useState<Set<string>>(
    new Set()
  )

  useEffect(() => {
    const preferred = availableDatasets.filter(
      (dataset) => dataset.isActive !== false
    )
    const fallback = preferred.length > 0 ? preferred : availableDatasets

    setSelectedDatasetKeys(
      new Set(fallback.map((dataset) => buildDatasetKey(dataset)))
    )
  }, [datasetsKey, availableDatasets])

  if (availableDatasets.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        Chưa có dataset trong đặc tả để tạo đáp án INSERT.
      </p>
    )
  }

  const toggleDataset = (datasetKey: string, checked: boolean) => {
    setSelectedDatasetKeys((prev) => {
      const next = new Set(prev)
      if (checked) {
        next.add(datasetKey)
      } else {
        next.delete(datasetKey)
      }
      return next
    })
  }

  const handleGenerate = () => {
    if (selectedDatasetKeys.size === 0) {
      toast.error('Vui lòng chọn ít nhất một dataset.')
      return
    }

    const selectedScripts = availableDatasets
      .filter((dataset) => selectedDatasetKeys.has(buildDatasetKey(dataset)))
      .map((dataset) => dataset.dataScript.trim())
      .filter(Boolean)

    if (selectedScripts.length === 0) {
      toast.error('Không có script hợp lệ trong dataset đã chọn.')
      return
    }

    onApply(selectedScripts.join('\n\n'))
    toast.success('Đã điền đáp án INSERT từ dataset đặc tả.')
  }

  return (
    <div className="rounded-md border border-primary/25 bg-primary/5 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-foreground">
          Chọn dataset đặc tả để điền đáp án giáo viên
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 gap-1.5 text-xs"
          onClick={handleGenerate}
        >
          <WandSparkles className="h-3.5 w-3.5" />
          Điền từ dataset đã chọn
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {availableDatasets.map((dataset) => {
          const datasetKey = buildDatasetKey(dataset)
          const checked = selectedDatasetKeys.has(datasetKey)

          return (
            <label
              key={datasetKey}
              className="flex cursor-pointer items-center gap-2 rounded-md border border-border/70 bg-background/80 px-2 py-1.5"
            >
              <Checkbox
                checked={checked}
                onCheckedChange={(value) =>
                  toggleDataset(datasetKey, value === true)
                }
              />
              <span className="text-xs">
                {dataset.name} (thứ tự {dataset.orderIndex})
              </span>
            </label>
          )
        })}
      </div>
    </div>
  )
}
