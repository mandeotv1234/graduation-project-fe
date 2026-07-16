'use client'

import { useState, useTransition } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { Loader2, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { createAdminUser } from '@/lib/actions/admin.action'
import { ROLES } from '@/lib/constants'
import type { AdminUserItem } from '@/lib/types/admin.type'

const ROLE_VALUES = [ROLES.STUDENT, ROLES.TEACHER, ROLES.ADMIN] as const

const ROLE_OPTIONS = [
  { value: ROLES.STUDENT, label: 'Sinh viên' },
  { value: ROLES.TEACHER, label: 'Giáo viên' },
  { value: ROLES.ADMIN, label: 'Admin' }
]

const createUserSchema = z.object({
  role: z.enum(ROLE_VALUES, {
    error: 'Vui lòng chọn vai trò'
  }),
  email: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập email')
    .email('Email không hợp lệ')
    .regex(
      /^[^@\s]+@fit\.hcmus\.edu\.vn$/i,
      'Email phải thuộc domain @fit.hcmus.edu.vn'
    )
})

type CreateUserFormValues = z.infer<typeof createUserSchema>

interface CreateUserDialogProps {
  onCreated: (user: AdminUserItem) => void
}

export function CreateUserDialog({ onCreated }: CreateUserDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors }
  } = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      email: ''
    }
  })
  const selectedRole = watch('role')

  const handleOpenChange = (nextOpen: boolean) => {
    if (isPending) return
    setOpen(nextOpen)
    if (!nextOpen) reset()
  }

  const onSubmit = (values: CreateUserFormValues) => {
    startTransition(async () => {
      try {
        const response = await createAdminUser(values)
        if (!response.data) {
          toast.error(response.message || 'Không thể tạo người dùng')
          return
        }

        onCreated(response.data)
        toast.success('Tạo tài khoản thành công')
        reset()
        setOpen(false)
      } catch {
        toast.error('Không thể tạo người dùng')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button">
          <UserPlus />
          Thêm người dùng
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Thêm người dùng</DialogTitle>
          <DialogDescription>
            Tạo tài khoản mới cho người dùng thuộc Khoa Công nghệ Thông tin.
          </DialogDescription>
        </DialogHeader>

        <form
          id="create-user-form"
          className="space-y-4"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          <div className="space-y-2">
            <Label htmlFor="create-user-role">Vai trò</Label>
            <Controller
              name="role"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isPending}
                >
                  <SelectTrigger
                    id="create-user-role"
                    className="w-full"
                    aria-invalid={Boolean(errors.role)}
                    aria-describedby={
                      errors.role ? 'create-user-role-error' : undefined
                    }
                  >
                    <SelectValue placeholder="Chọn vai trò" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.role && (
              <p
                id="create-user-role-error"
                className="text-xs font-medium text-destructive"
              >
                {errors.role.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="create-user-email">Email</Label>
            <Input
              id="create-user-email"
              type="email"
              autoComplete="email"
              placeholder="user@fit.hcmus.edu.vn"
              disabled={isPending || !selectedRole}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={
                errors.email ? 'create-user-email-error' : undefined
              }
              {...register('email')}
            />
            {errors.email && (
              <p
                id="create-user-email-error"
                className="text-xs font-medium text-destructive"
              >
                {errors.email.message}
              </p>
            )}
          </div>
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isPending}
          >
            Hủy
          </Button>
          <Button type="submit" form="create-user-form" disabled={isPending}>
            {isPending && <Loader2 className="animate-spin" />}
            {isPending ? 'Đang tạo...' : 'Tạo tài khoản'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
