'use client'

import { useEffect, useMemo, useState } from 'react'
import { WandSparkles } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  buildCreateTableSqlFromSpecSelection,
  getCreateTableSpecTables,
  type CreateTableSpecSource
} from './create-table-sql-from-spec'

interface CreateTableQueryFromSpecProps {
  specification?: CreateTableSpecSource | null
  onApply: (sql: string) => void
}

export function CreateTableQueryFromSpec({
  specification,
  onApply
}: CreateTableQueryFromSpecProps) {
  const availableTables = useMemo(
    () => getCreateTableSpecTables(specification),
    [specification]
  )

  const tableNamesKey = useMemo(
    () => availableTables.map((table) => table.tableName).join('|'),
    [availableTables]
  )

  const [selectedTables, setSelectedTables] = useState<Set<string>>(new Set())

  useEffect(() => {
    setSelectedTables(
      new Set(availableTables.map((table) => table.tableName.toUpperCase()))
    )
  }, [tableNamesKey, availableTables])

  if (availableTables.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        Chưa có bảng trong đặc tả để sinh `correctQuery`.
      </p>
    )
  }

  const toggleTable = (tableName: string, checked: boolean) => {
    const normalized = tableName.toUpperCase()
    setSelectedTables((prev) => {
      const next = new Set(prev)
      if (checked) {
        next.add(normalized)
      } else {
        next.delete(normalized)
      }
      return next
    })
  }

  const handleGenerate = () => {
    if (selectedTables.size === 0) {
      toast.error('Vui lòng chọn ít nhất một bảng.')
      return
    }

    const script = buildCreateTableSqlFromSpecSelection(
      specification,
      Array.from(selectedTables),
      { includeForeignKeys: true }
    )
    if (!script.trim()) {
      toast.error('Không thể sinh script từ các bảng đã chọn.')
      return
    }

    onApply(script)
    toast.success('Đã tạo correct query từ đặc tả.')
  }

  return (
    <div className="rounded-md border border-primary/25 bg-primary/5 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-foreground">
          Chọn bảng từ đặc tả để tạo đáp án
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 gap-1.5 text-xs"
          onClick={handleGenerate}
        >
          <WandSparkles className="h-3.5 w-3.5" />
          Tạo từ bảng đã chọn
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {availableTables.map((table) => {
          const normalized = table.tableName.toUpperCase()
          const checked = selectedTables.has(normalized)
          return (
            <label
              key={table.tableName}
              className="flex cursor-pointer items-center gap-2 rounded-md border border-border/70 bg-background/80 px-2 py-1.5"
            >
              <Checkbox
                checked={checked}
                onCheckedChange={(value) =>
                  toggleTable(table.tableName, value === true)
                }
              />
              <span className="text-xs">
                {table.tableName} ({table.columns.length} cột)
              </span>
            </label>
          )
        })}
      </div>
    </div>
  )
}
