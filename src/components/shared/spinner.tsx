import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeMap = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-8 w-8'
}

export function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <Loader2
      className={cn(
        'animate-spin text-muted-foreground',
        sizeMap[size],
        className
      )}
    />
  )
}

/** Full-page loading screen */
export function PageSpinner({ label }: { label?: string }) {
  return (
    <div className="flex h-screen w-full items-center justify-center gap-3 bg-background text-muted-foreground">
      <Loader2 className="h-8 w-8 animate-spin" />
      {label && <span className="text-sm font-medium">{label}</span>}
    </div>
  )
}

/** Inline button spinner — replaces loading text inside a button */
export function ButtonSpinner({ className }: { className?: string }) {
  return <Loader2 className={cn('h-4 w-4 animate-spin', className)} />
}
