'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Ban, Loader2, Mail } from 'lucide-react'

import { toast } from 'sonner'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { useApi } from '@/hooks/use-api'
import { unbanStudent } from '@/lib/actions'
import { BannedStudentInfo } from '@/lib/types'
import { formatDateTime } from '@/lib/utils'

interface ClassBansSectionProps {
  classId: number
  bans: BannedStudentInfo[]
}

export function ClassBansSection({ classId, bans }: ClassBansSectionProps) {
  const router = useRouter()
  const { callApi, isLoading } = useApi()
  const [banToRemove, setBanToRemove] = useState<BannedStudentInfo | null>(null)

  const handleUnban = async () => {
    if (!banToRemove) return

    const result = await callApi(
      unbanStudent(classId, banToRemove.studentId),
      false
    )

    if (result.code === 'OK') {
      toast.success(`Đã bỏ cấm sinh viên ${banToRemove.fullName}`)
      setBanToRemove(null)
      router.refresh()
    }
  }

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="border-b border-border p-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <Ban className="h-5 w-5 text-destructive" />
          Sinh viên bị cấm thi
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Sinh viên bị cấm sẽ không thể bắt đầu phiên thi.
        </p>
      </div>

      {bans.length === 0 ? (
        <div className="m-4 rounded-lg border border-dashed border-border py-10 text-center">
          <Ban className="mx-auto h-8 w-8 text-muted-foreground/40" />
          <p className="mt-2 text-sm text-muted-foreground">
            Chưa có sinh viên nào bị cấm
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {bans.map((ban) => (
            <div key={ban.id} className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">
                    {ban.fullName}
                  </p>
                  <span className="mt-1 flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
                    <Mail className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{ban.email}</span>
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0 gap-1.5 border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setBanToRemove(ban)}
                  disabled={isLoading}
                >
                  Bỏ cấm
                </Button>
              </div>

              <div className="rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Lý do
                </p>
                {ban.reason?.trim() ? (
                  <p
                    className="mt-1 line-clamp-3 break-words"
                    title={ban.reason}
                  >
                    {ban.reason}
                  </p>
                ) : (
                  <p className="mt-1 italic text-muted-foreground/60">
                    Không có lý do
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span>
                  Người cấm:{' '}
                  {ban.bannedByName || ban.bannedBy || (
                    <span className="italic">Không rõ</span>
                  )}
                </span>
                <span>{formatDateTime(ban.bannedAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <AlertDialog
        open={Boolean(banToRemove)}
        onOpenChange={(open) => {
          if (!open) setBanToRemove(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bỏ cấm sinh viên?</AlertDialogTitle>
            <AlertDialogDescription>
              {banToRemove ? (
                <>
                  Sinh viên <strong>{banToRemove.fullName}</strong> sẽ được phép
                  tham gia thi lại trong lớp này.
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnban}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Xác nhận bỏ cấm'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
