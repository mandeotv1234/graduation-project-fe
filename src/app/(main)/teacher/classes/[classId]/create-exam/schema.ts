import { z } from 'zod'

export const examSchema = z.object({
  title: z.string().min(1, 'Vui lòng nhập tiêu đề bài thi'),
  specificationId: z.coerce.number().min(1, 'Vui lòng chọn đặc tả CSDL'),
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
    allowReview: z.boolean().default(true),
    scoreDisplayMode: z.string().default('after_closed'),
    allowOvertime: z.boolean().default(false),
    gradingMethod: z.string().default('highest_score')
  })
})

export type ExamFormValues = z.infer<typeof examSchema>
export type ExamFormInput = z.input<typeof examSchema>
