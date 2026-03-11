'use client'

import { AlertTriangle, Eye, Shield, ShieldAlert } from 'lucide-react'

import {
  MAX_VIOLATIONS_BEFORE_SUBMIT,
  MAX_VIOLATIONS_BEFORE_WARNING,
  VIOLATION_LABELS
} from '@/lib/constants/violation'
import { useAppSelector } from '@/lib/redux/hooks'

export function ViolationBanner() {
  const { totalViolations, violations, isFullscreen } = useAppSelector(
    (state) => state.antiCheat
  )

  const severity =
    totalViolations >= MAX_VIOLATIONS_BEFORE_SUBMIT * 0.8
      ? 'critical'
      : totalViolations >= MAX_VIOLATIONS_BEFORE_WARNING
        ? 'warning'
        : 'safe'

  const recentViolations = violations.slice(-3).reverse()

  return (
    <div className="flex items-center gap-3">
      {/* Trạng thái Fullscreen */}
      <div
        className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
          isFullscreen
            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
        }`}
        title={
          isFullscreen
            ? 'Chế độ toàn màn hình đang bật'
            : 'Vui lòng bật chế độ toàn màn hình'
        }
      >
        {isFullscreen ? (
          <Shield className="size-3.5" />
        ) : (
          <ShieldAlert className="size-3.5" />
        )}
        <span className="hidden sm:inline">
          {isFullscreen ? 'Bảo mật' : 'Không an toàn'}
        </span>
      </div>

      {/* Số lần vi phạm */}
      <div className="group relative flex items-center gap-1.5">
        <Eye className="text-muted-foreground size-3.5" />
        <span
          className={`rounded-md px-2 py-1 text-xs font-medium ${
            severity === 'critical'
              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              : severity === 'warning'
                ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                : 'bg-muted text-muted-foreground'
          }`}
        >
          {severity === 'critical' && (
            <AlertTriangle className="mr-1 inline size-3" />
          )}
          {totalViolations} vi phạm
        </span>

        {/* Tooltip — recent violations */}
        <div className="pointer-events-none absolute top-full right-0 z-50 mt-2 w-64 rounded-lg border border-border bg-popover p-3 opacity-0 shadow-lg transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
          {recentViolations.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Chưa có vi phạm nào. Hãy giữ nguyên!
            </p>
          ) : (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-foreground">
                Vi phạm gần đây:
              </p>
              {recentViolations.map((v) => (
                <p key={v.id} className="text-xs text-muted-foreground">
                  • {VIOLATION_LABELS[v.type]}
                  <span className="ml-1 opacity-60">
                    ({new Date(v.timestamp).toLocaleTimeString('vi-VN')})
                  </span>
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
