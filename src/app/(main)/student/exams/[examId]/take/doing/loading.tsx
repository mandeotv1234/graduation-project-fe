import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left: Question sidebar skeleton */}
        <div className="w-80 border-r border-border bg-card shrink-0 hidden lg:flex flex-col">
          <div className="p-4 border-b border-border">
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-full" />
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="grid grid-cols-5 gap-2">
              {[...Array(15)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-10 rounded-md" />
              ))}
            </div>
          </div>
        </div>

        {/* Right: Prompt + Editor + Bottom panel skeleton */}
        <div className="relative flex flex-1 min-w-0 flex-col overflow-hidden">
          {/* Top Header Bar Skeleton */}
          <div className="shrink-0 flex items-center justify-between border-b border-border bg-card px-4 py-2 sm:px-6">
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="hidden sm:flex flex-col items-end gap-1">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-1.5 w-32 rounded-full" />
              </div>
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-24 rounded-md" />
                <Skeleton className="h-8 w-24 rounded-md" />
              </div>
            </div>
          </div>

          {/* Prompt skeleton */}
          <div className="shrink-0 border-b border-border bg-background px-4 py-4 sm:px-6 space-y-3">
            <Skeleton className="h-6 w-48" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>

          {/* Editor Area Skeleton */}
          <div className="flex-1 min-h-0 min-w-0 flex flex-col bg-background p-4 gap-4">
            <div className="flex-1 border border-border rounded-lg bg-card/50 overflow-hidden p-4 space-y-2">
              <Skeleton className="h-4 w-full opacity-20" />
              <Skeleton className="h-4 w-4/5 opacity-20" />
              <Skeleton className="h-4 w-5/6 opacity-20" />
              <Skeleton className="h-4 w-full opacity-10" />
              <Skeleton className="h-4 w-3/4 opacity-10" />
            </div>

            {/* Result Panel Skeleton */}
            <div className="h-48 border border-border rounded-lg bg-muted/10 p-4 space-y-3">
              <div className="flex gap-4">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-24" />
              </div>
              <Skeleton className="h-20 w-full opacity-20" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
