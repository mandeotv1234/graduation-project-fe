import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      <section className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="flex flex-col gap-5 p-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="mb-3 flex gap-2">
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-6 w-28 rounded-full" />
            </div>
            <Skeleton className="h-10 w-48" />
            <Skeleton className="mt-3 h-5 w-72" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-28 rounded-md" />
            <Skeleton className="h-10 w-32 rounded-md" />
          </div>
        </div>

        <div className="grid border-t border-border bg-muted/20 sm:grid-cols-2 xl:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-4">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div>
                <Skeleton className="h-7 w-12" />
                <Skeleton className="mt-1 h-4 w-20" />
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(340px,0.8fr)]">
        <div className="min-w-0 space-y-5">
          {/* Exams Section */}
          <section className="overflow-hidden rounded-lg border border-border bg-card">
            <div className="border-b border-border p-4">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="mt-2 h-4 w-64" />
            </div>
            <div className="divide-y divide-border">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-4">
                  <Skeleton className="h-11 w-11 rounded-lg" />
                  <div className="min-w-0 flex-1">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="mt-2 h-4 w-64" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-9 w-9 rounded-lg" />
                    <Skeleton className="h-9 w-9 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Students Section */}
          <section className="overflow-hidden rounded-lg border border-border bg-card">
            <div className="border-b border-border p-4">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="mt-2 h-4 w-72" />
            </div>
            <div className="divide-y divide-border/50">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4">
                  <Skeleton className="h-4 w-8" />
                  <Skeleton className="h-9 w-9 rounded-lg" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="mt-2 h-3 w-52" />
                  </div>
                  <Skeleton className="h-9 w-20 rounded-md" />
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="min-w-0 space-y-5">
          <section className="overflow-hidden rounded-lg border border-border bg-card">
            <div className="border-b border-border p-4">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="mt-2 h-4 w-full" />
            </div>
            <div className="divide-y divide-border">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="p-4">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="mt-2 h-3 w-56" />
                </div>
              ))}
            </div>
          </section>

          <section className="overflow-hidden rounded-lg border border-border bg-card">
            <div className="border-b border-border p-4">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="mt-2 h-4 w-full" />
            </div>
            <div className="m-4 rounded-lg border border-dashed border-border py-10">
              <Skeleton className="mx-auto h-8 w-8 rounded-full" />
              <Skeleton className="mx-auto mt-3 h-4 w-40" />
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}
