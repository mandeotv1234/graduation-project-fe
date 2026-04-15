import { z } from 'zod'

export type SpecificationMode = 'specification' | 'pdf'

export const examSchema = z.object({
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
    isLoadDdl: z.boolean().default(false)
  })
})

export type ExamFormValues = z.infer<typeof examSchema>
export type ExamFormInput = z.input<typeof examSchema>
