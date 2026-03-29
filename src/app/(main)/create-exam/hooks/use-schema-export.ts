'use client'

import { useCallback, useMemo, useState } from 'react'

import {
  BLOCK_REGISTRY,
  type ExamBlock,
  type SchemaDiagramBlock,
  type SqlDdlBlock,
  type SqlDmlBlock
} from '../components/common-part-blocks'
import {
  resolveScriptToRun,
  type ExistingScriptOption,
  type ScriptSourceMode
} from '../components/common-part-export.domain'
import { exportSchemaFromScript } from '../components/common-part-export.usecase'
import { buildInitialSchemaDiagram } from '@/components/shared/teacher-schema-diagram'
import type { ExecuteSqlResponse } from '@/lib/types'
import { toast } from 'sonner'

interface UseSchemaExportOptions {
  blocks: ExamBlock[]
  executeSqlInExam: (sql: string) => Promise<ExecuteSqlResponse | undefined>
  setBlocks: React.Dispatch<React.SetStateAction<ExamBlock[]>>
}

export function useSchemaExport({
  blocks,
  executeSqlInExam,
  setBlocks
}: UseSchemaExportOptions) {
  const [isSchemaDialogOpen, setIsSchemaDialogOpen] = useState(false)
  const [schemaScriptMode, setSchemaScriptMode] =
    useState<ScriptSourceMode>('existing')
  const [selectedSchemaScriptId, setSelectedSchemaScriptId] = useState('')
  const [customSchemaScript, setCustomSchemaScript] = useState('')
  const [isExportingSchema, setIsExportingSchema] = useState(false)

  const existingScriptOptions = useMemo<ExistingScriptOption[]>(
    () =>
      blocks
        .filter(
          (block): block is SqlDdlBlock | SqlDmlBlock =>
            (block.kind === 'sql-ddl' || block.kind === 'sql-dml') &&
            block.data.sql.trim().length > 0
        )
        .map((block) => ({
          id: block.id,
          title: block.title,
          sql: block.data.sql,
          kind: block.kind
        })),
    [blocks]
  )

  const schemaScriptOptions = useMemo(() => {
    const ddlOnly = existingScriptOptions.filter(
      (item) => item.kind === 'sql-ddl'
    )
    return ddlOnly.length > 0 ? ddlOnly : existingScriptOptions
  }, [existingScriptOptions])

  const openSchemaExportDialog = useCallback(() => {
    const defaultOption = schemaScriptOptions[0]
    setSchemaScriptMode(defaultOption ? 'existing' : 'custom')
    setSelectedSchemaScriptId(defaultOption?.id ?? '')
    setIsSchemaDialogOpen(true)
  }, [schemaScriptOptions])

  const exportSchemaToCommonPart = useCallback(async () => {
    const sql = resolveScriptToRun(
      schemaScriptMode,
      selectedSchemaScriptId,
      customSchemaScript,
      schemaScriptOptions
    )

    if (!sql) {
      toast.error('Vui lòng chọn script hoặc nhập script SQL để chạy')
      return
    }

    setIsExportingSchema(true)
    const result = await exportSchemaFromScript(sql, executeSqlInExam)
    setIsExportingSchema(false)

    if ('errorMessage' in result) {
      toast.error(result.errorMessage)
      return
    }

    const schema = result.schema

    const nextDiagramData = JSON.stringify(buildInitialSchemaDiagram(schema))

    setBlocks((prev) => {
      const diagramBlockIndex = prev.findIndex(
        (block) => block.kind === 'schema-diagram'
      )

      let newBlocks = [...prev]

      if (diagramBlockIndex >= 0) {
        newBlocks = newBlocks.map((block, index) => {
          if (index !== diagramBlockIndex || block.kind !== 'schema-diagram') {
            return block
          }
          return { ...block, data: { diagramData: nextDiagramData } }
        })
      } else {
        const newDiagramBlock = BLOCK_REGISTRY.find(
          (item) => item.kind === 'schema-diagram'
        )?.createBlock() as SchemaDiagramBlock | undefined
        if (newDiagramBlock) {
          newDiagramBlock.data.diagramData = nextDiagramData
          newBlocks.push(newDiagramBlock)
        }
      }

      return newBlocks
    })

    setIsSchemaDialogOpen(false)
    toast.success(`Đã xuất lược đồ ${schema.length} bảng vào phần đề chung`)
  }, [
    schemaScriptMode,
    selectedSchemaScriptId,
    customSchemaScript,
    schemaScriptOptions,
    executeSqlInExam,
    setBlocks
  ])

  return {
    isSchemaDialogOpen,
    setIsSchemaDialogOpen,
    schemaScriptMode,
    setSchemaScriptMode,
    selectedSchemaScriptId,
    setSelectedSchemaScriptId,
    customSchemaScript,
    setCustomSchemaScript,
    isExportingSchema,
    schemaScriptOptions,
    openSchemaExportDialog,
    exportSchemaToCommonPart
  }
}
