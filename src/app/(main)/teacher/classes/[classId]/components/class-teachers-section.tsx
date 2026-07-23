'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Mail, Shield, Trash2, UserPlus } from 'lucide-react'

import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
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
import { useApi } from '@/hooks/use-api'
import { addTeacherToClass, removeTeacherFromClass } from '@/lib/actions'
import { ClassTeacher } from '@/lib/types'
import { formatDateTime } from '@/lib/utils'

interface ClassTeachersSectionProps {
  classId: number
  creatorId: number
  currentTeacherId: number | null
  teachers: ClassTeacher[]
}

const ALLOWED_TEACHER_EMAIL_DOMAINS = ['@fit.hcmus.edu.vn'] as const
const VNG_TEST_TEACHER_EMAIL = 'manh@vng.com.vn'

function isAllowedTeacherEmail(email: string) {
  if (email === VNG_TEST_TEACHER_EMAIL) return true

  const atIndex = email.lastIndexOf('@')
  return (
    atIndex > 0 &&
    email.indexOf('@') === atIndex &&
    ALLOWED_TEACHER_EMAIL_DOMAINS.some(
      (domain) => email.substring(atIndex) === domain
    )
  )
}

export function ClassTeachersSection({
  classId,
  creatorId,
  currentTeacherId,
  teachers
}: ClassTeachersSectionProps) {
  const router = useRouter()
  const { callApi, isLoading } = useApi()
  const [email, setEmail] = useState('')
  const [isAddTeacherModalOpen, setIsAddTeacherModalOpen] = useState(false)
  const [teacherToRemove, setTeacherToRemove] = useState<ClassTeacher | null>(
    null
  )

  const isCreator = currentTeacherId === creatorId
  const sortedTeachers = useMemo(
    () =>
      [...teachers].sort((left, right) => {
        if (left.isCreator) return -1
        if (right.isCreator) return 1
        return left.fullName.localeCompare(right.fullName, 'vi')
      }),
    [teachers]
  )

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault()

    const normalizedEmail = email.trim().toLowerCase()
    if (!normalizedEmail) {
      toast.error('Vui lòng nhập email giảng viên')
      return
    }
    if (!isAllowedTeacherEmail(normalizedEmail)) {
      toast.error('Email giảng viên phải thuộc tên miền @fit.hcmus.edu.vn')
      return
    }

    const result = await callApi(
      addTeacherToClass(classId, { email: normalizedEmail })
    )

    if (result.code === 'OK') {
      setEmail('')
      setIsAddTeacherModalOpen(false)
      router.refresh()
    }
  }

  const handleRemoveTeacher = async () => {
    if (!teacherToRemove || !isCreator) return

    const result = await callApi(
      removeTeacherFromClass(classId, teacherToRemove.id)
    )

    if (result.code === 'OK') {
      setTeacherToRemove(null)
      router.refresh()
    }
  }

  const atIndex = email.indexOf('@')
  const typedDomain =
    atIndex !== -1 ? email.substring(atIndex).toLowerCase() : ''
  const suggestedDomain =
    ALLOWED_TEACHER_EMAIL_DOMAINS.find(
      (domain) => domain.startsWith(typedDomain) && domain !== typedDomain
    ) ?? ''
  const showSuggestion =
    atIndex !== -1 && typedDomain.length > 0 && Boolean(suggestedDomain)

  const suggestionText = showSuggestion
    ? suggestedDomain.substring(typedDomain.length)
    : ''

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Tab' && showSuggestion) {
      e.preventDefault()
      setEmail(email.substring(0, atIndex) + suggestedDomain)
    }
  }

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            Giáo viên phụ trách
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Quản lý quyền thao tác với lớp và bài thi.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-fit shrink-0 gap-2"
          onClick={() => setIsAddTeacherModalOpen(true)}
        >
          <UserPlus className="h-4 w-4" />
          Thêm giáo viên
        </Button>
      </div>

      <Dialog
        open={isAddTeacherModalOpen}
        onOpenChange={(open) => {
          if (!isLoading) {
            setIsAddTeacherModalOpen(open)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm giáo viên vào lớp</DialogTitle>
            <DialogDescription>
              Nhập email tài khoản giảng viên để cấp quyền quản lý lớp và bài
              thi. Có thể nhập <strong>@</strong> rồi nhấn <strong>Tab</strong>{' '}
              để hoàn thành tên miền.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddTeacher} className="space-y-3">
            <div className="relative">
              <Input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Nhập email giảng viên, ví dụ tdthao@fit.hcmus.edu.vn"
                disabled={isLoading}
                className="h-10"
              />
              {showSuggestion && (
                <div
                  className="pointer-events-none absolute inset-0 flex items-center px-3 text-sm"
                  aria-hidden="true"
                >
                  <span className="text-transparent">{email}</span>
                  <span className="text-muted-foreground opacity-60">
                    {suggestionText}
                  </span>
                </div>
              )}
            </div>
            <Button type="submit" className="w-full gap-2" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              Thêm giáo viên
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="divide-y divide-border">
        {sortedTeachers.map((teacher) => {
          const canRemove = isCreator && !teacher.isCreator
          const showRemoveAction = !teacher.isCreator

          return (
            <div
              key={teacher.id}
              className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-foreground">
                    {teacher.fullName}
                  </p>
                  {teacher.isCreator && (
                    <Badge className="gap-1 bg-amber-500 text-white hover:bg-amber-500">
                      <Shield className="h-3 w-3" />
                      Người tạo
                    </Badge>
                  )}
                  {teacher.id === currentTeacherId && (
                    <Badge variant="secondary">Bạn</Badge>
                  )}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" />
                    {teacher.email}
                  </span>
                  <span>Thêm lúc {formatDateTime(teacher.addedAt)}</span>
                </div>
              </div>

              {showRemoveAction ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-fit gap-2 border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setTeacherToRemove(teacher)}
                  disabled={isLoading || !canRemove}
                  title={
                    canRemove
                      ? 'Gỡ giáo viên khỏi lớp'
                      : 'Chỉ người tạo lớp mới có thể gỡ giáo viên'
                  }
                >
                  <Trash2 className="h-4 w-4" />
                  Gỡ khỏi lớp
                </Button>
              ) : null}
            </div>
          )
        })}
      </div>

      <AlertDialog
        open={Boolean(teacherToRemove)}
        onOpenChange={(open) => {
          if (!open) {
            setTeacherToRemove(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Gỡ giáo viên khỏi lớp?</AlertDialogTitle>
            <AlertDialogDescription>
              {teacherToRemove ? (
                <>
                  Giáo viên <strong>{teacherToRemove.fullName}</strong> sẽ mất
                  quyền truy cập vào lớp và các bài thi liên quan.
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveTeacher}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Xác nhận gỡ'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
