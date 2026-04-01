'use client'

import { createContext, useContext, ReactNode, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useApi } from '@/hooks/use-api'
import { createSpecification, updateSpecification } from '@/lib/actions'
import { PATH } from '@/lib/constants'
import { toast } from 'sonner'
import {
  buildSchemaJson,
  buildTableData,
  generateDatasetScript,
  generateSQL,
  generateSchemaOnlySQL
} from './sql-generator'
import { AppState, ColumnDef } from './types'
import { useDatabaseBuilder } from './use-database-builder'

const EMPTY_BUILDER_STATE: AppState = { tables: [], datasets: [] }

export type DatabaseBuilderContextType = ReturnType<
  typeof useDatabaseBuilder
> & {
  editingColumn: { tableId: string; col: ColumnDef } | null
  setEditingColumn: (
    editing: { tableId: string; col: ColumnDef } | null
  ) => void
  selectedDatasetForSQL: string
  setSelectedDatasetForSQL: (id: string) => void
  handleGenerateSQL: () => string
  handleVerifyAndCreate: () => Promise<void>
  isEditMode: boolean
}

const DatabaseBuilderContext = createContext<DatabaseBuilderContextType | null>(
  null
)

interface DatabaseBuilderProviderProps {
  children: ReactNode
  specificationInfo: {
    name: string
    description: string
  }
  initialState?: AppState
  specificationId?: number // If provided, it's edit mode
}

export function DatabaseBuilderProvider({
  children,
  specificationInfo,
  initialState,
  specificationId
}: DatabaseBuilderProviderProps) {
  const effectiveInitial: AppState | undefined =
    initialState !== undefined
      ? initialState
      : specificationId != null
        ? EMPTY_BUILDER_STATE
        : undefined

  const builderState = useDatabaseBuilder(effectiveInitial)
  const { tables, datasets } = builderState
  const { callApi } = useApi()
  const router = useRouter()

  const [editingColumn, setEditingColumn] = useState<{
    tableId: string
    col: ColumnDef
  } | null>(null)

  const [selectedDatasetForSQL, setSelectedDatasetForSQL] = useState<string>(
    datasets?.[0]?.id || 'ds-1'
  )

  const isEditMode = !!specificationId

  const handleGenerateSQL = () => {
    return generateSQL(tables, datasets, selectedDatasetForSQL)
  }

  const handleVerifyAndCreate = async () => {
    if (!specificationInfo.name.trim()) {
      toast.error('Vui lòng nhập tên đặc tả CSDL')
      return
    }

    if (tables.length === 0) {
      toast.error('Cần có ít nhất một bảng trong schema')
      return
    }

    const ddlScript = generateSchemaOnlySQL(tables)
    const schemaJson = buildSchemaJson(tables)
    // we preserve original dataset id if available and map it
    const normalizedDatasets = datasets.map((dataset, index) => {
      // In edit mode, datasets may have numeric IDs coming from the backend originally,
      // however in our internal state we use string IDs like ds-xxxx
      // So if it's purely a new dataset, pass undefined for true backend id
      return {
        id: dataset.originalId,
        name: dataset.name.trim() || `Dataset ${index + 1}`,
        dataScript: generateDatasetScript(tables, dataset),
        tableData: buildTableData(tables, dataset),
        orderIndex: index + 1,
        isActive: true
      }
    })

    const payload = {
      name: specificationInfo.name.trim(),
      description: specificationInfo.description.trim() || undefined,
      ddlScript,
      schemaJson,
      datasets: normalizedDatasets
    }

    if (specificationId) {
      const result = await callApi(
        updateSpecification(specificationId, payload),
        false
      )
      if (!result.data) return

      toast.success('Cập nhật đặc tả thành công')
      router.push(PATH.TEACHER_SPECIFICATIONS)
    } else {
      const result = await callApi(createSpecification(payload), false)
      if (!result.data) return

      toast.success('Tạo đặc tả thành công')
      router.push(PATH.TEACHER_SPECIFICATIONS)
    }
  }

  const value = {
    ...builderState,
    editingColumn,
    setEditingColumn,
    selectedDatasetForSQL,
    setSelectedDatasetForSQL,
    handleGenerateSQL,
    handleVerifyAndCreate,
    isEditMode
  }

  return (
    <DatabaseBuilderContext.Provider value={value}>
      {children}
    </DatabaseBuilderContext.Provider>
  )
}

export function useBuilderContext() {
  const context = useContext(DatabaseBuilderContext)
  if (!context) {
    throw new Error(
      'useBuilderContext must be used within a DatabaseBuilderProvider'
    )
  }
  return context
}
