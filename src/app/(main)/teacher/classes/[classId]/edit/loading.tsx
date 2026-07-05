import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      <section className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="flex flex-col gap-5 p-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 gap-3">
            <Skeleton className="mt-0.5 h-10 w-10 shrink-0 rounded-md" />
            <div className="min-w-0">
              <Skeleton className="mb-3 h-6 w-28 rounded-full" />
              <Skeleton className="h-10 w-56" />
              <Skeleton className="mt-2 h-4 w-80" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:min-w-[360px]">
            {[...Array(3)].map((_, index) => (
              <div
                key={index}
                className="rounded-lg border border-border bg-muted/30 p-3"
              >
                <Skeleton className="h-3 w-14" />
                <Skeleton className="mt-2 h-6 w-10" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="border-b border-border p-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="mt-2 h-4 w-72" />
        </div>
        <div className="grid gap-4 p-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="mt-2 h-4 w-80" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-9 w-56 rounded-md" />
            <Skeleton className="h-9 w-24 rounded-md" />
            <Skeleton className="h-9 w-28 rounded-md" />
          </div>
        </div>

        <div className="divide-y divide-border/60">
          {[...Array(8)].map((_, index) => (
            <div
              key={index}
              className="grid grid-cols-[76px_1fr_1fr_90px] gap-4 p-4"
            >
              <Skeleton className="mx-auto h-4 w-6" />
              <Skeleton className="h-9 w-full rounded-md" />
              <Skeleton className="h-9 w-full rounded-md" />
              <Skeleton className="ml-auto h-8 w-8 rounded-md" />
            </div>
          ))}
        </div>
      </section>

      <div className="flex justify-end gap-3 rounded-lg border border-border bg-card/95 p-3">
        <Skeleton className="h-10 w-24 rounded-md" />
        <Skeleton className="h-10 w-32 rounded-md" />
      </div>
    </div>
  )
}
