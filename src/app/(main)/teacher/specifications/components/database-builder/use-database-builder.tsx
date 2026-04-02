import { useState } from 'react'
import {
  AppState,
  TableDef,
  DatasetDef,
  ColumnDef,
  ForeignKeyDef
} from './types'

export type { AppState }

export function useDatabaseBuilder(initialState?: AppState) {
  const defaultState: AppState = {
    tables: [
      {
        id: 'tbl-1',
        name: 'users',
        columns: [
          {
            id: 'col-1',
            name: 'id',
            type: 'INT',
            isPrimaryKey: true,
            isNotNull: true,
            isUnique: true,
            isAutoIncrement: true
          },
          {
            id: 'col-2',
            name: 'name',
            type: 'NVARCHAR(255)',
            isPrimaryKey: false,
            isNotNull: true,
            isUnique: false,
            isAutoIncrement: false
          }
        ],
        foreignKeys: []
      },
      {
        id: 'tbl-2',
        name: 'orders',
        columns: [
          {
            id: 'col-3',
            name: 'id',
            type: 'INT',
            isPrimaryKey: true,
            isNotNull: true,
            isUnique: true,
            isAutoIncrement: true
          },
          {
            id: 'col-4',
            name: 'userId',
            type: 'INT',
            isPrimaryKey: false,
            isNotNull: true,
            isUnique: false,
            isAutoIncrement: false
          }
        ],
        foreignKeys: [
          {
            id: 'fk-1',
            targetTableId: 'tbl-1',
            columnMapping: [
              { sourceColumnId: 'col-4', targetColumnId: 'col-1' }
            ]
          }
        ]
      }
    ],
    datasets: [
      {
        id: 'ds-1',
        name: 'Default Dataset',
        rowsByTable: {
          'tbl-1': [
            { id: 'row-1', values: { 'col-1': '1', 'col-2': 'Alice' } },
            { id: 'row-2', values: { 'col-1': '2', 'col-2': 'Bob' } }
          ],
          'tbl-2': [
            { id: 'row-3', values: { 'col-3': '1', 'col-4': '1' } },
            { id: 'row-4', values: { 'col-3': '2', 'col-4': '2' } }
          ]
        }
      }
    ]
  }

  const usedState = initialState || defaultState

  const [history, setHistory] = useState({
    past: [] as AppState[],
    present: usedState,
    future: [] as AppState[]
  })

  const [activeView, setActiveView] = useState<{
    type: 'schema' | 'dataset'
    id: string
  }>({
    type: 'schema',
    id: usedState.tables.length > 0 ? usedState.tables[0].id : ''
  })

  const updateState = (updater: (draft: AppState) => AppState) => {
    setHistory((curr) => {
      const next = updater(curr.present)
      if (curr.present === next) return curr
      return {
        past: [...curr.past, curr.present],
        present: next,
        future: []
      }
    })
  }

  const undo = () => {
    setHistory((curr) => {
      if (curr.past.length === 0) return curr
      const previous = curr.past[curr.past.length - 1]
      const newPast = curr.past.slice(0, curr.past.length - 1)
      return {
        past: newPast,
        present: previous,
        future: [curr.present, ...curr.future]
      }
    })
  }

  const redo = () => {
    setHistory((curr) => {
      if (curr.future.length === 0) return curr
      const next = curr.future[0]
      const newFuture = curr.future.slice(1)
      return {
        past: [...curr.past, curr.present],
        present: next,
        future: newFuture
      }
    })
  }

  const { tables, datasets } = history.present
  const activeTable =
    activeView.type === 'schema'
      ? tables.find((t) => t.id === activeView.id)
      : null
  const activeDataset =
    activeView.type === 'dataset'
      ? datasets.find((d) => d.id === activeView.id)
      : null

  // --- Schema Actions ---
  const addTable = () => {
    const newTableId = `tbl-${Date.now()}`
    updateState((draft) => ({
      ...draft,
      tables: [
        ...draft.tables,
        {
          id: newTableId,
          name: `table_${draft.tables.length + 1}`,
          columns: [
            {
              id: `col-${Date.now()}`,
              name: 'id',
              type: 'INT',
              isPrimaryKey: true,
              isNotNull: true,
              isUnique: true,
              isAutoIncrement: true
            }
          ],
          foreignKeys: []
        }
      ]
    }))
    setActiveView({ type: 'schema', id: newTableId })
  }

  const deleteTable = (tableId: string) => {
    updateState((draft) => ({
      ...draft,
      tables: draft.tables.filter((t) => t.id !== tableId)
    }))
    if (activeView.type === 'schema' && activeView.id === tableId) {
      const remaining = tables.filter((t) => t.id !== tableId)
      setActiveView(
        remaining.length > 0
          ? { type: 'schema', id: remaining[0].id }
          : { type: 'schema', id: '' }
      )
    }
  }

  const updateTable = (tableId: string, updates: Partial<TableDef>) => {
    updateState((draft) => ({
      ...draft,
      tables: draft.tables.map((t) =>
        t.id === tableId ? { ...t, ...updates } : t
      )
    }))
  }

  const addColumn = (tableId: string) => {
    updateState((draft) => ({
      ...draft,
      tables: draft.tables.map((t) => {
        if (t.id === tableId) {
          return {
            ...t,
            columns: [
              ...t.columns,
              {
                id: `col-${Date.now()}`,
                name: `col_${t.columns.length + 1}`,
                type: 'NVARCHAR(255)',
                isPrimaryKey: false,
                isNotNull: false,
                isUnique: false,
                isAutoIncrement: false
              }
            ]
          }
        }
        return t
      })
    }))
  }

  const updateColumn = (tableId: string, updatedCol: ColumnDef) => {
    updateState((draft) => ({
      ...draft,
      tables: draft.tables.map((t) => {
        if (t.id === tableId) {
          return {
            ...t,
            columns: t.columns.map((c) =>
              c.id === updatedCol.id ? updatedCol : c
            )
          }
        }
        return t
      })
    }))
  }

  const deleteColumn = (tableId: string, colId: string) => {
    updateState((draft) => ({
      ...draft,
      tables: draft.tables.map((t) => {
        if (t.id === tableId) {
          return {
            ...t,
            columns: t.columns.filter((c) => c.id !== colId)
          }
        }
        return t
      }),
      // Also clean up data in datasets
      datasets: draft.datasets.map((ds) => {
        if (!ds.rowsByTable[tableId]) return ds
        return {
          ...ds,
          rowsByTable: {
            ...ds.rowsByTable,
            [tableId]: ds.rowsByTable[tableId].map((row) => {
              const newValues = { ...row.values }
              delete newValues[colId]
              return { ...row, values: newValues }
            })
          }
        }
      })
    }))
  }

  const addForeignKey = (tableId: string) => {
    updateState((draft) => ({
      ...draft,
      tables: draft.tables.map((t) => {
        if (t.id === tableId) {
          return {
            ...t,
            foreignKeys: [
              ...t.foreignKeys,
              { id: `fk-${Date.now()}`, targetTableId: '', columnMapping: [] }
            ]
          }
        }
        return t
      })
    }))
  }

  const updateForeignKey = (
    tableId: string,
    fkId: string,
    updates: Partial<ForeignKeyDef>
  ) => {
    updateState((draft) => ({
      ...draft,
      tables: draft.tables.map((t) => {
        if (t.id === tableId) {
          return {
            ...t,
            foreignKeys: t.foreignKeys.map((fk) =>
              fk.id === fkId ? { ...fk, ...updates } : fk
            )
          }
        }
        return t
      })
    }))
  }

  const removeForeignKey = (tableId: string, fkId: string) => {
    updateState((draft) => ({
      ...draft,
      tables: draft.tables.map((t) => {
        if (t.id === tableId) {
          return {
            ...t,
            foreignKeys: t.foreignKeys.filter((fk) => fk.id !== fkId)
          }
        }
        return t
      })
    }))
  }

  const addForeignKeyMapping = (tableId: string, fkId: string) => {
    updateState((draft) => ({
      ...draft,
      tables: draft.tables.map((t) => {
        if (t.id === tableId) {
          return {
            ...t,
            foreignKeys: t.foreignKeys.map((fk) => {
              if (fk.id === fkId) {
                return {
                  ...fk,
                  columnMapping: [
                    ...fk.columnMapping,
                    { sourceColumnId: '', targetColumnId: '' }
                  ]
                }
              }
              return fk
            })
          }
        }
        return t
      })
    }))
  }

  const updateForeignKeyMapping = (
    tableId: string,
    fkId: string,
    mappingIndex: number,
    updates: Partial<{ sourceColumnId: string; targetColumnId: string }>
  ) => {
    updateState((draft) => ({
      ...draft,
      tables: draft.tables.map((t) => {
        if (t.id === tableId) {
          return {
            ...t,
            foreignKeys: t.foreignKeys.map((fk) => {
              if (fk.id === fkId) {
                const newMapping = [...fk.columnMapping]
                newMapping[mappingIndex] = {
                  ...newMapping[mappingIndex],
                  ...updates
                }
                return { ...fk, columnMapping: newMapping }
              }
              return fk
            })
          }
        }
        return t
      })
    }))
  }

  const removeForeignKeyMapping = (
    tableId: string,
    fkId: string,
    mappingIndex: number
  ) => {
    updateState((draft) => ({
      ...draft,
      tables: draft.tables.map((t) => {
        if (t.id === tableId) {
          return {
            ...t,
            foreignKeys: t.foreignKeys.map((fk) => {
              if (fk.id === fkId) {
                const newMapping = [...fk.columnMapping]
                newMapping.splice(mappingIndex, 1)
                return { ...fk, columnMapping: newMapping }
              }
              return fk
            })
          }
        }
        return t
      })
    }))
  }

  // --- Dataset Actions ---
  const addDataset = () => {
    const newDatasetId = `ds-${Date.now()}`
    updateState((draft) => ({
      ...draft,
      datasets: [
        ...draft.datasets,
        {
          id: newDatasetId,
          name: `Dataset ${draft.datasets.length + 1}`,
          rowsByTable: {}
        }
      ]
    }))
    setActiveView({ type: 'dataset', id: newDatasetId })
  }

  const updateDataset = (updatedDataset: DatasetDef) => {
    updateState((draft) => ({
      ...draft,
      datasets: draft.datasets.map((ds) =>
        ds.id === updatedDataset.id ? updatedDataset : ds
      )
    }))
  }

  const deleteDataset = (datasetId: string) => {
    updateState((draft) => ({
      ...draft,
      datasets: draft.datasets.filter((ds) => ds.id !== datasetId)
    }))
    if (activeView.type === 'dataset' && activeView.id === datasetId) {
      const remaining = datasets.filter((ds) => ds.id !== datasetId)
      if (remaining.length > 0) {
        setActiveView({ type: 'dataset', id: remaining[0].id })
      } else if (tables.length > 0) {
        setActiveView({ type: 'schema', id: tables[0].id })
      } else {
        setActiveView({ type: 'schema', id: '' })
      }
    }
  }

  return {
    tables,
    datasets,
    activeView,
    setActiveView,
    activeTable,
    activeDataset,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    undo,
    redo,
    addTable,
    deleteTable,
    updateTable,
    addColumn,
    updateColumn,
    deleteColumn,
    addForeignKey,
    updateForeignKey,
    removeForeignKey,
    addForeignKeyMapping,
    updateForeignKeyMapping,
    removeForeignKeyMapping,
    addDataset,
    updateDataset,
    deleteDataset
  }
}
