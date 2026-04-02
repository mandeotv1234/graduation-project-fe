'use client'

import { Header } from './header'
import { Sidebar } from './sidebar'
import { SchemaEditor } from './schema-editor'
import { DatasetEditor } from './dataset-editor'
import { DatabaseBuilderProvider, useBuilderContext } from './builder-context'
import type { AppState } from './types'

function DatabaseBuilderInner() {
  const { activeView, activeTable, activeDataset } = useBuilderContext()

  return (
    <div className="flex flex-col bg-neutral-50 font-sans border rounded-lg overflow-hidden w-full">
      <Header />

      <div className="flex w-full min-h-[600px] flex-1 items-stretch">
        <Sidebar />

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white">
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
