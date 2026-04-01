import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Page Header Skeleton */}
      <div className="p-6 mb-0 bg-muted/20">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <Skeleton className="h-12 w-2/3 md:w-1/2 rounded-lg" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32 rounded-md" />
            <Skeleton className="h-10 w-32 rounded-md" />
          </div>
        </div>
      </div>

      <div className="rounded-xs bg-card p-6 space-y-8">
        {/* Section Header Skeleton */}
        <div className="border-l-4 border-primary/20 pl-3">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-[500px]" />
        </div>

        {/* Info Grid Skeleton */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 bg-card border border-border/50 rounded-xl p-8 space-y-8">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-6 w-40" />
            </div>

            <div className="grid grid-cols-2 gap-y-10 gap-x-12">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-6 w-32" />
                </div>
              ))}
            </div>
          </div>

          {/* Right Sidebar Skeletons */}
          <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-border/50 overflow-hidden bg-card"
              >
                <div className="bg-muted/10 px-4 py-3 border-b border-border/50 flex items-center gap-2">
                  <Skeleton className="h-5 w-5 rounded-md" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <div className="p-4 space-y-3">
                  {[...Array(5)].map((__, j) => (
                    <div
                      key={j}
                      className="flex justify-between items-center gap-4"
                    >
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Content Section Skeleton */}
        <div className="border-l-4 border-primary/20 pl-3">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-96 mb-6" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>

        {/* Questions Section Skeleton */}
        <div className="pt-8">
          <div className="flex items-center justify-between mb-6">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
