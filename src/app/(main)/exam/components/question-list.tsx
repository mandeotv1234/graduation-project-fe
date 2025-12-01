'use client'

import { ScrollArea } from '@/components/ui/scroll-area'
import { CheckCircle2, Circle } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Question } from '@/lib/types'

interface QuestionListProps {
  questions: Question[]
  selectedQuestionId: number
  onSelectQuestion: (id: number) => void
}

export default function QuestionList({
  questions,
  selectedQuestionId,
  onSelectQuestion
}: QuestionListProps) {
  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 hidden lg:flex flex-col shrink-0">
      <div className="p-4 border-b border-slate-800">
        <h2 className="font-semibold text-slate-200">SQL Final Exam</h2>
        <p className="text-xs text-slate-400 mt-1">Danh sách câu hỏi</p>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {questions.map((q) => (
            <button
              key={q.id}
              onClick={() => onSelectQuestion(q.id)}
              className={cn(
                'w-full flex items-center gap-3 p-3 rounded-lg transition-all text-sm border',
                q.id === selectedQuestionId
                  ? 'bg-slate-800 border-slate-700 text-white shadow-sm'
                  : 'border-transparent text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              )}
            >
              {q.id === selectedQuestionId ? (
                <CheckCircle2 className="w-5 h-5 text-blue-500" />
              ) : (
                <Circle className="w-5 h-5" />
              )}
              <span className="font-medium">Câu {q.id}</span>
            </button>
          ))}
        </div>
      </ScrollArea>
    </aside>
  )
}
