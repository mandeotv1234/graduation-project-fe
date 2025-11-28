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
    <div className="h-full bg-slate-900 border-t border-slate-800 flex flex-col overflow-hidden">
      <Tabs defaultValue="result" className="flex-1 flex flex-col min-h-0">
        <div className="px-0 pt-0 border-b border-slate-800">
          <TabsList className="w-full bg-transparent p-0 h-12 rounded-none flex justify-start">
            <TabsTrigger
              value="result"
              className="px-6 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-slate-800/50 data-[state=active]:text-blue-400 text-slate-400"
            >
              Kết quả truy vấn
            </TabsTrigger>
            <TabsTrigger
              value="schema"
              className="px-6 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-slate-800/50 data-[state=active]:text-blue-400 text-slate-400"
            >
              Lược đồ dữ liệu
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="result" className="flex-1 p-6 m-0 min-h-0">
          <div className="h-full flex flex-col items-center justify-center text-slate-500 text-sm gap-2">
            <Database className="w-8 h-8 opacity-20" />
            <p>Chưa có kết quả truy vấn</p>
            <p className="text-xs text-slate-600">Chạy code để xem kết quả</p>
          </div>
        </TabsContent>

        <TabsContent value="schema" className="flex-1 p-0 m-0 min-h-0">
          <ScrollArea className="h-full">
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
      </Tabs>
    </div>
  )
}
