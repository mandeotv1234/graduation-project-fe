import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="space-y-6 p-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="space-y-2 text-primary">
          <Skeleton className="h-10 w-64 bg-primary/10" />
          <Skeleton className="h-4 w-96 bg-primary/5" />
        </div>
        <Skeleton className="h-10 w-40 rounded-full" />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>

      <div className="rounded-xl border border-border p-6 shadow-sm">
        <div className="flex items-center gap-4 mb-6">
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 py-2 border-b border-border last:border-0"
            >
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-3 w-1/3 opacity-60" />
              </div>
              <Skeleton className="h-8 w-24 rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
