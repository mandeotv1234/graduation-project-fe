import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <main className="pt-4 pb-4 px-4 min-h-screen flex flex-col items-center bg-muted/20 animate-in fade-in duration-500">
      <div className="w-full max-w-3xl">
        <div className="bg-background border border-border/60 rounded-2xl p-6 sm:p-10 shadow-md space-y-8 relative overflow-hidden">
          {/* Decorative Top Bar */}
          <Skeleton className="absolute top-0 inset-x-0 h-1 w-full" />

          {/* Title */}
          <Skeleton className="h-10 sm:h-12 w-3/4" />

          {/* Info Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 bg-muted/30 p-5 rounded-xl border border-border/40">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-1.5">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-6 w-24" />
              </div>
            ))}
          </div>

          {/* Description Section */}
          <section className="space-y-4">
            <Skeleton className="h-5 w-32" />
            <div className="space-y-2 ps-5">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/6" />
            </div>
          </section>

          {/* Rules Card */}
          <section>
            <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/50 rounded-xl p-5 space-y-4">
              <Skeleton className="h-5 w-48" />
              <div className="space-y-3 pl-5">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-4 w-full" />
                ))}
              </div>
            </div>

            {/* Agreement Checkbox */}
            <div className="flex items-start sm:items-center gap-3 bg-background py-4 mt-4">
              <Skeleton className="h-5 w-5 shrink-0 rounded" />
              <Skeleton className="h-4 w-96" />
            </div>
          </section>

          {/* Start Button */}
          <div className="flex flex-col items-center pt-4">
            <Skeleton className="h-14 w-full sm:w-64 rounded-lg" />
          </div>
        </div>
      </div>
    </main>
  )
}
