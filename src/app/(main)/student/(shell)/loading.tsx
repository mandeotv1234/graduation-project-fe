import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-5 w-96" />
      </div>

      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="relative overflow-hidden rounded-xl border border-border bg-card p-6 shadow-sm"
          >
            <Skeleton className="absolute inset-x-0 top-0 h-1" />

            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex-1 space-y-3">
                <div className="flex items-start gap-3">
                  <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
                  <div className="space-y-1 flex-1">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-5 w-24 rounded-full" />
                  </div>
                </div>

                <div className="flex flex-wrap gap-4">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>

              <Skeleton className="h-9 w-24 shrink-0 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
