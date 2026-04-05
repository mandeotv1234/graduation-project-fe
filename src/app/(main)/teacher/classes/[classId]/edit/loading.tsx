import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div>
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-5 w-72 mt-1" />
        </div>
      </div>

      {/* Class Info Card */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-5">
        <Skeleton className="h-6 w-32" />

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        </div>
      </div>

      {/* Students Card */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-5">
        {/* Card Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-6 w-48" />
            </div>
            <Skeleton className="h-4 w-56 mt-1" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-28 rounded-md" />
            <Skeleton className="h-9 w-24 rounded-md" />
          </div>
        </div>

        {/* Student List */}
        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-lg border border-border bg-background p-3"
            >
              <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
              <Skeleton className="h-9 flex-1 rounded-md" />
              <Skeleton className="h-9 flex-1 rounded-md" />
              <Skeleton className="h-9 w-9 shrink-0 rounded-md" />
            </div>
          ))}
        </div>
      </div>

      {/* Submit Buttons */}
      <div className="flex justify-end gap-3">
        <Skeleton className="h-10 w-24 rounded-md" />
        <Skeleton className="h-10 w-32 rounded-md" />
      </div>
    </div>
  )
}
