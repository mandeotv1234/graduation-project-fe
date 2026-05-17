'use client'

import { X } from 'lucide-react'

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'

import type {
  ExportExamPdfModalProps,
  ExportStep
} from './export-exam-pdf-modal.types'
import { Step1EditDescriptions } from './step-1-edit-descriptions'
import { Step2EditRegulations } from './step-2-edit-regulations'
import { Step3PreviewPdf } from './step-3-preview-pdf'
import { useExportExamPdf } from './use-export-exam-pdf'

const STEP_ITEMS: Array<{ key: ExportStep; label: string }> = [
  { key: 'STEP1_DESCRIPTIONS', label: 'Mô tả CSDL' },
  { key: 'STEP2_REGULATIONS', label: 'Quy định' },
  { key: 'STEP3_PREVIEW', label: 'Xem trước' }
]

export function ExportExamPdfModal({
  exam,
  specification,
  onClose
}: ExportExamPdfModalProps) {
  const {
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
  } = useExportExamPdf({ exam, specification })

  const currentStepIndex = STEP_ITEMS.findIndex((item) => item.key === step)

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[95vh] w-[95vw] max-w-3xl flex-col gap-0 overflow-hidden p-0"
      >
        <DialogClose className="absolute right-4 top-4 z-20 flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
          <X className="h-4 w-4" />
          <span className="sr-only">Đóng</span>
        </DialogClose>

        <DialogHeader className="shrink-0 border-b border-border px-6 py-4 pr-16">
          <DialogTitle className="text-base font-semibold">
            Xuất đề thi PDF
          </DialogTitle>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {STEP_ITEMS.map((item, index) => {
              const isActive = index === currentStepIndex
              const isComplete = index < currentStepIndex

              return (
                <div
                  key={item.key}
                  aria-current={isActive ? 'step' : undefined}
                  className={[
                    'flex min-w-0 items-center gap-2 rounded-md border px-2.5 py-2 transition-colors',
                    isActive
                      ? 'border-primary/30 bg-primary/10'
                      : 'border-border bg-background'
                  ].join(' ')}
                >
                  <span
                    className={[
                      'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold transition-colors',
                      isActive
                        ? 'border-primary bg-primary text-primary-foreground'
                        : isComplete
                          ? 'border-primary/30 bg-primary/10 text-primary'
                          : 'border-border bg-background text-muted-foreground'
                    ].join(' ')}
                  >
                    {index + 1}
                  </span>
                  <span
                    className={[
                      'min-w-0 truncate text-xs',
                      isActive
                        ? 'font-medium text-foreground'
                        : 'text-muted-foreground'
                    ].join(' ')}
                  >
                    {item.label}
                  </span>
                </div>
              )
            })}
          </div>
        </DialogHeader>

        <div className="min-h-0 overflow-hidden px-6 py-5">
          {step === 'STEP1_DESCRIPTIONS' && (
            <Step1EditDescriptions
              entities={entities}
              onUpdateDescription={updateDescription}
              onRegenerate={regenerateDescription}
              onSave={saveDescription}
              onNext={goToStep2}
            />
          )}

          {step === 'STEP2_REGULATIONS' && (
            <Step2EditRegulations
              regulations={regulations}
              onRegulationsChange={setRegulations}
              onBack={goBackToStep1}
              onNext={goToStep3}
              isLoading={isPreviewLoading}
            />
          )}

          {step === 'STEP3_PREVIEW' && (
            <Step3PreviewPdf
              pdfBlobUrl={pdfBlobUrl}
              filename={pdfFilename}
              isLoading={isPreviewLoading}
              error={previewError}
              onBack={goBackToStep2}
              onDownload={downloadPdf}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
