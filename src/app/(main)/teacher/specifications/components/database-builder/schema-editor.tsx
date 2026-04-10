import { Plus, Settings2, Trash2, X } from 'lucide-react'
import { ScrollBar } from '@/components/ui/scroll-area'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useBuilderContext } from './builder-context'
import { ForeignKeyDef } from './types'

export const DATA_TYPES = [
  'INT',
  'BIGINT',
  'NVARCHAR(255)',
  'NVARCHAR(MAX)',
  'VARCHAR(255)',
  'DATE',
  'DATETIME',
  'DATETIME2',
  'BIT',
  'FLOAT',
  'DECIMAL(18,2)',
  'UNIQUEIDENTIFIER'
]

function normalizeDataType(value: string) {
  return value.trim().toUpperCase()
}

export function SchemaEditor() {
  const {
    activeTable,
    tables,
    datasets,
    updateDataset,
    updateTable,
    addColumn,
    updateColumn,
    deleteColumn,
    editingColumn,
    setEditingColumn
  } = useBuilderContext()

  if (!activeTable) return null

  const dataTypeOptions = Array.from(
    new Set([
      ...DATA_TYPES,
      ...activeTable.columns
        .map((column) => normalizeDataType(column.type))
        .filter(Boolean)
    ])
  )

  const defaultDataset = datasets[0]
  const rows = defaultDataset
    ? defaultDataset.rowsByTable[activeTable.id] || []
    : []

  const addRow = () => {
    if (!defaultDataset) return
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

    updateDataset({
      ...defaultDataset,
      rowsByTable: {
        ...defaultDataset.rowsByTable,
        [activeTable.id]: [
          ...rows,
          { id: `row-${crypto.randomUUID()}`, values: newValues }
        ]
      }
    })
  }

  const updateRowValue = (rowId: string, colId: string, value: string) => {
    if (!defaultDataset) return
    updateDataset({
      ...defaultDataset,
      rowsByTable: {
        ...defaultDataset.rowsByTable,
        [activeTable.id]: rows.map((r) =>
          r.id === rowId ? { ...r, values: { ...r.values, [colId]: value } } : r
        )
      }
    })
  }

  const deleteRow = (rowId: string) => {
    if (!defaultDataset) return
    updateDataset({
      ...defaultDataset,
      rowsByTable: {
        ...defaultDataset.rowsByTable,
        [activeTable.id]: rows.filter((r) => r.id !== rowId)
      }
    })
  }

  return (
    <>
      {/* Table Header Controls */}
      <div className="p-4 border-b flex items-center gap-3 bg-neutral-50/50">
        <Input
          value={activeTable.name}
          onChange={(e) =>
            updateTable(activeTable.id, { name: e.target.value })
          }
          className="font-semibold text-lg border-transparent hover:border-input focus-visible:ring-0 px-2 w-64 bg-transparent"
        />
        <Badge variant="secondary" className="font-mono font-normal">
          {activeTable.columns.length} cols
        </Badge>
      </div>

      {/* Schema Grid */}
      <ScrollArea className="flex-1">
        <div className="p-4 min-w-max">
          <Table className="border rounded-md">
            <TableHeader>
              <TableRow className="bg-neutral-50 hover:bg-neutral-50">
                <TableHead className="w-12 border-r text-center">#</TableHead>
                {activeTable.columns.map((col) => (
                  <TableHead
                    key={col.id}
                    className="border-r min-w-[140px] w-max p-0 align-top"
                  >
                    <div className="p-3 flex flex-col gap-2 group">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 flex-1 mr-2">
                          {col.isPrimaryKey && (
                            <span
                              className="text-amber-500 shrink-0"
                              title="Primary Key"
                            >
                              🔑
                            </span>
                          )}
                          {activeTable.foreignKeys.some((fk) =>
                            fk.columnMapping.some(
                              (m) => m.sourceColumnId === col.id
                            )
                          ) && (
                            <span
                              className="text-blue-500 shrink-0"
                              title="Foreign Key"
                            >
                              🔗
                            </span>
                          )}
                          <input
                            type="text"
                            value={col.name}
                            onChange={(e) =>
                              updateColumn(activeTable.id, {
                                ...col,
                                name: e.target.value
                              })
                            }
                            className="font-semibold text-neutral-900 bg-transparent border-transparent hover:border-input focus:border-input focus:ring-1 focus:ring-ring outline-none rounded px-1 py-0.5 w-full min-w-[60px]"
                          />
                        </div>
                        <Dialog
                          open={editingColumn?.col.id === col.id}
                          onOpenChange={(open: boolean) => {
                            if (open)
                              setEditingColumn({
                                tableId: activeTable.id,
                                col: { ...col },
                                draftForeignKeys: activeTable.foreignKeys.map(
                                  (fk) => ({
                                    ...fk,
                                    columnMapping: fk.columnMapping.map(
                                      (m) => ({
                                        ...m
                                      })
                                    )
                                  })
                                )
                              })
                            else setEditingColumn(null)
                          }}
                        >
                          <DialogTrigger className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            <Settings2 className="w-3.5 h-3.5" />
                          </DialogTrigger>
                          <DialogContent className="max-w-5xl sm:max-w-5xl w-[90vw] max-h-[85vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Settings: {col.name}</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-6 py-4">
                              {editingColumn &&
                                editingColumn.col.id === col.id && (
                                  <div className="space-y-3">
                                    <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">
                                      Column Constraints
                                    </h3>
                                    <div className="flex items-center gap-6 flex-wrap">
                                      <div className="flex items-center gap-2">
                                        <input
                                          type="checkbox"
                                          id="pk"
                                          checked={
                                            editingColumn.col.isPrimaryKey
                                          }
                                          onChange={(e) =>
                                            setEditingColumn({
                                              ...editingColumn,
                                              col: {
                                                ...editingColumn.col,
                                                isPrimaryKey: e.target.checked
                                              }
                                            })
                                          }
                                          className="rounded border-gray-300"
                                        />
                                        <Label
                                          htmlFor="pk"
                                          className="font-normal"
                                        >
                                          Primary Key
                                        </Label>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <input
                                          type="checkbox"
                                          id="ai"
                                          checked={
                                            editingColumn.col.isAutoIncrement
                                          }
                                          onChange={(e) =>
                                            setEditingColumn({
                                              ...editingColumn,
                                              col: {
                                                ...editingColumn.col,
                                                isAutoIncrement:
                                                  e.target.checked
                                              }
                                            })
                                          }
                                          className="rounded border-gray-300"
                                        />
                                        <Label
                                          htmlFor="ai"
                                          className="font-normal"
                                        >
                                          Auto Increment
                                        </Label>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <input
                                          type="checkbox"
                                          id="nn"
                                          checked={editingColumn.col.isNotNull}
                                          onChange={(e) =>
                                            setEditingColumn({
                                              ...editingColumn,
                                              col: {
                                                ...editingColumn.col,
                                                isNotNull: e.target.checked
                                              }
                                            })
                                          }
                                          className="rounded border-gray-300"
                                        />
                                        <Label
                                          htmlFor="nn"
                                          className="font-normal"
                                        >
                                          Not Null
                                        </Label>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <input
                                          type="checkbox"
                                          id="uq"
                                          checked={editingColumn.col.isUnique}
                                          onChange={(e) =>
                                            setEditingColumn({
                                              ...editingColumn,
                                              col: {
                                                ...editingColumn.col,
                                                isUnique: e.target.checked
                                              }
                                            })
                                          }
                                          className="rounded border-gray-300"
                                        />
                                        <Label
                                          htmlFor="uq"
                                          className="font-normal"
                                        >
                                          Unique
                                        </Label>
                                      </div>
                                    </div>
                                  </div>
                                )}

                              <div className="border-t pt-6 space-y-4">
                                {editingColumn &&
                                  editingColumn.col.id === col.id &&
                                  (() => {
                                    const draftForeignKeys =
                                      editingColumn.draftForeignKeys
                                    const updateDraftForeignKeys = (
                                      updater: (
                                        prev: ForeignKeyDef[]
                                      ) => ForeignKeyDef[]
                                    ) => {
                                      setEditingColumn({
                                        ...editingColumn,
                                        draftForeignKeys:
                                          updater(draftForeignKeys)
                                      })
                                    }
                                    const relatedForeignKeys =
                                      draftForeignKeys.filter((fk) =>
                                        fk.columnMapping.some(
                                          (m) =>
                                            m.sourceColumnId ===
                                            editingColumn.col.id
                                        )
                                      )

                                    const addForeignKeyForCurrentColumn =
                                      () => {
                                        const newFkId = `fk-${Date.now()}`
                                        updateDraftForeignKeys((prev) => [
                                          ...prev,
                                          {
                                            id: newFkId,
                                            targetTableId: '',
                                            columnMapping: [
                                              {
                                                sourceColumnId:
                                                  editingColumn.col.id,
                                                targetColumnId: ''
                                              }
                                            ]
                                          }
                                        ])
                                      }

                                    const updateDraftFk = (
                                      fkId: string,
                                      updates: Partial<ForeignKeyDef>
                                    ) => {
                                      updateDraftForeignKeys((prev) =>
                                        prev.map((fk) =>
                                          fk.id === fkId
                                            ? { ...fk, ...updates }
                                            : fk
                                        )
                                      )
                                    }

                                    const removeDraftFk = (fkId: string) => {
                                      updateDraftForeignKeys((prev) =>
                                        prev.filter((fk) => fk.id !== fkId)
                                      )
                                    }

                                    const updateDraftFkMapping = (
                                      fkId: string,
                                      mappingIndex: number,
                                      updates: Partial<{
                                        sourceColumnId: string
                                        targetColumnId: string
                                      }>
                                    ) => {
                                      updateDraftForeignKeys((prev) =>
                                        prev.map((fk) => {
                                          if (fk.id !== fkId) return fk
                                          const nextMappings = [
                                            ...fk.columnMapping
                                          ]
                                          nextMappings[mappingIndex] = {
                                            ...nextMappings[mappingIndex],
                                            ...updates
                                          }
                                          return {
                                            ...fk,
                                            columnMapping: nextMappings
                                          }
                                        })
                                      )
                                    }

                                    const addDraftFkMapping = (
                                      fkId: string
                                    ) => {
                                      updateDraftForeignKeys((prev) =>
                                        prev.map((fk) =>
                                          fk.id === fkId
                                            ? {
                                                ...fk,
                                                columnMapping: [
                                                  ...fk.columnMapping,
                                                  {
                                                    sourceColumnId:
                                                      editingColumn.col.id,
                                                    targetColumnId: ''
                                                  }
                                                ]
                                              }
                                            : fk
                                        )
                                      )
                                    }

                                    const removeDraftFkMapping = (
                                      fkId: string,
                                      mappingIndex: number
                                    ) => {
                                      updateDraftForeignKeys((prev) =>
                                        prev.map((fk) => {
                                          if (fk.id !== fkId) return fk
                                          const nextMappings = [
                                            ...fk.columnMapping
                                          ]
                                          nextMappings.splice(mappingIndex, 1)
                                          return {
                                            ...fk,
                                            columnMapping: nextMappings
                                          }
                                        })
                                      )
                                    }

                                    return (
                                      <>
                                        <div className="flex justify-between items-center">
                                          <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">
                                            Foreign Keys của cột này
                                          </h3>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={
                                              addForeignKeyForCurrentColumn
                                            }
                                          >
                                            <Plus className="w-4 h-4 mr-2" />{' '}
                                            Add Foreign Key
                                          </Button>
                                        </div>
                                        {relatedForeignKeys.map((fk) => (
                                          <div
                                            key={fk.id}
                                            className="border p-4 rounded-md space-y-4 bg-neutral-50/50"
                                          >
                                            <div className="flex justify-between items-center">
                                              <div className="flex items-center gap-3">
                                                <Label className="font-medium text-neutral-700">
                                                  Target Table:
                                                </Label>
                                                <Select
                                                  value={fk.targetTableId}
                                                  onValueChange={(val) =>
                                                    val &&
                                                    updateDraftFk(fk.id, {
                                                      targetTableId: val,
                                                      columnMapping:
                                                        fk.columnMapping.map(
                                                          (m) => ({
                                                            ...m,
                                                            targetColumnId: ''
                                                          })
                                                        )
                                                    })
                                                  }
                                                >
                                                  <SelectTrigger className="w-[200px] bg-white">
                                                    <SelectValue placeholder="Select table" />
                                                  </SelectTrigger>
                                                  <SelectContent>
                                                    {tables
                                                      .filter(
                                                        (t) =>
                                                          t.id !==
                                                          activeTable.id
                                                      )
                                                      .map((t) => (
                                                        <SelectItem
                                                          key={t.id}
                                                          value={t.id}
                                                        >
                                                          {t.name}
                                                        </SelectItem>
                                                      ))}
                                                  </SelectContent>
                                                </Select>
                                              </div>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                                onClick={() =>
                                                  removeDraftFk(fk.id)
                                                }
                                              >
                                                <Trash2 className="w-4 h-4" />
                                              </Button>
                                            </div>

                                            {fk.targetTableId && (
                                              <div className="space-y-3 pl-4 border-l-2 border-blue-200">
                                                <Label className="text-xs text-neutral-500 uppercase font-semibold">
                                                  Column Mapping
                                                </Label>
                                                {fk.columnMapping.map(
                                                  (mapping, idx) => (
                                                    <div
                                                      key={idx}
                                                      className="flex items-center gap-3"
                                                    >
                                                      <Select
                                                        value={
                                                          mapping.sourceColumnId
                                                        }
                                                        onValueChange={(val) =>
                                                          val &&
                                                          updateDraftFkMapping(
                                                            fk.id,
                                                            idx,
                                                            {
                                                              sourceColumnId:
                                                                val
                                                            }
                                                          )
                                                        }
                                                      >
                                                        <SelectTrigger className="w-[180px] bg-white">
                                                          <SelectValue placeholder="Source Column" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                          {activeTable.columns.map(
                                                            (c) => (
                                                              <SelectItem
                                                                key={c.id}
                                                                value={c.id}
                                                              >
                                                                {c.name}
                                                              </SelectItem>
                                                            )
                                                          )}
                                                        </SelectContent>
                                                      </Select>
                                                      <span className="text-neutral-400 font-mono text-sm">
                                                        REFERENCES
                                                      </span>
                                                      <Select
                                                        value={
                                                          mapping.targetColumnId
                                                        }
                                                        onValueChange={(val) =>
                                                          val &&
                                                          updateDraftFkMapping(
                                                            fk.id,
                                                            idx,
                                                            {
                                                              targetColumnId:
                                                                val
                                                            }
                                                          )
                                                        }
                                                      >
                                                        <SelectTrigger className="w-[180px] bg-white">
                                                          <SelectValue placeholder="Target Column" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                          {tables
                                                            .find(
                                                              (t) =>
                                                                t.id ===
                                                                fk.targetTableId
                                                            )
                                                            ?.columns.map(
                                                              (c) => (
                                                                <SelectItem
                                                                  key={c.id}
                                                                  value={c.id}
                                                                >
                                                                  {c.name}
                                                                </SelectItem>
                                                              )
                                                            )}
                                                        </SelectContent>
                                                      </Select>
                                                      <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-neutral-400 hover:text-red-500"
                                                        onClick={() =>
                                                          removeDraftFkMapping(
                                                            fk.id,
                                                            idx
                                                          )
                                                        }
                                                      >
                                                        <X className="w-4 h-4" />
                                                      </Button>
                                                    </div>
                                                  )
                                                )}
                                                <Button
                                                  variant="secondary"
                                                  size="sm"
                                                  className="mt-2 text-xs"
                                                  onClick={() =>
                                                    addDraftFkMapping(fk.id)
                                                  }
                                                >
                                                  <Plus className="w-3 h-3 mr-1" />{' '}
                                                  Add Column Pair
                                                </Button>
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                        {relatedForeignKeys.length === 0 && (
                                          <div className="text-center py-6 border border-dashed rounded-md text-neutral-500 text-sm">
                                            Cột này chưa tham gia foreign key
                                            nào.
                                          </div>
                                        )}
                                      </>
                                    )
                                  })()}
                              </div>
                            </div>
                            <DialogFooter className="flex items-center justify-end">
                              <Button
                                onClick={() => {
                                  if (editingColumn) {
                                    updateTable(activeTable.id, {
                                      foreignKeys:
                                        editingColumn.draftForeignKeys
                                    })
                                    updateColumn(
                                      activeTable.id,
                                      editingColumn.col
                                    )
                                    setEditingColumn(null)
                                  }
                                }}
                              >
                                Save Changes
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteColumn(activeTable.id, col.id)}
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 text-red-500 hover:text-red-600 hover:bg-red-50 ml-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-1 items-center">
                        <Select
                          value={col.type}
                          onValueChange={(val) =>
                            val &&
                            updateColumn(activeTable.id, { ...col, type: val })
                          }
                        >
                          <SelectTrigger className="h-6 text-[10px] px-2 py-0 font-mono bg-white border-dashed w-auto min-w-20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {dataTypeOptions.map((t) => (
                              <SelectItem
                                key={t}
                                value={t}
                                className="text-xs font-mono"
                              >
                                {t}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {col.isAutoIncrement && (
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1 py-0 bg-white"
                          >
                            Auto Increment
                          </Badge>
                        )}
                        {col.isNotNull && !col.isPrimaryKey && (
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1 py-0 bg-white"
                          >
                            Not Null
                          </Badge>
                        )}
                        {col.isUnique && !col.isPrimaryKey && (
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1 py-0 bg-white"
                          >
                            Unique
                          </Badge>
                        )}
                      </div>
                    </div>
                  </TableHead>
                ))}
                <TableHead className="w-12 p-0 align-middle">
                  <div className="flex justify-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => addColumn(activeTable.id)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </TableHead>
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
                        className="w-full h-full min-h-10 px-3 py-2 bg-transparent outline-none focus:bg-blue-50/50 transition-colors"
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
                    disabled={!defaultDataset}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add row to {defaultDataset?.name || 'Default Dataset'}
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </>
  )
}
