import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-10 w-32 rounded-md" />
      </div>

      {/* Settings Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Settings */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card rounded-lg border p-6 space-y-6">
            {/* Section Title */}
            <div className="flex items-center gap-2 border-b pb-4">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="h-6 w-32" />
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-10 w-full rounded-lg" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-10 w-full rounded-lg" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-10 w-full rounded-lg" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full rounded-lg" />
                </div>
              </div>

              <div className="space-y-2">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-32 w-full rounded-lg" />
              </div>
            </div>
          </div>

          {/* Anti-cheat Settings */}
          <div className="bg-card rounded-lg border p-6 space-y-6">
            <div className="flex items-center gap-2 border-b pb-4">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="h-6 w-48" />
            </div>

            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center justify-between py-2">
                  <div>
                    <Skeleton className="h-5 w-36" />
                    <Skeleton className="h-3 w-56 mt-1" />
                  </div>
                  <Skeleton className="h-6 w-11 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Specification Card */}
          <div className="bg-card rounded-lg border p-6 space-y-4">
            <Skeleton className="h-6 w-32" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
            <Skeleton className="h-9 w-full rounded-md" />
          </div>

          {/* Template Management */}
          <div className="bg-card rounded-lg border p-6 space-y-4">
            <Skeleton className="h-6 w-40" />
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div>
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24 mt-1" />
                  </div>
                  <Skeleton className="h-6 w-6 rounded-full" />
                </div>
              ))}
            </div>
            <Skeleton className="h-9 w-full rounded-md" />
          </div>
        </div>
      </div>
    </div>
  )
}
