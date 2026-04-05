import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-32 rounded-md" />
      </div>

      {/* Form Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Section 1: Thông tin chung */}
          <section className="bg-card rounded-xs p-6 pb-10 shadow-sm">
            <div className="flex items-center gap-2 mb-6 border-b border-border pb-4">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <Skeleton className="h-6 w-32" />
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-10 w-full rounded-lg" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-10 w-full rounded-lg" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-10 w-full rounded-lg" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-10 w-full rounded-lg" />
                </div>
              </div>

              <div className="space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-24 w-full rounded-lg" />
              </div>

              <div className="pt-6 border-t border-border">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-5 w-28" />
                  <Skeleton className="h-6 w-11 rounded-full" />
                </div>
                <Skeleton className="h-4 w-3/4 mt-2" />
              </div>
            </div>
          </section>

          {/* Section 2: Quy định nộp bài & Điểm số */}
          <section className="bg-card rounded-xs p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6 border-b border-border pb-4">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <Skeleton className="h-6 w-48" />
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-10 w-full rounded-lg" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-10 w-full rounded-lg" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-10 w-full rounded-lg" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-10 w-full rounded-lg" />
                </div>
              </div>

              {[...Array(4)].map((_, i) => (
                <div key={i} className="pt-2 border-t border-border">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-6 w-11 rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-2/3 mt-2" />
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <section className="bg-card rounded-xs p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6 border-b border-border pb-4">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <Skeleton className="h-6 w-40" />
            </div>

            <div className="space-y-6">
              {[...Array(4)].map((_, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-5 w-36" />
                    <Skeleton className="h-6 w-11 rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-full mt-2" />
                  {i < 3 && <div className="border-t border-border mt-6" />}
                </div>
              ))}

              <div className="mt-4 p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg flex items-start gap-3">
                <Skeleton className="h-5 w-5 shrink-0 rounded-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
