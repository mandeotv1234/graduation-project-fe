'use client'
import React from 'react'
import { useEffect, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Database } from 'lucide-react'
import { ResultPanel } from '@/app/(main)/student/exams/[examId]/take/components/result-panel/result-panel'
import type { ExecuteSqlResponse } from '@/lib/types'
import { SchemaFlow } from '@/app/(main)/student/exams/[examId]/take/components/schema-flow/schema-flow'
import styles from '@/app/(main)/student/exams/[examId]/take/components/exam-take-bottom-panel/exam-take-bottom-panel.module.scss'

interface ExamTakeBottomPanelProps {
  examId: number
  result: ExecuteSqlResponse | null
  schemaMeta?: ExecuteSqlResponse['schema']
  onSchemaMetaChange: (schema: ExecuteSqlResponse['schema']) => void
}

export function ExamTakeBottomPanel({
  examId,
  result,
  schemaMeta,
  onSchemaMetaChange
}: ExamTakeBottomPanelProps) {
  const [activeTab, setActiveTab] = useState<'result' | 'schema'>('result')

  useEffect(() => {
    if (!result) return
    setActiveTab('result')
  }, [result])

  return (
    <div className={styles.container}>
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as 'result' | 'schema')}
        className={styles.tabs}
      >
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
          ) : (
            <div className={styles.emptyState}>
              <Database className={styles.emptyIcon} />
              <p>Chưa có lược đồ dữ liệu</p>
              <p className={styles.emptyHint}>
                Hãy chạy SQL tạo bảng để cập nhật lược đồ
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
