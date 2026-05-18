import type {
  SpecificationDetailResponse,
  TeacherExamDetail
} from '@/lib/types'

export type ExportStep =
  | 'STEP1_DESCRIPTIONS'
  | 'STEP2_REGULATIONS'
  | 'STEP3_PREVIEW'

export type EntityDescriptionStatus =
  | 'idle'
  | 'loading'
  | 'saving'
  | 'error'
  | 'saved'

export interface EntityDescriptionState {
  entityId: number
  entityName: string
  displayName: string
  value: string
  savedValue: string
  status: EntityDescriptionStatus
}

export interface ExportExamPdfModalProps {
  exam: TeacherExamDetail
  specification: SpecificationDetailResponse
  onClose: () => void
}

export interface UseExportExamPdfOptions {
  exam: TeacherExamDetail
  specification: SpecificationDetailResponse
}

export interface UseExportExamPdfReturn {
  step: ExportStep
  entities: EntityDescriptionState[]
  regulations: string
  pdfBlobUrl: string | null
  pdfFilename: string
  isPreviewLoading: boolean
  previewError: string | null
  setRegulations: (value: string) => void
  updateDescription: (entityId: number, value: string) => void
  regenerateDescription: (entityId: number) => Promise<void>
  saveDescription: (entityId: number) => Promise<void>
  goToStep2: () => Promise<void>
  goBackToStep1: () => void
  goToStep3: () => Promise<void>
  goBackToStep2: () => void
  downloadPdf: () => void
}

export interface Step1Props {
  entities: EntityDescriptionState[]
  onUpdateDescription: (entityId: number, value: string) => void
  onRegenerate: (entityId: number) => Promise<void>
  onSave: (entityId: number) => Promise<void>
  onNext: () => Promise<void>
}

export interface Step2Props {
  regulations: string
  onRegulationsChange: (value: string) => void
  onBack: () => void
  onNext: () => Promise<void>
  isLoading: boolean
}

export interface Step3Props {
  pdfBlobUrl: string | null
  filename: string
  isLoading: boolean
  error: string | null
  onBack: () => void
  onDownload: () => void
}
