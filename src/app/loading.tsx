import { Spinner } from '@/components/ui/spinner'

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm transition-all duration-300">
      <div className="relative flex flex-col items-center gap-4">
        <Spinner size={48} className="text-primary" />
        <div className="flex flex-col items-center">
          <p className="text-lg font-medium animate-pulse text-foreground">
            Đang tải dữ liệu...
          </p>
          <div className="mt-2 h-1 w-32 overflow-hidden rounded-full bg-secondary">
            <div className="h-full w-full origin-left animate-progress bg-primary" />
          </div>
        </div>
      </div>
    </div>
  )
}
