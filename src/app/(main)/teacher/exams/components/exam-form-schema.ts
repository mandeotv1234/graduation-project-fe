import { z } from 'zod'
import {
  examDurationSchema,
  examLateThresholdSchema,
  examMaxAttemptsSchema,
  examTitleSchema,
  gradingMethodSchema,
  maxViolationsSchema,
  scoreDisplayModeSchema,
  validateExamTiming
} from './exam-form-validation'

export const examSchema = z
  .object({
    title: examTitleSchema,
    /** 0 = chưa gắn đặc tả; có thể bổ sung sau. */
    specificationId: z.coerce.number().int().min(0, 'Mã đặc tả không hợp lệ'),
    durationMinutes: examDurationSchema,
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    description: z.string().optional(),
    isPublished: z.boolean().default(true),
    maxAttempts: examMaxAttemptsSchema,
    lateThreshold: examLateThresholdSchema,
    settings: z.object({
      preventCopyPaste: z.boolean().default(true),
      forceFullscreen: z.boolean().default(true),
      trackTabSwitch: z.boolean().default(true),
      autoSubmitOnViolation: z.boolean().default(false),
      maxViolations: maxViolationsSchema,
      allowReview: z.boolean().default(true),
      scoreDisplayMode: scoreDisplayModeSchema,
      allowOvertime: z.boolean().default(false),
      gradingMethod: gradingMethodSchema,
      showResultAfterSubmit: z.boolean().default(false),
      isLoadDdl: z.boolean().default(false),
      seedDatasetId: z
        .preprocess(
          (value) => (value === '' || value === null ? undefined : value),
          z.coerce.number().int().positive().optional()
        )
        .optional()
    })
  })
  .superRefine((value, context) => {
    validateExamTiming(value, context)

    if (value.settings.isLoadDdl && !value.settings.seedDatasetId) {
      context.addIssue({
        code: 'custom',
        path: ['settings', 'seedDatasetId'],
        message: 'Vui lòng chọn dataset để nạp dữ liệu mẫu'
      })
    }
  })

export type ExamFormValues = z.infer<typeof examSchema>
export type ExamFormInput = z.input<typeof examSchema>
