'use client'

import { useEffect, useState, useTransition } from 'react'
import { ChevronLeft, ChevronRight, Users } from 'lucide-react'
import { toast } from 'sonner'

import { getAdminUsers, updateUserRole } from '@/lib/actions/admin.action'
import type { AdminUserItem } from '@/lib/types/admin.type'
import type { PaginationMeta } from '@/lib/types/teacher.type'
import { ROLES } from '@/lib/constants'
import { cn } from '@/lib/utils'

const ROLE_OPTIONS = [
  { value: ROLES.STUDENT, label: 'Sinh viên' },
  { value: ROLES.TEACHER, label: 'Giáo viên' },
  { value: ROLES.ADMIN, label: 'Admin' }
]

const ROLE_BADGE: Record<string, string> = {
  STUDENT: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  TEACHER:
    'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  ADMIN:
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
}

const ROLE_LABEL: Record<string, string> = {
  STUDENT: 'Sinh viên',
  TEACHER: 'Giáo viên',
  ADMIN: 'Admin'
}

export function UserList() {
  const [users, setUsers] = useState<AdminUserItem[]>([])
  const [pagination, setPagination] = useState<PaginationMeta | null>(null)
  const [page, setPage] = useState(1)
  const [isPending, startTransition] = useTransition()
  const [updatingId, setUpdatingId] = useState<number | null>(null)

  const fetchUsers = (p: number) => {
    startTransition(async () => {
      const res = await getAdminUsers({ page: p, size: 20 })
      if (res.data) setUsers(res.data)
      if (res.meta?.pagination) setPagination(res.meta.pagination)
    })
  }

  useEffect(() => {
    fetchUsers(page)
  }, [page])

  const handleRoleChange = async (userId: number, newRole: string) => {
    setUpdatingId(userId)
    try {
      const res = await updateUserRole(userId, newRole)
      if (res.data) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === userId ? { ...u, role: res.data!.role } : u
          )
        )
        toast.success('Cập nhật vai trò thành công')
      }
    } catch {
      toast.error('Cập nhật vai trò thất bại')
    } finally {
      setUpdatingId(null)
    }
  }

  if (isPending && users.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!isPending && users.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 text-muted-foreground">
        <Users className="h-10 w-10 opacity-30" />
        <p className="text-sm">Không có người dùng nào</p>
      </div>
    )
  }

  const totalPages = pagination ? Math.ceil(pagination.total / 20) : 1

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-border/60 bg-surface-container-lowest">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-surface-container/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Người dùng
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Vai trò hiện tại
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Trạng thái
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Ngày tạo
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Thay đổi vai trò
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-surface-container/30 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-foreground">
                        {user.fullName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
                        ROLE_BADGE[user.role] ??
                          'bg-muted text-muted-foreground'
                      )}
                    >
                      {ROLE_LABEL[user.role] ?? user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
                        user.isActive
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      )}
                    >
                      {user.isActive ? 'Hoạt động' : 'Bị khoá'}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString('vi-VN', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={user.role}
                      disabled={updatingId === user.id}
                      onChange={(e) =>
                        handleRoleChange(user.id, e.target.value)
                      }
                      className="rounded-lg border border-border/60 bg-surface-container px-2 py-1.5 text-xs text-foreground outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50 cursor-pointer"
                    >
                      {ROLE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    {updatingId === user.id && (
                      <span className="ml-2 inline-block h-3 w-3 animate-spin rounded-full border border-primary border-t-transparent align-middle" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Trang {page} / {totalPages}
            {pagination && <span> · {pagination.total} người dùng</span>}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || isPending}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 text-muted-foreground transition-colors hover:bg-surface-container disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || isPending}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 text-muted-foreground transition-colors hover:bg-surface-container disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
