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
    <aside className="w-64 bg-sidebar border-r border-sidebar-border hidden md:flex flex-col shrink-0">
      <div className="p-4 border-b border-sidebar-border">
        <h2 className="font-semibold text-sidebar-foreground">
          SQL Final Exam
        </h2>
        <p className="text-xs text-muted-foreground mt-1">Danh sách câu hỏi</p>
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
                  ? 'bg-sidebar-accent border-sidebar-border text-sidebar-accent-foreground shadow-sm'
                  : 'border-transparent text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
              )}
            >
              {q.id === selectedQuestionId ? (
                <CheckCircle2 className="w-5 h-5 text-primary" />
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
