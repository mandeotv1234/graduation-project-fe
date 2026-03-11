'use client'

import { AlertTriangle, ShieldAlert, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { MAX_VIOLATIONS_BEFORE_SUBMIT } from '@/lib/constants/violation'
import { hideWarning } from '@/lib/redux/slices/anti-cheat.slice'
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks'

export function ViolationWarningModal() {
  const dispatch = useAppDispatch()
  const { isWarningVisible, warningMessage, totalViolations } = useAppSelector(
    (state) => state.antiCheat
  )

  const isForceSubmit = totalViolations >= MAX_VIOLATIONS_BEFORE_SUBMIT
  const severity =
    totalViolations >= MAX_VIOLATIONS_BEFORE_SUBMIT
      ? 'critical'
      : totalViolations >= MAX_VIOLATIONS_BEFORE_SUBMIT / 2
        ? 'high'
        : 'medium'

  const handleClose = () => {
    if (!isForceSubmit) {
      dispatch(hideWarning())
    }
  }

  return (
    <AlertDialog open={isWarningVisible} onOpenChange={handleClose}>
      <AlertDialogContent
        className={`sm:max-w-md ${
          severity === 'critical'
            ? 'border-red-500 bg-red-50 dark:bg-red-950/80'
            : severity === 'high'
              ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/80'
              : 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/80'
        }`}
      >
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {severity === 'critical' ? (
              <ShieldAlert className="size-6 text-red-600" />
            ) : (
              <AlertTriangle className="size-6 text-yellow-600" />
            )}
            <span
              className={
                severity === 'critical'
                  ? 'text-red-700 dark:text-red-400'
                  : severity === 'high'
                    ? 'text-orange-700 dark:text-orange-400'
                    : 'text-yellow-700 dark:text-yellow-400'
              }
            >
              {severity === 'critical'
                ? 'Vi phạm nghiêm trọng!'
                : 'Cảnh báo vi phạm!'}
            </span>
          </AlertDialogTitle>
          <AlertDialogDescription className="text-foreground/80 pt-2 text-sm">
            {warningMessage}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Progress bar */}
        <div className="bg-background/60 rounded-lg p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Số lần vi phạm:</span>
            <span
              className={`font-bold ${
                severity === 'critical'
                  ? 'text-red-600'
                  : severity === 'high'
                    ? 'text-orange-600'
                    : 'text-yellow-600'
              }`}
            >
              {totalViolations} / {MAX_VIOLATIONS_BEFORE_SUBMIT}
            </span>
          </div>
          <div className="bg-muted mt-2 h-2 w-full overflow-hidden rounded-full">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                severity === 'critical'
                  ? 'bg-red-500'
                  : severity === 'high'
                    ? 'bg-orange-500'
                    : 'bg-yellow-500'
              }`}
              style={{
                width: `${Math.min((totalViolations / MAX_VIOLATIONS_BEFORE_SUBMIT) * 100, 100)}%`
              }}
            />
          </div>
        </div>

        <AlertDialogFooter>
          {!isForceSubmit ? (
            <Button onClick={handleClose} variant="outline" className="w-full">
              <X className="mr-2 size-4" />
              Tôi đã hiểu, tiếp tục làm bài
            </Button>
          ) : (
            <p className="w-full text-center text-sm font-medium text-red-600">
              Bài thi đang được nộp tự động...
            </p>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
