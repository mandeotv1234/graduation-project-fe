import type { ExamSettings } from '@/lib/types'

export type NormalizedExamSettings = {
  preventCopyPaste: boolean
  forceFullscreen: boolean
  trackTabSwitch: boolean
  autoSubmitOnViolation: boolean
  allowReview: boolean
  scoreDisplayMode: string
  allowOvertime: boolean
  gradingMethod: string
  showResultAfterSubmit: boolean
  maxViolations: number
  integrityCheckEnabled: boolean
  heartbeatIntervalSec: number
  maxHeartbeatGapSec: number
  isLoadDdl: boolean
  seedDatasetId?: number
}

export type ExamSettingsPayload = NormalizedExamSettings

const DEFAULT_SETTINGS: NormalizedExamSettings = {
  preventCopyPaste: true,
  forceFullscreen: true,
  trackTabSwitch: true,
  autoSubmitOnViolation: false,
  allowReview: true,
  scoreDisplayMode: 'after_closed',
  allowOvertime: false,
  gradingMethod: 'highest_score',
  showResultAfterSubmit: false,
  maxViolations: 3,
  integrityCheckEnabled: true,
  heartbeatIntervalSec: 8,
  maxHeartbeatGapSec: 25,
  isLoadDdl: false
}

export function normalizeExamSettings(
  settings?: unknown
): NormalizedExamSettings {
  const raw = (settings ?? {}) as Partial<ExamSettings>
  const isLoadDdl = raw.isLoadDdl ?? DEFAULT_SETTINGS.isLoadDdl
  const seedDatasetIdRaw = raw.seedDatasetId as
    | number
    | string
    | null
    | undefined

  return {
    ...DEFAULT_SETTINGS,
    preventCopyPaste: raw.preventCopyPaste ?? DEFAULT_SETTINGS.preventCopyPaste,
    forceFullscreen: raw.forceFullscreen ?? DEFAULT_SETTINGS.forceFullscreen,
    trackTabSwitch: raw.trackTabSwitch ?? DEFAULT_SETTINGS.trackTabSwitch,
    autoSubmitOnViolation:
      raw.autoSubmitOnViolation ?? DEFAULT_SETTINGS.autoSubmitOnViolation,
    allowReview: raw.allowReview ?? DEFAULT_SETTINGS.allowReview,
    scoreDisplayMode: raw.scoreDisplayMode ?? DEFAULT_SETTINGS.scoreDisplayMode,
    allowOvertime: raw.allowOvertime ?? DEFAULT_SETTINGS.allowOvertime,
    gradingMethod: raw.gradingMethod ?? DEFAULT_SETTINGS.gradingMethod,
    showResultAfterSubmit:
      raw.showResultAfterSubmit ?? DEFAULT_SETTINGS.showResultAfterSubmit,
    maxViolations: raw.maxViolations ?? DEFAULT_SETTINGS.maxViolations,
    integrityCheckEnabled:
      raw.integrityCheckEnabled ?? DEFAULT_SETTINGS.integrityCheckEnabled,
    heartbeatIntervalSec:
      raw.heartbeatIntervalSec ?? DEFAULT_SETTINGS.heartbeatIntervalSec,
    maxHeartbeatGapSec:
      raw.maxHeartbeatGapSec ?? DEFAULT_SETTINGS.maxHeartbeatGapSec,
    isLoadDdl,
    seedDatasetId:
      isLoadDdl && seedDatasetIdRaw != null && seedDatasetIdRaw !== ''
        ? Number(seedDatasetIdRaw)
        : undefined
  }
}

export function buildExamSettingsPayload(
  settings: unknown
): ExamSettingsPayload {
  const normalized = normalizeExamSettings(settings)

  return {
    ...normalized,
    seedDatasetId: normalized.isLoadDdl ? normalized.seedDatasetId : undefined
  }
}
