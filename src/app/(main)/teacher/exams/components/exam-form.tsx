'use client'

import { useState, useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, FieldErrors } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Save,
  Database,
  Loader2,
  Eye,
  EyeOff,
  Plus,
  FileText,
  ChevronDown,
  ShieldAlert,
  Clock,
  Award,
  Settings
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ExamSpecification, SpecificationResponse } from '@/lib/types'
import { ExamSpecificationView } from '@/components/shared/exam-specification-view'
import { getSpecifications } from '@/lib/actions'

import { examSchema, ExamFormValues, ExamFormInput } from './exam-form-schema'
import { ToggleField } from './toggle-field'
import { CreateSpecificationModal } from '@/app/(main)/teacher/specifications/components/create-specification-modal'

interface ExamFormProps {
  initialData?: Partial<ExamFormInput>
  onSubmit: (data: ExamFormValues) => Promise<void>
  isLoading: boolean
  title: string
  submitLabel: string
}

export function ExamForm({
  initialData,
  onSubmit,
  isLoading,
  title,
  submitLabel
}: ExamFormProps) {
  const [specifications, setSpecifications] = useState<SpecificationResponse[]>(
    []
  )
  const [selectedSpec, setSelectedSpec] =
    useState<SpecificationResponse | null>(null)
  const [showSpecPreview, setShowSpecPreview] = useState(false)
  const [isSpecModalOpen, setIsSpecModalOpen] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    setValue,
    formState: { errors }
  } = useForm<ExamFormInput, unknown, ExamFormValues>({
    resolver: zodResolver(examSchema),
    defaultValues: {
      title: '',
      specificationId: 0,
      durationMinutes: 60,
      startTime: '',
      endTime: '',
      description: '',
      isPublished: true,
      maxAttempts: 1,
      lateThreshold: 0,
      settings: {
        preventCopyPaste: true,
        forceFullscreen: true,
        trackTabSwitch: true,
        autoSubmitOnViolation: false,
        allowReview: true,
        scoreDisplayMode: 'after_closed',
        allowOvertime: false,
        gradingMethod: 'highest_score',
        showResultAfterSubmit: false,
        maxViolations: 3
      },
      ...initialData
    }
  })

  // Handle initialData updates (e.g. after fetching)
  useEffect(() => {
    if (initialData) {
      reset({
        ...initialData
      })
    }
  }, [initialData, reset, specifications.length]) // Re-run when specs load to ensure Select matches

  useEffect(() => {
    async function fetchSpecifications() {
      const specificationsRes = await getSpecifications()
      if (specificationsRes.data) {
        setSpecifications(specificationsRes.data)
      }
    }
    fetchSpecifications()
  }, [])

  const handleSpecificationCreated = async (newSpec: SpecificationResponse) => {
    const specificationsRes = await getSpecifications()
    if (specificationsRes.data) {
      setSpecifications(specificationsRes.data)
    }
    setValue('specificationId', newSpec.id)
    setIsSpecModalOpen(false)
  }

  const specIdWatch = watch('specificationId')
  const autoSubmitOnViolation = watch('settings.autoSubmitOnViolation')

  useEffect(() => {
    if (!specIdWatch || Number(specIdWatch) === 0) {
      setSelectedSpec(null)
      setShowSpecPreview(false)
      return
    }
    const spec =
      specifications.find((s) => s.id === Number(specIdWatch)) ?? null
    setSelectedSpec(spec)
  }, [specIdWatch, specifications])

  const onFormError = (err: FieldErrors<ExamFormInput>) => {
    const errorValues = Object.values(err)
    if (errorValues.length > 0) {
      const firstError = errorValues[0]
      let message = ''

      if (firstError) {
        if ('message' in firstError && firstError.message) {
          message = String(firstError.message)
        } else if (typeof firstError === 'object') {
          const nestedValues = Object.values(firstError)
          const firstNested = nestedValues[0]
          if (
            firstNested &&
            typeof firstNested === 'object' &&
            'message' in firstNested &&
            firstNested.message
          ) {
            message = String(firstNested.message)
          }
        }
      }

      toast.error(
        `Lỗi: ${message || 'Vui lòng kiểm tra lại các trường bắt buộc'}`
      )
    }
  }

  const selectedSpecPreview: ExamSpecification | null = selectedSpec
    ? {
        id: selectedSpec.id,
        name: selectedSpec.name,
        description: selectedSpec.description ?? '',
        entities: (selectedSpec.entities ?? []).map((entity) => ({
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
    : null

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {title}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            type="submit"
            form="exam-form"
            disabled={isLoading}
            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {submitLabel}
          </Button>
        </div>
      </div>

      <form
        id="exam-form"
        onSubmit={handleSubmit(onSubmit, onFormError)}
        className="grid grid-cols-1 lg:grid-cols-3 gap-4"
      >
        {/* Left Column (Span 2) */}
        <div className="lg:col-span-2 space-y-8 mb-1">
          {/* Section 1: Thông tin cơ bản */}
          <section className="bg-card rounded-xs p-6 pb-10 mb-4 lg:col-span-2 shadow-sm">
            <div className="flex items-center gap-2 mb-6 border-b border-border pb-4">
              <div className="p-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg">
                <FileText className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">
                Thông tin chung
              </h2>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Tiêu đề bài thi <span className="text-destructive">*</span>
                </label>
                <Input
                  {...register('title')}
                  placeholder="VD: Bài thi CSDL - Giữa kỳ"
                  className="focus-visible:ring-blue-500"
                />
                {errors.title && (
                  <p className="text-destructive text-xs mt-1">
                    {errors.title.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2 flex items-center justify-between">
                    <span>
                      Chọn đặc tả CSDL{' '}
                      <span className="text-destructive">*</span>
                    </span>
                    {selectedSpec && (
                      <button
                        type="button"
                        onClick={() => setShowSpecPreview((v) => !v)}
                        className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                      >
                        {showSpecPreview ? (
                          <>
                            <EyeOff className="h-3 w-3" /> Ẩn
                          </>
                        ) : (
                          <>
                            <Eye className="h-3 w-3" /> Xem
                          </>
                        )}
                      </button>
                    )}
                  </label>
                  <div className="relative">
                    <select
                      {...register('specificationId')}
                      className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm appearance-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="0">-- Chọn đặc tả CSDL --</option>
                      {specifications.map((spec) => (
                        <option key={spec.id} value={spec.id}>
                          {spec.name ?? `Specification #${spec.id}`}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  </div>
                  {errors.specificationId && (
                    <p className="text-destructive text-xs mt-1">
                      {errors.specificationId.message}
                    </p>
                  )}
                  <div className="mt-2 flex justify-between items-center">
                    <p className="text-xs text-muted-foreground">
                      Sơ đồ CSDL sinh viên sẽ làm bài.
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsSpecModalOpen(true)}
                      className="text-blue-600 text-xs font-semibold hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Tạo mới
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Thời lượng (phút){' '}
                    <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <Input
                      {...register('durationMinutes')}
                      type="number"
                      className="pl-9 focus-visible:ring-blue-500"
                    />
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                  {errors.durationMinutes && (
                    <p className="text-destructive text-xs mt-1">
                      {errors.durationMinutes.message}
                    </p>
                  )}
                </div>
              </div>

              {showSpecPreview && selectedSpecPreview && (
                <div className="rounded-lg border-2 border-blue-500/20 bg-blue-500/5 p-4 space-y-3 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-semibold text-foreground">
                        Chi tiết đặc tả CSDL
                      </span>
                    </div>
                  </div>
                  <ExamSpecificationView
                    specification={selectedSpecPreview}
                    compact
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Thời gian bắt đầu
                  </label>
                  <Input
                    {...register('startTime')}
                    type="datetime-local"
                    className="focus-visible:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
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
                <label className="block text-sm font-medium text-foreground mb-2">
                  Mô tả và Nội quy bài thi
                </label>
                <Textarea
                  {...register('description')}
                  rows={4}
                  placeholder="Nhập hướng dẫn làm bài, các lưu ý quan trọng cho sinh viên..."
                  className="resize-y focus-visible:ring-blue-500"
                />
              </div>

              <div className="pt-6 border-t border-border mt-2">
                <ToggleField
                  control={control}
                  name="isPublished"
                  label="Xuất bản ngay"
                  description="Nếu tắt, bài thi sẽ được lưu ở trạng thái Bản nháp và sinh viên không thể nhìn thấy."
                />
              </div>
            </div>
          </section>

          {/* Section 2: Quy định nộp bài & Điểm số */}
          <section className="bg-card rounded-xs p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6 border-b border-border pb-4">
              <div className="p-2 bg-green-500/10 text-green-600 dark:text-green-400 rounded-lg">
                <Award className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">
                Quy định nộp bài &amp; Điểm số
              </h2>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Số lần làm bài tối đa
                  </label>
                  <Input
                    {...register('maxAttempts')}
                    type="number"
                    min={1}
                    className="focus-visible:ring-blue-500"
                  />
                  {errors.maxAttempts && (
                    <p className="text-destructive text-xs mt-1">
                      {errors.maxAttempts.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Ngưỡng nộp trễ (phút)
                  </label>
                  <Input
                    {...register('lateThreshold')}
                    type="number"
                    min={0}
                    className="focus-visible:ring-blue-500"
                  />
                  {errors.lateThreshold && (
                    <p className="text-destructive text-xs mt-1">
                      {errors.lateThreshold.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Phương thức tính điểm
                  </label>
                  <div className="relative">
                    <select
                      {...register('settings.gradingMethod')}
                      className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm appearance-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="highest_score">Lấy điểm cao nhất</option>
                      <option value="latest_score">Lấy điểm lần cuối</option>
                      <option value="average_score">Điểm trung bình</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Hiển thị điểm
                  </label>
                  <div className="relative">
                    <select
                      {...register('settings.scoreDisplayMode')}
                      className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm appearance-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="immediately">Ngay sau khi nộp</option>
                      <option value="after_closed">Sau khi bài thi đóng</option>
                      <option value="never">Không hiển thị</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-border mt-6">
                <ToggleField
                  control={control}
                  name="settings.allowOvertime"
                  label="Cho phép nộp trễ"
                  description="Sinh viên có thể nộp bài sau khi hết thời gian (bị đánh dấu nộp trễ)."
                />
              </div>

              <div className="pt-2 border-t border-border">
                <ToggleField
                  control={control}
                  name="settings.allowReview"
                  label="Cho phép xem lại bài"
                  description="Sinh viên có thể xem lại chi tiết bài làm sau khi có kết quả."
                />
              </div>

              <div className="pt-2 border-t border-border">
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

        {/* Right Column (Span 1) */}
        <div className="space-y-6">
          <section className="bg-card rounded-xs p-6 sticky top-24 shadow-sm">
            <div className="flex items-center gap-2 mb-6 border-b border-border pb-4">
              <div className="p-2 bg-red-500/10 text-red-600 dark:text-red-400 rounded-lg">
                <ShieldAlert className="w-5 h-5" />
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
                description="Hệ thống tự động thu bài nếu sinh viên vi phạm quá số lần cho phép. Chỉ hoạt động nếu Giám sát được bật."
              />

              {autoSubmitOnViolation && (
                <div className="ml-8 mt-4 p-4 border border-border bg-muted/20 rounded-lg">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Số lần vi phạm tối đa cho phép
                  </label>
                  <Input
                    {...register('settings.maxViolations')}
                    type="number"
                    min={1}
                    className="max-w-[200px] focus-visible:ring-blue-500"
                  />
                  {errors.settings?.maxViolations && (
                    <p className="text-destructive text-xs mt-1">
                      {errors.settings.maxViolations.message}
                    </p>
                  )}
                </div>
              )}

              <div className="mt-4 p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg flex items-start gap-3">
                <Settings className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-orange-700 dark:text-orange-400">
                  Lưu ý: Các thiết lập gian lận sẽ yêu cầu trình duyệt cấp quyền
                  đặc biệt cho ứng dụng khi bắt đầu làm bài.
                </p>
              </div>
            </div>
          </section>
        </div>
      </form>

      <CreateSpecificationModal
        open={isSpecModalOpen}
        onOpenChange={setIsSpecModalOpen}
        onSuccess={handleSpecificationCreated}
      />
    </div>
  )
}
