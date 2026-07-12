import { z } from 'zod'

export const examSettingsFormSchema = z
  .object({
    title: z.string().min(1, 'Vui lòng nhập tiêu đề bài thi'),
    /** 0 = chưa gắn đặc tả; có thể bổ sung sau. */
    specificationId: z.coerce.number().int().min(0, 'Mã đặc tả không hợp lệ'),
    durationMinutes: z.coerce.number().min(1, 'Thời lượng phải lớn hơn 0'),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    description: z.string().optional(),
    isPublished: z.boolean().default(true),
    maxAttempts: z.coerce.number().min(1, 'Số lần làm bài phải lớn hơn 0'),
    lateThreshold: z.coerce.number().min(0, 'Ngưỡng nộp trễ không hợp lệ'),
    settings: z.object({
      preventCopyPaste: z.boolean().default(true),
      forceFullscreen: z.boolean().default(true),
      trackTabSwitch: z.boolean().default(true),
      autoSubmitOnViolation: z.boolean().default(false),
      maxViolations: z.coerce
        .number()
        .min(1, 'Số lần vi phạm phải lớn hơn 0')
        .optional(),
      allowReview: z.boolean().default(true),
      scoreDisplayMode: z.string().default('after_closed'),
      allowOvertime: z.boolean().default(false),
      gradingMethod: z.string().default('highest_score'),
      showResultAfterSubmit: z.boolean().default(false),
      integrityCheckEnabled: z.boolean().default(true),
      heartbeatIntervalSec: z.coerce.number().min(3).max(60).default(8),
      maxHeartbeatGapSec: z.coerce.number().min(10).max(120).default(25),
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
    if (value.startTime && value.endTime) {
      const startTime = new Date(value.startTime).getTime()
      const endTime = new Date(value.endTime).getTime()
      if (
        Number.isFinite(startTime) &&
        Number.isFinite(endTime) &&
        endTime <= startTime
      ) {
        context.addIssue({
          code: 'custom',
          path: ['endTime'],
          message: 'Thời gian kết thúc phải sau thời gian bắt đầu'
        })
      }
    }

    if (value.settings.isLoadDdl && !value.settings.seedDatasetId) {
      context.addIssue({
        code: 'custom',
        path: ['settings', 'seedDatasetId'],
        message: 'Vui lòng chọn dataset để nạp dữ liệu mẫu'
      })
    }
  })

export type ExamSettingsFormValues = z.infer<typeof examSettingsFormSchema>
export type ExamSettingsFormInput = z.input<typeof examSettingsFormSchema>
