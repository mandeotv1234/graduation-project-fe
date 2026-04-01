'use client'

import Link from 'next/link'
import { Database, PencilLine, Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { SpecificationResponse } from '@/lib/types'
import { PATH } from '@/lib/constants'
import { formatDate } from '@/lib/utils'
import { useApi } from '@/hooks/use-api'
import { deleteSpecification } from '@/lib/actions/exam-specification.action'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog'

interface SpecificationsViewProps {
  initialSpecifications: SpecificationResponse[]
}

export function SpecificationsView({
  initialSpecifications
}: SpecificationsViewProps) {
  const router = useRouter()
  const { callApi } = useApi()
  const [specifications, setSpecifications] = useState(initialSpecifications)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  useEffect(() => {
    setSpecifications(initialSpecifications)
  }, [initialSpecifications])

  const handleDelete = async (id: number) => {
    setDeletingId(id)
    const result = await callApi(deleteSpecification(id))
    if (result.code === 'SUCCESS') {
      setSpecifications((prev) => prev.filter((spec) => spec.id !== id))
      router.refresh()
    }
    setDeletingId(null)
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Đặc Tả CSDL
          </h1>
          <p className="text-muted-foreground">
            Quản lý đặc tả CSDL cho bài thi
          </p>
        </div>

        <Link href={PATH.TEACHER_SPECIFICATION_CREATE}>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Tạo đặc tả CSDL
          </Button>
        </Link>
      </div>

      {specifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
          <Database className="h-10 w-10 text-muted-foreground/40" />
          <h3 className="mt-4 text-lg font-semibold text-foreground">
            Chưa có đặc tả CSDL nào
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Tạo đặc tả CSDL đầu tiên để sử dụng trong bài thi.
          </p>
          <Link href={PATH.TEACHER_SPECIFICATION_CREATE} className="mt-6">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Tạo đặc tả CSDL
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {specifications.map((spec) => (
            <div
              key={spec.id}
              className="group rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-sm"
            >
              <h3 className="font-semibold text-foreground transition-colors group-hover:text-primary">
                {spec.name}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {spec.createdAt ? formatDate(spec.createdAt) : '-'}
              </p>

              {spec.description && (
                <p className="mt-2 text-sm text-muted-foreground">
                  {spec.description}
                </p>
              )}

              <div className="mt-4 flex items-center justify-end gap-2">
                <Link href={PATH.TEACHER_SPECIFICATION_EDIT(spec.id)}>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    title="Chỉnh sửa đặc tả CSDL"
                  >
                    <PencilLine className="h-4 w-4" />
                  </Button>
                </Link>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      title="Xóa đặc tả CSDL"
                      className="text-destructive hover:text-destructive"
                      disabled={deletingId === spec.id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Xóa đặc tả CSDL?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Bạn có chắc chắn muốn xóa đặc tả CSDL "{spec.name}"
                        không? Hành động này không thể hoàn tác.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Hủy</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(spec.id)}
                        className="bg-destructive hover:bg-destructive/90"
                      >
                        {deletingId === spec.id ? 'Đang xóa...' : 'Xóa'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
