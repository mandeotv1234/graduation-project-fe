'use client'
import React from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Database } from 'lucide-react'
import { ResultPanel } from '@/app/(main)/student/exams/[examId]/take/components/result-panel'
import type { ExecuteSqlResponse } from '@/lib/types'
import type { SchemaTable } from '@/app/(main)/student/exams/[examId]/take/components/sql-editor-panel'
import { SchemaFlow } from '@/app/(main)/student/exams/[examId]/take/components/schema-flow'

interface ExamTakeBottomPanelProps {
  examId: number
  schema: SchemaTable[]
  result: ExecuteSqlResponse | null
  schemaMeta?: ExecuteSqlResponse['schema']
  onSchemaMetaChange: (schema: ExecuteSqlResponse['schema']) => void
}

export function ExamTakeBottomPanel({
  examId,
  schema,
  result,
  schemaMeta,
  onSchemaMetaChange
}: ExamTakeBottomPanelProps) {
  const schemaForDisplay =
    schemaMeta && schemaMeta.length > 0
      ? schemaMeta.map((table) => ({
          tableName: table.tableName,
          columns: table.columns.map((col) => ({
            name: col.columnName,
            type: col.dataType,
            isPrimaryKey: Boolean(col.primaryKey),
            isForeignKey: Boolean(col.foreignKey),
            referencesTable: col.referencesTable ?? null,
            referencesColumn: col.referencesColumn ?? null
          }))
        }))
      : schema.map((table) => ({
          tableName: table.tableName,
          columns: table.columns.map((col) => ({
            name: col.name,
            type: col.type,
            isPrimaryKey: false,
            isForeignKey: false,
            referencesTable: null,
            referencesColumn: null
          }))
        }))

  return (
    <div className="h-full bg-card border-t border-border flex flex-col overflow-hidden">
      <Tabs defaultValue="result" className="flex-1 flex flex-col min-h-0">
        <div className="px-0 pt-0 border-b border-border">
          <TabsList className="w-full bg-transparent p-0 h-12 rounded-none flex justify-start">
            <TabsTrigger
              value="result"
              className="px-6 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-accent/50 data-[state=active]:text-primary text-muted-foreground"
            >
              Kết quả truy vấn
            </TabsTrigger>
            <TabsTrigger
              value="schema"
              className="px-6 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-accent/50 data-[state=active]:text-primary text-muted-foreground"
            >
              Lược đồ dữ liệu
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="result" className="flex-1 p-0 m-0 min-h-0">
          <ResultPanel result={result} />
        </TabsContent>

        <TabsContent value="schema" className="flex-1 p-0 m-0 min-h-0">
          {schemaMeta && schemaMeta.length > 0 ? (
            <SchemaFlow
              examId={examId}
              schemaMeta={schemaMeta}
              onSchemaMetaChange={onSchemaMetaChange}
            />
          ) : schemaForDisplay.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-sm gap-2">
              <Database className="w-8 h-8 opacity-20" />
              <p>Chưa có lược đồ dữ liệu</p>
              <p className="text-xs text-muted-foreground">
                Vui lòng tải lại hoặc thử lại sau
              </p>
            </div>
          ) : (
            <ScrollArea className="h-full">
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {schemaForDisplay.map((table) => (
                    <div
                      key={table.tableName}
                      className="border border-border rounded-md overflow-hidden bg-background"
                    >
                      {/* Fallback list view (used when schemaMeta isn't available) */}
                      <div className="px-3 py-2 border-b border-border bg-card">
                        <span className="font-mono text-sm font-medium text-foreground">
                          {table.tableName}
                        </span>
                      </div>
                      <div className="p-3 space-y-2">
                        {table.columns.map((col) => (
                          <div
                            key={col.name}
                            className="flex justify-between items-center text-xs font-mono"
                          >
                            <span className="text-muted-foreground">
                              {col.name}
                            </span>
                            <span className="text-muted-foreground">
                              {col.type}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollArea>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
