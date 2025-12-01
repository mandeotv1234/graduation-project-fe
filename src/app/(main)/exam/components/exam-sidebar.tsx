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
    <aside className="w-80 bg-slate-900 border-l border-slate-800 hidden lg:flex flex-col shrink-0">
      <Tabs defaultValue="schema" className="flex-1 flex flex-col">
        <div className="px-0 pt-0 border-b border-slate-800">
          <TabsList className="w-full bg-transparent p-0 h-12 rounded-none flex">
            <TabsTrigger
              value="schema"
              className="flex-1 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-slate-800/50 data-[state=active]:text-blue-400 text-slate-400"
            >
              Lược đồ dữ liệu
            </TabsTrigger>
            <TabsTrigger
              value="result"
              className="flex-1 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-slate-800/50 data-[state=active]:text-blue-400 text-slate-400"
            >
              Kết quả truy vấn
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="schema" className="flex-1 p-0 m-0 min-h-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-6">
              <div className="space-y-4">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Các bảng có sẵn
                </h3>
                {tables.map((table) => (
                  <div
                    key={table.name}
                    className="border border-slate-800 rounded-md overflow-hidden bg-slate-950"
                  >
                    <div className="px-3 py-2 border-b border-slate-800 bg-slate-900 flex items-center gap-2">
                      <Table className="w-4 h-4 text-blue-500" />
                      <span className="font-mono text-sm font-medium text-slate-200">
                        {table.name}
                      </span>
                    </div>
                    <div className="p-3 space-y-2">
                      {table.columns.map((col) => (
                        <div
                          key={col.name}
                          className="flex justify-between items-center text-xs font-mono group"
                        >
                          <span className="text-slate-300 group-hover:text-white transition-colors">
                            {col.name}
                          </span>
                          <span className="text-slate-500">{col.type}</span>
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
          <div className="h-full flex flex-col items-center justify-center text-slate-500 text-sm gap-2">
            <Database className="w-8 h-8 opacity-20" />
            <p>Chưa có kết quả truy vấn</p>
            <p className="text-xs text-slate-600">Chạy code để xem kết quả</p>
          </div>
        </TabsContent>
      </Tabs>
    </aside>
  )
}
