import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <main className="pt-4 pb-4 px-4 min-h-screen flex flex-col items-center bg-muted/20">
      <div className="w-full max-w-3xl">
        <div className="bg-background border border-border/60 rounded-2xl p-6 sm:p-10 shadow-md space-y-8 relative overflow-hidden">
          {/* Title Skeleton */}
          <Skeleton className="h-12 w-3/4 rounded-lg" />

          {/* Exam Information Grid Skeleton */}
          <section>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 bg-muted/30 p-5 rounded-xl border border-border/40">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-6 w-32" />
                </div>
              ))}
            </div>
          </section>

          {/* Rules/Description Skeleton */}
          <section className="space-y-4">
            <Skeleton className="h-6 w-40 ps-5" />
            <div className="space-y-3 ps-5">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </section>

          {/* Rules Box Skeleton */}
          <section>
            <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/50 rounded-xl p-5 space-y-4">
              <Skeleton className="h-6 w-48" />
              <div className="space-y-3 pl-5">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            </div>
          </section>

          {/* Action Section */}
          <div className="flex flex-col items-center pt-4">
            <Skeleton className="h-14 w-64 rounded-xl" />
          </div>

          <div className="absolute top-0 inset-x-0 h-1 bg-muted" />
        </div>
      </div>
    </main>
  )
}
