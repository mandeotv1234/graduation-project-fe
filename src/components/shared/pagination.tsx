'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  totalItems?: number
  pageSize?: number
  className?: string
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
  totalItems,
  pageSize,
  className
}: PaginationProps) {
  const safeTotalPages = Number.isFinite(totalPages)
    ? Math.max(1, Math.floor(totalPages))
    : 1
  const safePage = Number.isFinite(page)
    ? Math.min(Math.max(1, Math.floor(page)), safeTotalPages)
    : 1
  const [draftPage, setDraftPage] = useState(String(safePage))

  useEffect(() => {
    setDraftPage(String(safePage))
  }, [safePage])

  const commitPage = () => {
    const nextPage = Number(draftPage)
    if (!Number.isFinite(nextPage)) {
      setDraftPage(String(safePage))
      return
    }

    const boundedPage = Math.min(Math.max(1, nextPage), safeTotalPages)
    setDraftPage(String(boundedPage))
    if (boundedPage !== safePage) {
      onPageChange(boundedPage)
    }
  }

  const safeTotalItems =
    totalItems !== undefined && Number.isFinite(totalItems)
      ? Math.max(0, totalItems)
      : undefined
  const safePageSize =
    pageSize !== undefined && Number.isFinite(pageSize)
      ? Math.max(1, pageSize)
      : undefined
  const hasItemRange =
    safeTotalItems !== undefined && safePageSize !== undefined
  const rangeStart =
    hasItemRange && safeTotalItems > 0 ? (safePage - 1) * safePageSize + 1 : 0
  const rangeEnd = hasItemRange
    ? Math.min(safePage * safePageSize, safeTotalItems ?? 0)
    : 0

  return (
    <div
      className={cn(
        'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between',
        className
      )}
    >
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span>Page</span>
        <Input
          value={draftPage}
          inputMode="numeric"
          aria-label="Page number"
          className="h-8 w-12 px-2 text-center text-sm text-foreground"
          onChange={(event) => {
            const value = event.target.value
            if (/^\d*$/.test(value)) {
              setDraftPage(value)
            }
          }}
          onBlur={commitPage}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              event.currentTarget.blur()
            }
          }}
        />
        <span>of {safeTotalPages}</span>
        {hasItemRange && (
          <span className="ml-0 sm:ml-2">
            {rangeStart}-{rangeEnd} / {safeTotalItems}
          </span>
        )}
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled={safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled={safePage >= safeTotalPages}
          onClick={() => onPageChange(safePage + 1)}
          aria-label="Next page"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}
