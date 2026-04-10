'use client'

import { useMemo } from 'react'
import { Header } from './header'
import { Sidebar } from './sidebar'
import { SchemaEditor } from './schema-editor'
import { DatasetEditor } from './dataset-editor'
import { DatabaseBuilderProvider, useBuilderContext } from './builder-context'
import { buildSchemaJson } from './sql-generator'
import type { AppState } from './types'
import {
  TeacherSchemaDiagram,
  buildInitialSchemaDiagram
} from '@/components/shared/teacher-schema-diagram'

function DatabaseBuilderInner() {
  const { activeView, activeTable, activeDataset, tables } = useBuilderContext()
  const schemaDiagramData = useMemo(() => {
    const schemaJson = buildSchemaJson(tables)
    const schemaForDiagram = schemaJson.map((table) => ({
      ...table,
      columns: table.columns.map((column) => ({
        ...column,
        nullable: column.nullable ?? false
      }))
    }))
    return JSON.stringify(buildInitialSchemaDiagram(schemaForDiagram))
  }, [tables])

  return (
    <div className="flex w-full flex-col font-sans">
      <div className="flex w-full min-h-[900px] flex-1 items-stretch bg-neutral-50 border rounded-lg overflow-hidden">
        <div className="flex w-full flex-col">
          <Header />

          <div className="flex min-h-[560px] min-w-0 flex-1 items-stretch">
            <Sidebar />

            {/* Main Content */}
            <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-white">
              <div className="flex-1 min-h-[560px] min-w-0 overflow-hidden">
                {activeView.type === 'schema' && activeTable ? (
                  <SchemaEditor />
                ) : activeView.type === 'dataset' && activeDataset ? (
                  <DatasetEditor />
                ) : (
                  <div className="flex-1 flex items-center justify-center text-neutral-400">
                    Select a table or dataset from the sidebar.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 border border-border/70 bg-neutral-50/70 p-4 rounded-lg">
        <div className="mb-2 text-sm font-semibold text-neutral-700">
          Lược đồ cơ sở dữ liệu hiện tại
        </div>
        <div className="h-[620px]">
          <TeacherSchemaDiagram diagramData={schemaDiagramData} />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Sơ đồ được cập nhật theo schema hiện tại trong UI Builder.
        </p>
      </div>
    </div>
  )
}

interface DatabaseBuilderProps {
  specificationInfo: {
    name: string
    description: string
  }
  initialState?: AppState
  specificationId?: number
}

export default function DatabaseBuilder({
  specificationInfo,
  initialState,
  specificationId
}: DatabaseBuilderProps) {
  return (
    <DatabaseBuilderProvider
      specificationInfo={specificationInfo}
      initialState={initialState}
      specificationId={specificationId}
    >
      <DatabaseBuilderInner />
    </DatabaseBuilderProvider>
  )
}
