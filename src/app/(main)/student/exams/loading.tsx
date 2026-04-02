import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="space-y-8 p-8 animate-in fade-in duration-500 max-w-6xl mx-auto">
      <div className="flex flex-col gap-4">
        <Skeleton className="h-10 w-80 bg-primary/20 rounded-lg" />
        <Skeleton className="h-5 w-[600px] bg-muted-foreground/10 rounded-md" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="flex flex-col rounded-2xl border border-border overflow-hidden bg-card shadow-sm h-[400px]"
          >
            <Skeleton className="h-48 w-full" />
            <div className="p-6 flex-1 flex flex-col justify-between">
              <div className="space-y-3">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-4 w-2/3 opacity-70" />
              </div>
              <div className="flex flex-col gap-3 pt-6 border-t border-border">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-10 w-full rounded-xl mt-2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
