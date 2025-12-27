'use client'
import React from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Database, Table } from 'lucide-react'

interface TableSchema {
  name: string
  columns: {
    name: string
    type: string
  }[]
}

interface ExamSidebarProps {
  tables: TableSchema[]
}

export default function ExamSidebar({ tables }: ExamSidebarProps) {
  return (
    <aside className="w-80 bg-sidebar border-l border-sidebar-border hidden lg:flex flex-col shrink-0">
      <Tabs defaultValue="schema" className="flex-1 flex flex-col">
        <div className="px-0 pt-0 border-b border-sidebar-border">
          <TabsList className="w-full bg-transparent p-0 h-12 rounded-none flex">
            <TabsTrigger
              value="schema"
              className="flex-1 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-sidebar-accent/50 data-[state=active]:text-primary text-muted-foreground"
            >
              Lược đồ dữ liệu
            </TabsTrigger>
            <TabsTrigger
              value="result"
              className="flex-1 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-sidebar-accent/50 data-[state=active]:text-primary text-muted-foreground"
            >
              Kết quả truy vấn
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="schema" className="flex-1 p-0 m-0 min-h-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-6">
              <div className="space-y-4">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Các bảng có sẵn
                </h3>
                {tables.map((table) => (
                  <div
                    key={table.name}
                    className="border border-sidebar-border rounded-md overflow-hidden bg-background"
                  >
                    <div className="px-3 py-2 border-b border-sidebar-border bg-sidebar-accent flex items-center gap-2">
                      <Table className="w-4 h-4 text-primary" />
                      <span className="font-mono text-sm font-medium text-sidebar-foreground">
                        {table.name}
                      </span>
                    </div>
                    <div className="p-3 space-y-2">
                      {table.columns.map((col) => (
                        <div
                          key={col.name}
                          className="flex justify-between items-center text-xs font-mono group"
                        >
                          <span className="text-muted-foreground group-hover:text-foreground transition-colors">
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
        </TabsContent>

        <TabsContent value="result" className="flex-1 p-4 m-0 min-h-0">
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-sm gap-2">
            <Database className="w-8 h-8 opacity-20" />
            <p>Chưa có kết quả truy vấn</p>
            <p className="text-xs text-muted-foreground">
              Chạy code để xem kết quả
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </aside>
  )
}
