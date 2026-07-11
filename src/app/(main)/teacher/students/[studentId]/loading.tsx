import { Skeleton } from '@/components/ui/skeleton'

export default function StudentDashboardLoading() {
  return (
    <div className="flex-1 space-y-8 p-8 max-w-7xl mx-auto w-full">
      {/* Banner Skeleton */}
      <div className="rounded-2xl border border-border/50 bg-surface p-8 shadow-sm">
        <div className="flex items-center gap-6">
          <Skeleton className="h-24 w-24 rounded-full" />
          <div className="space-y-3 flex-1">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-4 w-1/4" />
          </div>
          <div className="text-right">
            <Skeleton className="h-4 w-20 mb-2 ml-auto" />
            <Skeleton className="h-10 w-16 ml-auto" />
          </div>
        </div>
      </div>

      {/* Classes Grid Skeleton */}
      <div>
        <Skeleton className="h-7 w-48 mb-6" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-border/50 bg-surface p-6 shadow-sm"
            >
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/3 mb-6" />

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-8" />
                  </div>
                  <Skeleton className="h-2 w-full rounded-full" />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-8" />
                  </div>
                  <Skeleton className="h-2 w-full rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
