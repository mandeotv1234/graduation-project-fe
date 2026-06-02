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
    <section className="space-y-4">
      <div>
        <h2 className="flex items-center gap-2 text-xl font-semibold text-foreground">
          <Ban className="h-5 w-5 text-destructive" />
          Sinh viên bị cấm thi
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Các sinh viên trong danh sách này sẽ không thể bắt đầu phiên thi trong
          lớp này.
        </p>
      </div>

      {bans.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-10 text-center">
          <Ban className="mx-auto h-8 w-8 text-muted-foreground/40" />
          <p className="mt-2 text-sm text-muted-foreground">
            Chưa có sinh viên nào bị cấm
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xs bg-card border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Họ tên
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Lý do
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Người cấm
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Thời gian cấm
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody>
              {bans.map((ban) => (
                <tr
                  key={ban.id}
                  className="border-b border-border/50 transition-colors hover:bg-muted/30"
                >
                  <td className="px-4 py-3 font-medium text-foreground">
                    {ban.fullName}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5" />
                      {ban.email}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground max-w-[200px]">
                    {ban.reason ?? (
                      <span className="italic text-muted-foreground/60">
                        Không có lý do
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {ban.bannedBy}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {formatDateTime(ban.bannedAt)}
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => setBanToRemove(ban)}
                      disabled={isLoading}
                    >
                      Bỏ cấm
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
