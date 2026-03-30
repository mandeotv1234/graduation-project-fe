'use client'

import React from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Database, Table } from 'lucide-react'
import { TableSchema } from '@/lib/types'
import styles from '@/app/(main)/exam/components/exam-bottom-panel/exam-bottom-panel.module.scss'

interface ExamBottomPanelProps {
  tables: TableSchema[]
}

export default function ExamBottomPanel({ tables }: ExamBottomPanelProps) {
  return (
    <div className={styles.panelContainer}>
      <Tabs defaultValue="result" className={styles.tabsContainer}>
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
          <div className={styles.emptyState}>
            <Database className={styles.emptyIcon} />
            <p>Chưa có kết quả truy vấn</p>
            <p className={styles.emptyDescription}>Chạy code để xem kết quả</p>
          </div>
        </TabsContent>

        <TabsContent value="schema" className={styles.tabsContent}>
          <ScrollArea className={styles.scrollArea}>
            <div className={styles.schemaContainer}>
              <div className={styles.tablesGrid}>
                {tables.map((table) => (
                  <div key={table.name} className={styles.tableCard}>
                    <div className={styles.tableHeader}>
                      <Table className={styles.tableIcon} />
                      <span className={styles.tableName}>{table.name}</span>
                    </div>
                    <div className={styles.columnsList}>
                      {table.columns.map((col) => (
                        <div key={col.name} className={styles.columnItem}>
                          <span className={styles.columnName}>{col.name}</span>
                          <span className={styles.columnType}>{col.type}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  )
}
