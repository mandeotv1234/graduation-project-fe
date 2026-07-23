import { z } from 'zod'

export const examTitleSchema = z
  .string()
  .trim()
  .min(1, 'Vui lòng nhập tiêu đề bài thi')
  .max(255, 'Tiêu đề không được vượt quá 255 ký tự')

export const examDurationSchema = z.coerce
  .number()
  .int('Thời lượng phải là số nguyên')
  .min(1, 'Thời lượng phải lớn hơn 0')
  .max(240, 'Thời lượng tối đa là 240 phút (4 giờ)')

export const examMaxAttemptsSchema = z.coerce
  .number()
  .int('Số lần làm bài phải là số nguyên')
  .min(1, 'Số lần làm bài phải lớn hơn 0')
  .max(99, 'Số lần làm bài tối đa là 99')

export const examLateThresholdSchema = z.coerce
  .number()
  .int('Ngưỡng nộp trễ phải là số nguyên')
  .min(0, 'Ngưỡng nộp trễ không hợp lệ')
  .max(240, 'Ngưỡng nộp trễ tối đa là 240 phút')

const SCORE_DISPLAY_MODES = ['immediately', 'after_closed', 'never']
const GRADING_METHODS = ['highest_score', 'latest_score', 'average_score']

export const scoreDisplayModeSchema = z
  .string()
  .refine((value) => SCORE_DISPLAY_MODES.includes(value), {
    message: 'Chế độ hiển thị điểm không hợp lệ'
  })
  .default('after_closed')

export const gradingMethodSchema = z
  .string()
  .refine((value) => GRADING_METHODS.includes(value), {
    message: 'Phương thức tính điểm không hợp lệ'
  })
  .default('highest_score')

export const maxViolationsSchema = z.coerce
  .number()
  .int('Số lần vi phạm phải là số nguyên')
  .min(1, 'Số lần vi phạm phải lớn hơn 0')
  .max(100, 'Số lần vi phạm tối đa là 100')
  .optional()

export const heartbeatIntervalSchema = z.coerce
  .number()
  .int('Chu kỳ heartbeat phải là số nguyên')
  .min(3, 'Chu kỳ heartbeat tối thiểu là 3 giây')
  .max(60, 'Chu kỳ heartbeat tối đa là 60 giây')
  .default(8)

export const maxHeartbeatGapSchema = z.coerce
  .number()
  .int('Khoảng mất heartbeat phải là số nguyên')
  .min(10, 'Khoảng mất heartbeat tối thiểu là 10 giây')
  .max(120, 'Khoảng mất heartbeat tối đa là 120 giây')
  .default(25)

type ExamTimingValues = {
  durationMinutes: number
  startTime?: string
  endTime?: string
  lateThreshold: number
  settings: {
    allowOvertime: boolean
  }
}

export function validateExamTiming(
  value: ExamTimingValues,
  context: z.RefinementCtx
) {
  const startTime = value.startTime ? new Date(value.startTime).getTime() : null
  const endTime = value.endTime ? new Date(value.endTime).getTime() : null

  if (startTime === null && endTime !== null) {
    context.addIssue({
      code: 'custom',
      path: ['startTime'],
      message: 'Vui lòng nhập thời gian bắt đầu'
    })
  }
  if (startTime !== null && endTime === null) {
    context.addIssue({
      code: 'custom',
      path: ['endTime'],
      message: 'Vui lòng nhập thời gian kết thúc'
    })
  }
  if (startTime !== null && !Number.isFinite(startTime)) {
    context.addIssue({
      code: 'custom',
      path: ['startTime'],
      message: 'Thời gian bắt đầu không hợp lệ'
    })
  }
  if (endTime !== null && !Number.isFinite(endTime)) {
    context.addIssue({
      code: 'custom',
      path: ['endTime'],
      message: 'Thời gian kết thúc không hợp lệ'
    })
  }
  if (
    startTime !== null &&
    endTime !== null &&
    Number.isFinite(startTime) &&
    Number.isFinite(endTime) &&
    endTime - startTime < value.durationMinutes * 60_000
  ) {
    context.addIssue({
      code: 'custom',
      path: ['endTime'],
      message:
        'Khoảng thời gian bắt đầu đến kết thúc phải ít nhất bằng thời lượng bài thi'
    })
  }
  if (value.settings.allowOvertime && value.lateThreshold <= 0) {
    context.addIssue({
      code: 'custom',
      path: ['lateThreshold'],
      message: 'Vui lòng nhập ngưỡng nộp trễ lớn hơn 0'
    })
  }
}

export function validateHeartbeatSettings(
  heartbeatIntervalSec: number,
  maxHeartbeatGapSec: number,
  context: z.RefinementCtx
) {
  if (maxHeartbeatGapSec <= heartbeatIntervalSec) {
    context.addIssue({
      code: 'custom',
      path: ['settings', 'maxHeartbeatGapSec'],
      message: 'Khoảng mất heartbeat phải lớn hơn chu kỳ heartbeat'
    })
  }
}
