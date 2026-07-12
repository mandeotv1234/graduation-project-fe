import { Loader2, Sparkles } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl space-y-5 pb-20">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Skeleton className="h-8 w-36 rounded-md" />
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-8 w-36 rounded-md" />
          <div className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary/10 px-3 text-xs font-semibold text-primary">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Đang tải feedback AI
          </div>
        </div>
      </div>

      <header className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Sparkles className="h-4 w-4 text-primary" />
          Đang phân tích bài làm và lịch sử điểm
        </div>
        <Skeleton className="h-8 w-full max-w-xl" />
        <Skeleton className="h-4 w-72" />
      </header>

      <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="space-y-4 lg:sticky lg:top-2 lg:self-start">
          <section className="rounded-lg border bg-card p-4">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="mt-3 h-12 w-24" />
            <Skeleton className="mt-2 h-4 w-36" />
          </section>

          <section className="rounded-lg border bg-card p-4">
            <Skeleton className="mb-4 h-5 w-24" />
            <div className="space-y-3">
              {[...Array(4)].map((_, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between gap-3 border-t pt-3 first:border-t-0 first:pt-0"
                >
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-14" />
                </div>
              ))}
            </div>
          </section>
        </aside>

        <main className="min-w-0 space-y-5">
          <section className="rounded-lg border bg-card p-5">
            <Skeleton className="mb-4 h-5 w-44" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-11/12" />
              <Skeleton className="h-4 w-4/5" />
            </div>
          </section>

          <section className="rounded-lg border bg-card p-5">
            <Skeleton className="mb-4 h-5 w-36" />
            <Skeleton className="h-40 w-full rounded-lg" />
          </section>

          <div className="grid gap-5 xl:grid-cols-3">
            {[...Array(3)].map((_, index) => (
              <section key={index} className="rounded-lg border bg-card p-5">
                <Skeleton className="mb-4 h-5 w-32" />
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </section>
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}
