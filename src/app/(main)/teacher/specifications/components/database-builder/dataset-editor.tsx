import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { useBuilderContext } from './builder-context'

export function DatasetEditor() {
  const {
    activeDataset: dataset,
    tables,
    updateDataset: onUpdate
  } = useBuilderContext()

  const [activeTableId, setActiveTableId] = useState<string>(
    tables[0]?.id || ''
  )

  if (!dataset) return null

  const activeTable = tables.find((t) => t.id === activeTableId) || tables[0]
  // Update state immediately if activeTableId is invalid but tables exist
  if (!tables.find((t) => t.id === activeTableId) && tables.length > 0) {
    setActiveTableId(tables[0].id)
  }

  const rows = activeTable ? dataset.rowsByTable[activeTable.id] || [] : []

  const addRow = () => {
    if (!activeTable) return
    const newValues: Record<string, string> = {}
    activeTable.columns.forEach((col) => {
      if (col.isAutoIncrement) {
        let max = 0
        rows.forEach((r) => {
          const val = parseInt(r.values[col.id] || '0', 10)
          if (!isNaN(val) && val > max) max = val
        })
        newValues[col.id] = (max + 1).toString()
      }
    })

    onUpdate({
      ...dataset,
      rowsByTable: {
        ...dataset.rowsByTable,
        [activeTable.id]: [
          ...rows,
          { id: `row-${crypto.randomUUID()}`, values: newValues }
        ]
      }
    })
  }

  const updateRowValue = (rowId: string, colId: string, value: string) => {
    if (!activeTable) return
    onUpdate({
      ...dataset,
      rowsByTable: {
        ...dataset.rowsByTable,
        [activeTable.id]: rows.map((r) =>
          r.id === rowId ? { ...r, values: { ...r.values, [colId]: value } } : r
        )
      }
    })
  }

  const deleteRow = (rowId: string) => {
    if (!activeTable) return
    onUpdate({
      ...dataset,
      rowsByTable: {
        ...dataset.rowsByTable,
        [activeTable.id]: rows.filter((r) => r.id !== rowId)
      }
    })
  }

  if (!activeTable) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-4 border-b flex items-center gap-3 bg-neutral-50/50">
          <Input
            value={dataset.name}
            onChange={(e) => onUpdate({ ...dataset, name: e.target.value })}
            className="font-semibold text-lg border-transparent hover:border-input focus-visible:ring-0 px-2 w-64 bg-transparent"
          />
        </div>
        <div className="flex-1 flex items-center justify-center text-neutral-400">
          No tables defined in schema. Create a table first.
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Dataset Header */}
      <div className="p-4 border-b flex items-center gap-3 bg-neutral-50/50">
        <Input
          value={dataset.name}
          onChange={(e) => onUpdate({ ...dataset, name: e.target.value })}
          className="font-semibold text-lg border-transparent hover:border-input focus-visible:ring-0 px-2 w-64 bg-transparent"
        />
      </div>

      {/* Table Tabs */}
      <div className="flex border-b bg-neutral-50 px-2 pt-2 gap-1 overflow-x-auto">
        {tables.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTableId(t.id)}
            className={`px-4 py-2 text-sm font-medium rounded-t-md border border-b-0 transition-colors ${
              (activeTableId || activeTable.id) === t.id
                ? 'bg-white text-blue-600 border-neutral-200'
                : 'bg-transparent text-neutral-500 border-transparent hover:bg-neutral-100'
            }`}
          >
            {t.name}
          </button>
        ))}
      </div>

      {/* Grid */}
      <ScrollArea className="flex-1 bg-white">
        <div className="p-4 min-w-max">
          <Table className="border rounded-md">
            <TableHeader>
              <TableRow className="bg-neutral-50 hover:bg-neutral-50">
                <TableHead className="w-12 border-r text-center">#</TableHead>
                {activeTable.columns.map((col) => (
                  <TableHead key={col.id} className="border-r min-w-[200px]">
                    <div className="font-semibold text-neutral-900">
                      {col.name}
                    </div>
                    <div className="text-[10px] text-neutral-500 font-mono">
                      {col.type}
                    </div>
                  </TableHead>
                ))}
                <TableHead className="w-12 p-0 align-middle" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, idx) => (
                <TableRow key={row.id}>
                  <TableCell className="border-r text-center text-neutral-400 font-mono text-xs">
                    {idx + 1}
                  </TableCell>
                  {activeTable.columns.map((col) => (
                    <TableCell key={col.id} className="border-r p-0">
                      <input
                        type="text"
                        value={row.values[col.id] || ''}
                        onChange={(e) =>
                          updateRowValue(row.id, col.id, e.target.value)
                        }
                        className="w-full h-full min-h-[40px] px-3 py-2 bg-transparent outline-none focus:bg-blue-50/50 transition-colors"
                        placeholder="NULL"
                      />
                    </TableCell>
                  ))}
                  <TableCell className="p-0 align-middle">
                    <div className="flex justify-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-400 hover:text-red-600 h-8 w-8"
                        onClick={() => deleteRow(row.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell
                  colSpan={activeTable.columns.length + 2}
                  className="p-0"
                >
                  <Button
                    variant="ghost"
                    className="w-full h-10 rounded-none text-neutral-500 hover:text-blue-600 hover:bg-blue-50/50"
                    onClick={addRow}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add row to {dataset.name}
                  </Button>
                </TableCell>
              </TableRow>
              {rows.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={activeTable.columns.length + 2}
                    className="h-24 text-center text-neutral-500"
                  >
                    No data in this table. Click + to add a row.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  )
}
