'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'

import { Button } from '@/components/ui/button'

interface TestCaseTabsProps {
  count: number
  activeIndex: number
  onChange: (index: number) => void
  getKey?: (index: number) => string | number
  getTitle?: (index: number) => string
  hasIssue?: (index: number) => boolean
}

export function TestCaseTabs({
  count,
  activeIndex,
  onChange,
  getKey,
  getTitle,
  hasIssue
}: TestCaseTabsProps) {
  if (count <= 0) return null

  return (
    <div className="flex w-full items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onChange(Math.max(0, activeIndex - 1))}
        disabled={activeIndex === 0}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <div className="min-w-0 flex-1 overflow-x-auto">
        <div className="inline-flex min-w-full items-center gap-2 rounded-lg border border-border bg-muted/30 p-2">
          {Array.from({ length: count }, (_, index) => {
            const isActive = index === activeIndex
            const isIssue = hasIssue?.(index) ?? false

            return (
              <Button
                key={getKey?.(index) ?? index}
                type="button"
                variant={isActive ? 'default' : 'outline'}
                size="sm"
                onClick={() => onChange(index)}
                title={getTitle?.(index)}
                className={`min-w-[60px] font-medium transition-all hover:scale-105 ${
                  isIssue
                    ? isActive
                      ? 'border-destructive bg-destructive text-destructive-foreground hover:bg-destructive/90'
                      : 'border-destructive text-destructive hover:bg-destructive/10'
                    : ''
                }`}
              >
                TC{index + 1}
              </Button>
            )
          })}
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onChange(Math.min(count - 1, activeIndex + 1))}
        disabled={activeIndex === count - 1}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
