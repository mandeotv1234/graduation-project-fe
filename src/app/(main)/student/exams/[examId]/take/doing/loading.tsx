import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <div className="hidden lg:block w-[180px] xl:w-[200px] shrink-0 overflow-auto border-r border-border bg-card/40">
          <div className="p-2">
            <div className="mb-3 flex items-center justify-between">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-6 rounded-full" />
            </div>
            <div className="space-y-2">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 rounded-xl px-2 py-2 border border-transparent"
                >
                  <Skeleton className="h-7 w-7 shrink-0 rounded-full" />
                  <div className="min-w-0 flex-1 space-y-1">
                    <Skeleton className="h-4 w-full" />
                    <div className="flex items-center gap-1.5">
                      <Skeleton className="h-3 w-12" />
                      <Skeleton className="h-1 w-1 rounded-full" />
                      <Skeleton className="h-3 w-8" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="relative flex flex-1 min-w-0 flex-col overflow-hidden">
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

          <div className="shrink-0 border-b border-border bg-background px-4 py-4 sm:px-6 space-y-3">
            <Skeleton className="h-6 w-48" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>

          <div className="flex-1 min-h-0 min-w-0 flex flex-col bg-background">
            <div className="flex-1 border border-border rounded-lg bg-card/50 overflow-hidden p-4 space-y-2 m-4">
              <Skeleton className="h-4 w-full opacity-20" />
              <Skeleton className="h-4 w-4/5 opacity-20" />
              <Skeleton className="h-4 w-5/6 opacity-20" />
              <Skeleton className="h-4 w-full opacity-10" />
              <Skeleton className="h-4 w-3/4 opacity-10" />
            </div>

            <div className="h-48 border-t border-border bg-muted/10">
              <div className="flex gap-4 px-4 pt-3">
                <Skeleton className="h-8 w-32 rounded-md" />
                <Skeleton className="h-8 w-32 rounded-md" />
              </div>
              <div className="p-4">
                <Skeleton className="h-20 w-full opacity-20" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
