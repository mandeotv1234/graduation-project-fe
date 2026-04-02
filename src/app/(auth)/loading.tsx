import { Spinner } from '@/components/ui/spinner'

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center space-y-4 py-12">
      <Spinner size={32} />
      <p className="text-sm text-muted-foreground animate-pulse">
        Đang khởi tạo phiên làm việc...
      </p>
    </div>
  )
}
