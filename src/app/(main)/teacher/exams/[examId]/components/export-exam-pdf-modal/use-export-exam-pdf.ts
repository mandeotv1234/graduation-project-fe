'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import {
  generateEntityDescription,
  updateEntityDescription
} from '@/lib/actions/exam-specification.action'
import { exportExamPdfBlob } from '@/lib/api/pdf-client'

import type {
  EntityDescriptionState,
  ExportStep,
  UseExportExamPdfOptions,
  UseExportExamPdfReturn
} from './export-exam-pdf-modal.types'

export function useExportExamPdf({
  exam,
  specification
}: UseExportExamPdfOptions): UseExportExamPdfReturn {
  const specId = specification.id
  const examId = exam.id

  const buildInitialEntities = (): EntityDescriptionState[] =>
    (specification.entities ?? [])
      .filter((e): e is typeof e & { id: number } => e.id !== undefined)
      .map((e) => ({
        entityId: e.id,
        entityName: e.entityName,
        displayName: e.displayName ?? e.entityName,
        value: e.description ?? '',
        savedValue: e.description ?? '',
        status: 'idle' as const
      }))

  const [step, setStep] = useState<ExportStep>('STEP1_DESCRIPTIONS')
  const [entities, setEntities] =
    useState<EntityDescriptionState[]>(buildInitialEntities)
  const [regulations, setRegulations] = useState<string>(exam.description ?? '')
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null)
  const [pdfFilename, setPdfFilename] = useState<string>(`exam-${examId}.pdf`)
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)

  const blobUrlRef = useRef<string | null>(null)

  const revokeBlobUrl = useCallback(() => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current)
      blobUrlRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => {
      revokeBlobUrl()
    }
  }, [revokeBlobUrl])

  const setEntityStatus = useCallback(
    (entityId: number, status: EntityDescriptionState['status']) => {
      setEntities((prev) =>
        prev.map((e) => (e.entityId === entityId ? { ...e, status } : e))
      )
    },
    []
  )

  const regenerateDescription = useCallback(
    async (entityId: number) => {
      setEntityStatus(entityId, 'loading')
      try {
        const res = await generateEntityDescription(specId, entityId, examId)
        const generated = res.data?.description ?? null
        if (generated) {
          setEntities((prev) =>
            prev.map((e) =>
              e.entityId === entityId
                ? { ...e, value: generated, status: 'idle' }
                : e
            )
          )
        } else {
          setEntityStatus(entityId, 'error')
          toast.error('Không thể tạo mô tả cho entity. Vui lòng nhập thủ công.')
        }
      } catch (err) {
        console.error(err)
        setEntityStatus(entityId, 'error')
        toast.error('Lỗi khi gọi AI. Vui lòng thử lại.')
      }
    },
    [specId, examId, setEntityStatus]
  )

  // Ref so the mount-only effect always has the latest regenerateDescription
  const regenerateRef = useRef(regenerateDescription)
  useEffect(() => {
    regenerateRef.current = regenerateDescription
  })

  // Auto-generate for empty entities on mount only
  useEffect(() => {
    const initialEntities = buildInitialEntities()
    const emptyIds = initialEntities
      .filter((e) => !e.value.trim())
      .map((e) => e.entityId)

    emptyIds.forEach((id) => {
      void regenerateRef.current(id)
    })
  }, []) // mount-only: intentional empty dep array, ref captures latest callback

  const updateDescription = (entityId: number, value: string) => {
    setEntities((prev) =>
      prev.map((e) =>
        e.entityId === entityId ? { ...e, value, status: 'idle' } : e
      )
    )
  }

  const saveDescription = useCallback(
    async (entityId: number) => {
      const entity = entities.find((e) => e.entityId === entityId)
      if (!entity) return

      setEntityStatus(entityId, 'saving')
      try {
        await updateEntityDescription(specId, entityId, examId, entity.value)
        setEntities((prev) =>
          prev.map((e) =>
            e.entityId === entityId
              ? { ...e, savedValue: e.value, status: 'saved' }
              : e
          )
        )
      } catch (err) {
        console.error(err)
        setEntityStatus(entityId, 'error')
        toast.error('Lưu mô tả thất bại')
      }
    },
    [entities, specId, examId, setEntityStatus]
  )

  /**
   * PUT all dirty descriptions in parallel. Returns true if all succeeded.
   * On any failure: marks entity as error, shows toast, returns false.
   */
  const flushDirtyDescriptions = useCallback(async (): Promise<boolean> => {
    const dirty = entities.filter(
      (e) => e.value !== e.savedValue && e.value.trim().length > 0
    )
    if (dirty.length === 0) return true

    setEntities((prev) =>
      prev.map((e) =>
        dirty.some((d) => d.entityId === e.entityId)
          ? { ...e, status: 'saving' }
          : e
      )
    )

    const results = await Promise.allSettled(
      dirty.map((e) =>
        updateEntityDescription(specId, e.entityId, examId, e.value)
      )
    )

    let anyFailed = false
    setEntities((prev) =>
      prev.map((e) => {
        const idx = dirty.findIndex((d) => d.entityId === e.entityId)
        if (idx === -1) return e
        if (results[idx].status === 'fulfilled') {
          return { ...e, savedValue: e.value, status: 'saved' }
        }
        anyFailed = true
        return { ...e, status: 'error' }
      })
    )

    if (anyFailed) {
      toast.error('Một số mô tả chưa được lưu. Vui lòng kiểm tra lại.')
      return false
    }
    return true
  }, [entities, specId, examId])

  const goToStep2 = useCallback(async () => {
    const anyBusy = entities.some(
      (e) => e.status === 'loading' || e.status === 'saving'
    )
    if (anyBusy) {
      toast.error('Vui lòng chờ các thao tác đang xử lý hoàn tất.')
      return
    }
    const ok = await flushDirtyDescriptions()
    if (!ok) return
    setStep('STEP2_REGULATIONS')
  }, [entities, flushDirtyDescriptions])

  const goBackToStep1 = useCallback(() => {
    setStep('STEP1_DESCRIPTIONS')
  }, [])

  const goToStep3 = useCallback(async () => {
    const ok = await flushDirtyDescriptions()
    if (!ok) return

    setStep('STEP3_PREVIEW')
    setIsPreviewLoading(true)
    setPreviewError(null)
    revokeBlobUrl()

    try {
      const { blob, filename } = await exportExamPdfBlob(examId, {
        regulationsOverride: regulations.trim() || undefined
      })
      const url = URL.createObjectURL(blob)
      blobUrlRef.current = url
      setPdfBlobUrl(url)
      setPdfFilename(filename)
    } catch (err) {
      console.error(err)
      let msg = 'Không thể tạo PDF. Thử lại.'
      if (typeof err === 'string') {
        try {
          const parsed = JSON.parse(err) as { message?: string }
          if (parsed.message) msg = parsed.message
        } catch {
          // not JSON — use default message
        }
      } else if (err instanceof Error) {
        msg = err.message
      }
      setPreviewError(msg)
      toast.error(msg)
    } finally {
      setIsPreviewLoading(false)
    }
  }, [flushDirtyDescriptions, examId, regulations, revokeBlobUrl])

  const goBackToStep2 = useCallback(() => {
    revokeBlobUrl()
    setPdfBlobUrl(null)
    setPreviewError(null)
    setStep('STEP2_REGULATIONS')
  }, [revokeBlobUrl])

  const downloadPdf = useCallback(() => {
    if (!pdfBlobUrl) return
    const a = document.createElement('a')
    a.href = pdfBlobUrl
    a.download = pdfFilename
    a.click()
  }, [pdfBlobUrl, pdfFilename])

  return {
    step,
    entities,
    regulations,
    pdfBlobUrl,
    pdfFilename,
    isPreviewLoading,
    previewError,
    setRegulations,
    updateDescription,
    regenerateDescription,
    saveDescription,
    goToStep2,
    goBackToStep1,
    goToStep3,
    goBackToStep2,
    downloadPdf
  }
}
