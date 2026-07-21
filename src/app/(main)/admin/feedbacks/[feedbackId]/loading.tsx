import { Skeleton } from '@/components/ui/skeleton'

export default function AdminFeedbackDetailLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <Skeleton className="h-5 w-36" />
      <div className="space-y-3 border-b border-border/60 pb-5">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="grid gap-4 border-b border-border/60 pb-6 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-5 w-48 max-w-full" />
          </div>
        ))}
      </div>
      <Skeleton className="h-28 w-full rounded-lg" />
      <div className="grid gap-5 lg:grid-cols-2">
        <Skeleton className="h-48 w-full rounded-lg" />
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    </div>
  )
}
