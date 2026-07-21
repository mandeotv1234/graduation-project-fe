import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl space-y-3 pb-20">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Skeleton className="h-8 w-36 rounded-md" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-32 rounded-md" />
          <Skeleton className="h-8 w-36 rounded-md" />
        </div>
      </div>

      <Skeleton className="h-48 w-full rounded-lg" />

      <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="space-y-3">
          <section className="rounded-lg border bg-card p-4">
            <Skeleton className="mx-auto h-4 w-20" />
            <Skeleton className="mx-auto mt-3 h-12 w-24" />
            <Skeleton className="mx-auto mt-3 h-4 w-28" />
          </section>
          <section className="space-y-3 rounded-lg border bg-card p-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </section>
        </aside>

        <main className="min-w-0 space-y-5">
          {[...Array(3)].map((_, index) => (
            <section
              key={index}
              className="overflow-hidden rounded-lg border bg-card"
            >
              <div className="flex items-center justify-between border-b p-5">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-28" />
                  <Skeleton className="h-4 w-64" />
                </div>
                <Skeleton className="h-8 w-20 rounded-full" />
              </div>
              <div className="space-y-3 p-5">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-20 w-full rounded-lg" />
              </div>
            </section>
          ))}
        </main>
      </div>
    </div>
  )
}
