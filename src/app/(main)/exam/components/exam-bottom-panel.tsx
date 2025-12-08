'use client'
import React from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Database, Table } from 'lucide-react'
import { TableSchema } from '@/lib/types'

interface ExamBottomPanelProps {
  tables: TableSchema[]
}

export default function ExamBottomPanel({ tables }: ExamBottomPanelProps) {
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

        <TabsContent value="result" className="flex-1 p-6 m-0 min-h-0">
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-sm gap-2">
            <Database className="w-8 h-8 opacity-20" />
            <p>Chưa có kết quả truy vấn</p>
            <p className="text-xs text-muted-foreground">
              Chạy code để xem kết quả
            </p>
          </div>
        </TabsContent>

        <TabsContent value="schema" className="flex-1 p-0 m-0 min-h-0">
          <ScrollArea className="h-full">
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {tables.map((table) => (
                  <div
                    key={table.name}
                    className="border border-border rounded-md overflow-hidden bg-background"
                  >
                    <div className="px-3 py-2 border-b border-border bg-card flex items-center gap-2">
                      <Table className="w-4 h-4 text-primary" />
                      <span className="font-mono text-sm font-medium text-foreground">
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
      </Tabs>
    </div>
  )
}
