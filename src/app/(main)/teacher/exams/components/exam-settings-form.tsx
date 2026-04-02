'use client'

import { ReactNode, useEffect, useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  ArrowLeft,
  Award,
  ChevronDown,
  Clock,
  FileText,
  Loader2,
  Plus,
  Save,
  Settings,
  ShieldAlert
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { PATH } from '@/lib/constants'
import { ExamSpecification, SpecificationResponse } from '@/lib/types'
import { ToggleField } from '@/app/(main)/teacher/classes/[classId]/create-exam/components/toggle-field'

import {
  examSettingsFormSchema,
  ExamSettingsFormInput,
  ExamSettingsFormValues
} from './exam-settings-form-schema'

interface ExamSettingsFormProps {
  mode: 'create' | 'edit'
  formId: string
  pageTitle: string
  pageDescription: string
  submitLabel: string
  backHref: string
  initialValues: ExamSettingsFormInput
  onSubmit: (values: ExamSettingsFormValues) => Promise<void>
  isSubmitting: boolean
  specifications?: SpecificationResponse[]
  specificationPreview?: ExamSpecification | null
  headerActions?: ReactNode
}

function mapSpecificationPreview(
  specification: SpecificationResponse | null
): ExamSpecification | null {
  if (!specification) {
    return null
  }

  return {
    id: specification.id,
    name: specification.name,
    description: specification.description ?? '',
    entities: (specification.entities ?? []).map((entity) => ({
      entityName: entity.entityName,
      displayName: entity.displayName ?? entity.entityName,
      description: entity.description ?? '',
      orderIndex: entity.orderIndex,
      attributes: (entity.attributes ?? []).map((attribute) => ({
        attributeName: attribute.attributeName,
        dataType: attribute.dataType,
        description: attribute.description ?? '',
        isPrimaryKey: attribute.isPrimaryKey,
        isNullable: attribute.isNullable,
        orderIndex: attribute.orderIndex
      }))
    }))
  }
}

export function ExamSettingsForm({
  mode,
  formId,
  pageTitle,
  pageDescription,
  submitLabel,
  backHref,
  initialValues,
  onSubmit,
  isSubmitting,
  specifications = [],
  specificationPreview = null,
  headerActions
}: ExamSettingsFormProps) {
  const [selectedSpec, setSelectedSpec] =
    useState<SpecificationResponse | null>(null)

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors }
  } = useForm<ExamSettingsFormInput, unknown, ExamSettingsFormValues>({
    resolver: zodResolver(examSettingsFormSchema),
    defaultValues: initialValues
  })

  const specificationId = watch('specificationId')
  const autoSubmitOnViolation = watch('settings.autoSubmitOnViolation')

  useEffect(() => {
    if (mode !== 'create') {
      return
    }

    const nextSpecification =
      specifications.find((item) => item.id === Number(specificationId)) ?? null
    setSelectedSpec(nextSpecification)
  }, [mode, specificationId, specifications])

  const preview =
    mode === 'create'
      ? mapSpecificationPreview(selectedSpec)
      : specificationPreview

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="mb-2 flex items-center gap-4">
            <Link href={backHref}>
              <Button variant="ghost" size="icon" className="-ml-2">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {pageTitle}
            </h1>
          </div>
          <p className="ml-[52px] text-muted-foreground">{pageDescription}</p>
        </div>

        <div className="flex items-center gap-3">
          {headerActions}
          <Button
            type="submit"
            form={formId}
            disabled={isSubmitting}
            className="gap-2 bg-blue-600 text-white shadow-sm transition-all hover:bg-blue-700"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {submitLabel}
          </Button>
        </div>
      </div>

      <form
        id={formId}
        onSubmit={handleSubmit(onSubmit)}
        className="grid grid-cols-1 gap-8 lg:grid-cols-3"
      >
        <div className="space-y-8 lg:col-span-2">
          <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-2 border-b border-border pb-4">
              <div className="rounded-lg bg-blue-500/10 p-2 text-blue-600 dark:text-blue-400">
                <FileText className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">
                Thông tin chung
              </h2>
            </div>

            <div className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                  Tiêu đề bài thi <span className="text-destructive">*</span>
                </label>
                <Input
                  {...register('title')}
                  placeholder="VD: Bài thi CSDL - Giữa kỳ"
                  className="focus-visible:ring-blue-500"
                />
                {errors.title && (
                  <p className="mt-1 text-xs text-destructive">
                    {errors.title.message}
                  </p>
                )}
              </div>

              {mode === 'edit' && (
                <input type="hidden" {...register('specificationId')} />
              )}

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 flex items-center justify-between text-sm font-medium text-foreground">
                    <span>
                      {mode === 'create'
                        ? 'Chọn đặc tả CSDL'
                        : 'Đặc tả CSDL đã clone'}{' '}
                      <span className="text-destructive">*</span>
                    </span>
                  </label>

                  {mode === 'create' ? (
                    <>
                      <div className="relative">
                        <select
                          {...register('specificationId')}
                          className="flex h-10 w-full appearance-none rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                          <option value="0">-- Chọn đặc tả CSDL --</option>
                          {specifications.map((specification) => (
                            <option
                              key={specification.id}
                              value={specification.id}
                            >
                              {specification.name ??
                                `Specification #${specification.id}`}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      </div>
                      {errors.specificationId && (
                        <p className="mt-1 text-xs text-destructive">
                          {errors.specificationId.message}
                        </p>
                      )}
                      <div className="mt-2 flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                          Sơ đồ CSDL sinh viên sẽ làm bài.
                        </p>
                        <Link
                          href={PATH.TEACHER_SPECIFICATIONS}
                          className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
                        >
                          <Plus className="h-3 w-3" /> Tạo mới
                        </Link>
                      </div>
                    </>
                  ) : (
                    <div className="rounded-lg border border-border bg-muted/20 p-3 text-sm">
                      <p className="font-medium text-foreground">
                        {preview?.name ??
                          'Đặc tả đã được clone cùng đề thi mẫu'}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Đặc tả của đề thi mẫu đã được clone sẵn cho bài thi này.
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">
                    Thời lượng (phút){' '}
                    <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <Input
                      {...register('durationMinutes')}
                      type="number"
                      className="pl-9 focus-visible:ring-blue-500"
                    />
                    <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  </div>
                  {errors.durationMinutes && (
                    <p className="mt-1 text-xs text-destructive">
                      {errors.durationMinutes.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">
                    Thời gian bắt đầu
                  </label>
                  <Input
                    {...register('startTime')}
                    type="datetime-local"
                    className="focus-visible:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">
                    Thời gian kết thúc
                  </label>
                  <Input
                    {...register('endTime')}
                    type="datetime-local"
                    className="focus-visible:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                  Mô tả và Nội quy bài thi
                </label>
                <Textarea
                  {...register('description')}
                  rows={4}
                  placeholder="Nhập hướng dẫn làm bài, các lưu ý quan trọng cho sinh viên..."
                  className="resize-y focus-visible:ring-blue-500"
                />
              </div>

              <div className="mt-2 border-t border-border pt-6">
                <ToggleField
                  control={control}
                  name="isPublished"
                  label="Xuất bản ngay"
                  description="Nếu tắt, bài thi sẽ được lưu ở trạng thái Bản nháp và sinh viên không thể nhìn thấy."
                />
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-2 border-b border-border pb-4">
              <div className="rounded-lg bg-green-500/10 p-2 text-green-600 dark:text-green-400">
                <Award className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">
                Quy định nộp bài &amp; Điểm số
              </h2>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">
                    Số lần làm bài tối đa
                  </label>
                  <Input
                    {...register('maxAttempts')}
                    type="number"
                    min={1}
                    className="focus-visible:ring-blue-500"
                  />
                  {errors.maxAttempts && (
                    <p className="mt-1 text-xs text-destructive">
                      {errors.maxAttempts.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">
                    Ngưỡng nộp trễ (phút)
                  </label>
                  <Input
                    {...register('lateThreshold')}
                    type="number"
                    min={0}
                    className="focus-visible:ring-blue-500"
                  />
                  {errors.lateThreshold && (
                    <p className="mt-1 text-xs text-destructive">
                      {errors.lateThreshold.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 pt-2 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">
                    Phương thức tính điểm
                  </label>
                  <div className="relative">
                    <select
                      {...register('settings.gradingMethod')}
                      className="flex h-10 w-full appearance-none rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="highest_score">Lấy điểm cao nhất</option>
                      <option value="latest_score">Lấy điểm lần cuối</option>
                      <option value="average_score">Điểm trung bình</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">
                    Hiển thị điểm
                  </label>
                  <div className="relative">
                    <select
                      {...register('settings.scoreDisplayMode')}
                      className="flex h-10 w-full appearance-none rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="immediately">Ngay sau khi nộp</option>
                      <option value="after_closed">Sau khi bài thi đóng</option>
                      <option value="never">Không hiển thị</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>
              </div>

              <div className="mt-6 border-t border-border pt-6">
                <ToggleField
                  control={control}
                  name="settings.allowOvertime"
                  label="Cho phép nộp trễ"
                  description="Sinh viên có thể nộp bài sau khi hết thời gian (bị đánh dấu nộp trễ)."
                />
              </div>

              <div className="border-t border-border pt-2">
                <ToggleField
                  control={control}
                  name="settings.allowReview"
                  label="Cho phép xem lại bài"
                  description="Sinh viên có thể xem lại chi tiết bài làm sau khi có kết quả."
                />
              </div>

              <div className="border-t border-border pt-2">
                <ToggleField
                  control={control}
                  name="settings.showResultAfterSubmit"
                  label="Xem kết quả sau khi nộp bài"
                  description="Cho phép sinh viên xem ngay kết quả chi tiết từng câu khi vừa nộp bài."
                />
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="sticky top-24 rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-2 border-b border-border pb-4">
              <div className="rounded-lg bg-red-500/10 p-2 text-red-600 dark:text-red-400">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">
                Cài đặt chống gian lận
              </h2>
            </div>

            <div className="space-y-6">
              <ToggleField
                control={control}
                name="settings.preventCopyPaste"
                label="Chống Copy/Paste"
                description="Ngăn sinh viên sao chép mã hoặc dán từ bên ngoài vào trình soạn thảo bằng bàn phím và chuột."
              />
              <hr className="border-border" />
              <ToggleField
                control={control}
                name="settings.forceFullscreen"
                label="Bắt buộc toàn màn hình"
                description="Sinh viên phải duy trì chế độ toàn màn hình để làm bài. Rời khỏi sẽ bị cảnh báo."
              />
              <hr className="border-border" />
              <ToggleField
                control={control}
                name="settings.trackTabSwitch"
                label="Giám sát chuyển Tab"
                description="Ghi nhận và hiển thị số lần sinh viên rời khỏi tab làm bài thi gửi về hệ thống."
              />
              <hr className="border-border" />
              <ToggleField
                control={control}
                name="settings.autoSubmitOnViolation"
                label="Tự động nộp khi vi phạm"
                description="Hệ thống tự động thu bài nếu sinh viên vi phạm quá số lần cho phép. Chỉ hoạt động nếu giám sát được bật."
              />

              {autoSubmitOnViolation && (
                <div className="ml-8 mt-4 rounded-lg border border-border bg-muted/20 p-4">
                  <label className="mb-2 block text-sm font-medium text-foreground">
                    Số lần vi phạm tối đa cho phép
                  </label>
                  <Input
                    {...register('settings.maxViolations')}
                    type="number"
                    min={1}
                    className="max-w-[200px] focus-visible:ring-blue-500"
                  />
                  {errors.settings?.maxViolations && (
                    <p className="mt-1 text-xs text-destructive">
                      {errors.settings.maxViolations.message}
                    </p>
                  )}
                </div>
              )}

              <div className="mt-4 flex items-start gap-3 rounded-lg border border-orange-500/20 bg-orange-500/10 p-4">
                <Settings className="mt-0.5 h-5 w-5 flex-shrink-0 text-orange-600" />
                <p className="text-xs text-orange-700 dark:text-orange-400">
                  Lưu ý: Các thiết lập gian lận sẽ yêu cầu trình duyệt cấp quyền
                  đặc biệt cho ứng dụng khi bắt đầu làm bài.
                </p>
              </div>
            </div>
          </section>
        </div>
      </form>
    </div>
  )
}
