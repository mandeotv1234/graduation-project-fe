'use client'

import { useState, useEffect, useRef } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, type FieldErrors } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Save,
  Loader2,
  FileText,
  ChevronDown,
  ShieldAlert,
  Clock,
  Award,
  Settings,
  Upload,
  X
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { SpecificationDetailResponse, SpecificationResponse } from '@/lib/types'
import { getSpecificationDetail, getSpecifications } from '@/lib/actions'

import {
  examSchema,
  ExamFormValues,
  ExamFormInput,
  SpecificationMode
} from './exam-form-schema'
import {
  buildExamSettingsPayload,
  ExamSettingsPayload,
  normalizeExamSettings
} from './normalize-exam-settings'
import { ToggleField } from './toggle-field'
import { cn } from '@/lib/utils'

export type ExamFormFocusSection =
  | 'overview'
  | 'submission'
  | 'antiCheat'
  | 'description'

interface ExamFormProps {
  initialData?: Partial<ExamFormInput>
  onSubmit: (
    data: Omit<ExamFormValues, 'settings'> & { settings: ExamSettingsPayload },
    pdfFile?: File | null
  ) => Promise<void>
  isLoading: boolean
  title: string
  submitLabel: string
  /** Khi set: chỉ hiển thị một nhóm trường (dùng trong modal chỉnh từng phần). */
  focusSection?: ExamFormFocusSection
  /** Tên file PDF hiện tại (dùng khi edit exam đã có PDF) */
  initialPdfFileName?: string | null
  initialSpecificationDetail?: SpecificationDetailResponse | null
}

export function ExamForm({
  initialData,
  onSubmit,
  isLoading,
  title,
  submitLabel,
  focusSection,
  initialPdfFileName,
  initialSpecificationDetail
}: ExamFormProps) {
  const [specifications, setSpecifications] = useState<SpecificationResponse[]>(
    []
  )
  const [selectedSpecificationDetail, setSelectedSpecificationDetail] =
    useState<SpecificationDetailResponse | null>(
      initialSpecificationDetail ?? null
    )
  const [isLoadingSpecificationDetail, setIsLoadingSpecificationDetail] =
    useState(false)
  const [specMode, setSpecMode] = useState<SpecificationMode>(
    initialPdfFileName ? 'pdf' : 'specification'
  )
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
      title: initialData?.title ?? '',
      specificationId: initialData?.specificationId ?? 0,
      durationMinutes: initialData?.durationMinutes ?? 60,
      startTime: initialData?.startTime ?? '',
      endTime: initialData?.endTime ?? '',
      description: initialData?.description ?? '',
      isPublished: initialData?.isPublished ?? true,
      maxAttempts: initialData?.maxAttempts ?? 1,
      lateThreshold: initialData?.lateThreshold ?? 0,
      settings: normalizeExamSettings(initialData?.settings)
    }
  })

  // Handle initialData updates (e.g. after fetching)
  useEffect(() => {
    if (initialData) {
      reset({
        title: initialData.title ?? '',
        specificationId: Number(initialData.specificationId ?? 0),
        durationMinutes: initialData.durationMinutes ?? 60,
        startTime: initialData.startTime ?? '',
        endTime: initialData.endTime ?? '',
        description: initialData.description ?? '',
        isPublished: initialData.isPublished ?? true,
        maxAttempts: initialData.maxAttempts ?? 1,
        lateThreshold: initialData.lateThreshold ?? 0,
        settings: normalizeExamSettings(initialData.settings)
      })
    }
  }, [initialData, reset])

  useEffect(() => {
    async function fetchSpecifications() {
      const specificationsRes = await getSpecifications()
      if (specificationsRes.data) {
        setSpecifications(specificationsRes.data)
      }
    }
    fetchSpecifications()
  }, [])

  const selectedSpecificationId = watch('specificationId')
  const autoSubmitOnViolation = watch('settings.autoSubmitOnViolation')
  const isLoadDdl = watch('settings.isLoadDdl')
  const seedDatasetId = watch('settings.seedDatasetId')
  const selectedSpecification = specifications.find(
    (specification) => specification.id === Number(selectedSpecificationId)
  )
  useEffect(() => {
    const specificationId = Number(selectedSpecificationId)
    if (!specificationId) {
      setSelectedSpecificationDetail(null)
      return
    }

    let isCancelled = false

    async function fetchSpecificationDetail() {
      setIsLoadingSpecificationDetail(true)
      try {
        const result = await getSpecificationDetail(specificationId)
        if (!isCancelled) {
          setSelectedSpecificationDetail(result.data ?? null)
        }
      } catch {
        if (!isCancelled) {
          setSelectedSpecificationDetail(null)
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingSpecificationDetail(false)
        }
      }
    }

    fetchSpecificationDetail()

    return () => {
      isCancelled = true
    }
  }, [selectedSpecificationId])

  const specificationForDatasets =
    selectedSpecificationDetail?.id === Number(selectedSpecificationId)
      ? selectedSpecificationDetail
      : selectedSpecification
  const seedableDatasets =
    specificationForDatasets?.datasets?.filter(
      (dataset) => dataset.isActive !== false && !!dataset.dataScript?.trim()
    ) ?? []
  const hasLoadedDatasetOptions =
    Number(specificationForDatasets?.id ?? 0) ===
      Number(selectedSpecificationId) &&
    Array.isArray(specificationForDatasets?.datasets)
  const hasSeedDatasetValue = seedDatasetId != null && seedDatasetId !== ''
  const selectedSeedDatasetInOptions =
    hasSeedDatasetValue &&
    seedableDatasets.some(
      (dataset) => Number(dataset.id) === Number(seedDatasetId)
    )
  const shouldRenderPendingSelectedDatasetOption =
    isLoadDdl &&
    hasSeedDatasetValue &&
    !selectedSeedDatasetInOptions &&
    !hasLoadedDatasetOptions

  useEffect(() => {
    if (
      initialSpecificationDetail &&
      Number(initialSpecificationDetail.id) === Number(selectedSpecificationId)
    ) {
      setSelectedSpecificationDetail(initialSpecificationDetail)
    }
  }, [initialSpecificationDetail, selectedSpecificationId])

  useEffect(() => {
    const specificationId = Number(selectedSpecificationId)

    if (!isLoadDdl || !hasSeedDatasetValue) return

    if (!specificationId) {
      setValue('settings.seedDatasetId', undefined, {
        shouldDirty: true,
        shouldValidate: true
      })
      return
    }

    if (!hasLoadedDatasetOptions) return

    if (!selectedSeedDatasetInOptions) {
      setValue('settings.seedDatasetId', undefined, {
        shouldDirty: true,
        shouldValidate: true
      })
    }
  }, [
    hasSeedDatasetValue,
    hasLoadedDatasetOptions,
    isLoadDdl,
    seedDatasetId,
    selectedSeedDatasetInOptions,
    selectedSpecificationId,
    setValue
  ])

  const handleValidSubmit = (
    data: ExamFormValues,
    selectedPdfFile?: File | null
  ) => {
    return onSubmit(
      {
        ...data,
        settings: buildExamSettingsPayload(normalizeExamSettings(data.settings))
      },
      selectedPdfFile
    )
  }

  const show = (s: ExamFormFocusSection) => !focusSection || focusSection === s
  const isFocused = Boolean(focusSection)

  const onFormError = (err: FieldErrors<ExamFormInput>) => {
    const errorValues = Object.values(err)
    if (errorValues.length > 0) {
      const firstError = errorValues[0]
      let message = ''

      if (firstError) {
        if (
          typeof firstError === 'object' &&
          'message' in firstError &&
          firstError.message
        ) {
          message = String(firstError.message)
        } else if (typeof firstError === 'object' && firstError !== null) {
          const nestedValues = Object.values(firstError)
          const firstNested = nestedValues[0]
          if (firstNested?.message) {
            message = String(firstNested.message)
          }
        }
      }

      toast.error(
        `Lỗi: ${message || 'Vui lòng kiểm tra lại các trường bắt buộc'}`
      )
    }
  }

  return (
    <div className={cn('space-y-8', isFocused && 'space-y-0')}>
      {/* Trong modal section: nút Lưu đặt ở footer Dialog, không render ở đây */}
      {!isFocused && (
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
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
              className="gap-2 bg-blue-600 text-white shadow-sm transition-all hover:bg-blue-700"
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
      )}

      <form
        id="exam-form"
        onSubmit={handleSubmit(
          (data) =>
            handleValidSubmit(data, specMode === 'pdf' ? pdfFile : null),
          onFormError
        )}
        className={cn(
          'grid gap-4',
          isFocused ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-3'
        )}
      >
        {(show('overview') || show('description') || show('submission')) && (
          <div
            className={cn(
              'mb-1 space-y-8',
              !isFocused && 'lg:col-span-2',
              isFocused &&
                focusSection !== 'antiCheat' &&
                'mx-auto w-full max-w-3xl'
            )}
          >
            {/* Section: Thông tin chung (thời gian, đặc tả, tiêu đề) */}
            {show('overview') && (
              <section className="bg-card rounded-xs p-6 pb-10 mb-4 shadow-sm">
                {!isFocused && (
                  <div className="mb-6 flex items-center gap-2 border-b border-border pb-4">
                    <div className="rounded-lg bg-blue-500/10 p-2 text-blue-600 dark:text-blue-400">
                      <FileText className="h-5 w-5" />
                    </div>
                    <h2 className="text-lg font-semibold text-foreground">
                      Thông tin chung
                    </h2>
                  </div>
                )}

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Tiêu đề bài thi{' '}
                      <span className="text-destructive">*</span>
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

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Đặc tả CSDL
                      </label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSpecMode('specification')
                            setPdfFile(null)
                            if (fileInputRef.current)
                              fileInputRef.current.value = ''
                          }}
                          className={cn(
                            'flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                            specMode === 'specification'
                              ? 'border-blue-500 bg-blue-500/10 text-blue-600'
                              : 'border-border bg-background text-muted-foreground hover:bg-muted'
                          )}
                        >
                          <FileText className="inline h-4 w-4 mr-1.5 -mt-0.5" />
                          Đặc tả tự tạo
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSpecMode('pdf')
                            register('specificationId').onChange({
                              target: { value: 0, name: 'specificationId' }
                            })
                          }}
                          className={cn(
                            'flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                            specMode === 'pdf'
                              ? 'border-blue-500 bg-blue-500/10 text-blue-600'
                              : 'border-border bg-background text-muted-foreground hover:bg-muted'
                          )}
                        >
                          <Upload className="inline h-4 w-4 mr-1.5 -mt-0.5" />
                          Upload file PDF
                        </button>
                      </div>
                    </div>

                    {specMode === 'specification' ? (
                      <div>
                        <div className="relative">
                          <select
                            {...register('specificationId', {
                              valueAsNumber: true
                            })}
                            value={Number(selectedSpecificationId ?? 0)}
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
                        <p className="text-xs text-muted-foreground mt-2">
                          Sơ đồ CSDL sinh viên sẽ làm bài.
                        </p>
                      </div>
                    ) : (
                      <div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="application/pdf"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0] ?? null
                            if (file) {
                              if (file.type !== 'application/pdf') {
                                toast.error('Chỉ chấp nhận file PDF')
                                e.target.value = ''
                                return
                              }
                              if (file.size > 10 * 1024 * 1024) {
                                toast.error('File PDF không được vượt quá 10MB')
                                e.target.value = ''
                                return
                              }
                            }
                            setPdfFile(file)
                          }}
                        />
                        {pdfFile ? (
                          <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
                            <FileText className="h-5 w-5 shrink-0 text-red-500" />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-foreground">
                                {pdfFile.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {(pdfFile.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setPdfFile(null)
                                if (fileInputRef.current)
                                  fileInputRef.current.value = ''
                              }}
                              className="rounded-full p-1 hover:bg-muted"
                            >
                              <X className="h-4 w-4 text-muted-foreground" />
                            </button>
                          </div>
                        ) : initialPdfFileName && !pdfFile ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 dark:border-green-800 dark:bg-green-950/30">
                              <FileText className="h-5 w-5 shrink-0 text-red-500" />
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-foreground">
                                  {initialPdfFileName}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Đang sử dụng file PDF hiện tại
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-background px-3 py-2 text-xs text-muted-foreground transition-colors hover:border-blue-400 hover:bg-blue-500/5"
                            >
                              <Upload className="h-4 w-4" />
                              Thay bằng file PDF mới
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-background px-4 py-6 text-sm text-muted-foreground transition-colors hover:border-blue-400 hover:bg-blue-500/5"
                          >
                            <Upload className="h-5 w-5" />
                            Nhấn để chọn file PDF (tối đa 10MB)
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                </div>
              </section>
            )}

            {/* Mô tả và nội quy */}
            {show('description') && (
              <section className="bg-card rounded-xs p-6 shadow-sm">
                {!isFocused && (
                  <div className="mb-6 flex items-center gap-2 border-b border-border pb-4">
                    <div className="rounded-lg bg-blue-500/10 p-2 text-blue-600 dark:text-blue-400">
                      <FileText className="h-5 w-5" />
                    </div>
                    <h2 className="text-lg font-semibold text-foreground">
                      Mô tả và Nội quy bài thi
                    </h2>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Nội dung mô tả
                  </label>
                  <Textarea
                    {...register('description')}
                    rows={focusSection === 'description' ? 12 : 4}
                    placeholder="Nhập hướng dẫn làm bài, các lưu ý quan trọng cho sinh viên..."
                    className="resize-y focus-visible:ring-blue-500"
                  />
                </div>
              </section>
            )}

            {/* Quy định nộp bài & Điểm số */}
            {show('submission') && (
              <section className="bg-card rounded-xs p-6 shadow-sm">
                {!isFocused && (
                  <div className="mb-6 flex items-center gap-2 border-b border-border pb-4">
                    <div className="rounded-lg bg-green-500/10 p-2 text-green-600 dark:text-green-400">
                      <Award className="h-5 w-5" />
                    </div>
                    <h2 className="text-lg font-semibold text-foreground">
                      Quy định nộp bài &amp; Điểm số
                    </h2>
                  </div>
                )}

                <div className="space-y-6">
                  <ToggleField
                    control={control}
                    name="isPublished"
                    label="Xuất bản ngay"
                    description="Nếu tắt, bài thi sẽ được lưu ở trạng thái Bản nháp và sinh viên không thể nhìn thấy."
                  />

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
                          <option value="highest_score">
                            Lấy điểm cao nhất
                          </option>
                          <option value="latest_score">
                            Lấy điểm lần cuối
                          </option>
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
                          <option value="after_closed">
                            Sau khi bài thi đóng
                          </option>
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

                  <div className="flex flex-col gap-4 border-t border-border pt-4">
                    <ToggleField
                      control={control}
                      name="settings.isLoadDdl"
                      label="Nạp đặc tả và dữ liệu mẫu"
                      description="Khi bật, hệ thống sẽ tạo schema từ đặc tả và nạp dataset đã chọn vào schema sinh viên khi bắt đầu thi."
                    />

                    {isLoadDdl && (
                      <div className="border-t border-border pt-4">
                        <label className="mb-2 block text-sm font-medium text-foreground">
                          Dataset dùng để nạp dữ liệu mẫu
                        </label>
                        <div className="relative">
                          <select
                            value={
                              seedDatasetId != null && seedDatasetId !== ''
                                ? String(seedDatasetId)
                                : ''
                            }
                            onChange={(event) => {
                              const nextValue = event.target.value
                              setValue(
                                'settings.seedDatasetId',
                                nextValue === ''
                                  ? undefined
                                  : Number(nextValue),
                                { shouldDirty: true, shouldValidate: true }
                              )
                            }}
                            className="flex h-10 w-full appearance-none rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          >
                            <option value="">-- Chọn dataset --</option>
                            {shouldRenderPendingSelectedDatasetOption && (
                              <option value={String(seedDatasetId)}>
                                Dataset đã chọn đang tải...
                              </option>
                            )}
                            {isLoadingSpecificationDetail && (
                              <option value="" disabled>
                                Đang tải dataset...
                              </option>
                            )}
                            {seedableDatasets.map((dataset) => (
                              <option
                                key={dataset.id}
                                value={String(dataset.id)}
                              >
                                {dataset.name}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        </div>
                        {hasLoadedDatasetOptions &&
                          seedableDatasets.length === 0 && (
                            <p className="mt-1 text-xs text-amber-600">
                              Đặc tả đang chọn chưa có dataset có script dữ
                              liệu.
                            </p>
                          )}
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}
          </div>
        )}

        {/* Cột phải: chống gian lận */}
        {show('antiCheat') && (
          <div
            className={cn(
              'space-y-6',
              isFocused &&
                focusSection === 'antiCheat' &&
                'mx-auto w-full max-w-3xl'
            )}
          >
            <section
              className={cn(
                'bg-card rounded-xs p-6 shadow-sm',
                !isFocused && 'sticky top-24'
              )}
            >
              {!isFocused && (
                <div className="mb-6 flex items-center gap-2 border-b border-border pb-4">
                  <div className="rounded-lg bg-red-500/10 p-2 text-red-600 dark:text-red-400">
                    <ShieldAlert className="h-5 w-5" />
                  </div>
                  <h2 className="text-lg font-semibold text-foreground">
                    Cài đặt chống gian lận
                  </h2>
                </div>
              )}

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
                  <Settings className="w-5 h-5 text-orange-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-orange-700 dark:text-orange-400">
                    Lưu ý: Các thiết lập gian lận sẽ yêu cầu trình duyệt cấp
                    quyền đặc biệt cho ứng dụng khi bắt đầu làm bài.
                  </p>
                </div>
              </div>
            </section>
          </div>
        )}
      </form>
    </div>
  )
}
