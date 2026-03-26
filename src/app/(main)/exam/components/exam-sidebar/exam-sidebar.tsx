'use client'
import React from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Database, Table } from 'lucide-react'
import { TableSchema } from '@/lib/types'
import styles from '@/app/(main)/exam/components/exam-sidebar/exam-sidebar.module.scss'

interface ExamSidebarProps {
  tables: TableSchema[]
}

export default function ExamSidebar({ tables }: ExamSidebarProps) {
  return (
    <aside className={styles.sidebarContainer}>
      <Tabs defaultValue="schema" className={styles.tabsContainer}>
        <div className={styles.tabsHeader}>
          <TabsList className={styles.tabsList}>
            <TabsTrigger value="schema" className={styles.tabsTrigger}>
              Lược đồ dữ liệu
            </TabsTrigger>
            <TabsTrigger value="result" className={styles.tabsTrigger}>
              Kết quả truy vấn
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="schema" className={styles.tabsContent}>
          <ScrollArea className={styles.scrollArea}>
            <div className={styles.schemaContainer}>
              <div className={styles.tablesSection}>
                <h3 className={styles.sectionTitle}>Các bảng có sẵn</h3>
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

        <TabsContent value="result" className={styles.tabsContent}>
          <div className={styles.emptyState}>
            <Database className={styles.emptyIcon} />
            <p>Chưa có kết quả truy vấn</p>
            <p className={styles.emptyDescription}>Chạy code để xem kết quả</p>
          </div>
        </TabsContent>
      </Tabs>
    </aside>
  )
}
