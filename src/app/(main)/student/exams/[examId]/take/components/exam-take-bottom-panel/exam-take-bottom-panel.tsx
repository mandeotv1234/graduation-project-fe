'use client'
import React from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Database } from 'lucide-react'
import { ResultPanel } from '@/app/(main)/student/exams/[examId]/take/components/result-panel/result-panel'
import type { ExecuteSqlResponse } from '@/lib/types'
import type { SchemaTable } from '@/app/(main)/student/exams/[examId]/take/components/sql-editor-panel/sql-editor-panel'
import { SchemaFlow } from '@/app/(main)/student/exams/[examId]/take/components/schema-flow/schema-flow'
import styles from '@/app/(main)/student/exams/[examId]/take/components/exam-take-bottom-panel/exam-take-bottom-panel.module.scss'

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
    <div className={styles.container}>
      <Tabs defaultValue="result" className={styles.tabs}>
        <div className={styles.tabsHeader}>
          <TabsList className={styles.tabsList}>
            <TabsTrigger value="result" className={styles.tabsTrigger}>
              Kết quả truy vấn
            </TabsTrigger>
            <TabsTrigger value="schema" className={styles.tabsTrigger}>
              Lược đồ dữ liệu
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="result" className={styles.tabsContent}>
          <ResultPanel result={result} />
        </TabsContent>

        <TabsContent value="schema" className={styles.tabsContent}>
          {schemaMeta && schemaMeta.length > 0 ? (
            <SchemaFlow
              examId={examId}
              schemaMeta={schemaMeta}
              onSchemaMetaChange={onSchemaMetaChange}
            />
          ) : schemaForDisplay.length === 0 ? (
            <div className={styles.emptyState}>
              <Database className={styles.emptyIcon} />
              <p>Chưa có lược đồ dữ liệu</p>
              <p className={styles.emptyHint}>
                Vui lòng tải lại hoặc thử lại sau
              </p>
            </div>
          ) : (
            <ScrollArea className={styles.schemaScrollArea}>
              <div className={styles.schemaContent}>
                <div className={styles.schemaGrid}>
                  {schemaForDisplay.map((table) => (
                    <div key={table.tableName} className={styles.tableCard}>
                      {/* Fallback list view (used when schemaMeta isn't available) */}
                      <div className={styles.tableHeader}>
                        <span className={styles.tableName}>
                          {table.tableName}
                        </span>
                      </div>
                      <div className={styles.tableColumns}>
                        {table.columns.map((col) => (
                          <div key={col.name} className={styles.columnRow}>
                            <span className={styles.columnName}>
                              {col.name}
                            </span>
                            <span className={styles.columnType}>
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
