export const CLASS_CODE_MAX_LENGTH = 20
export const SEMESTER_MAX_LENGTH = 20
export const STUDENT_CODE_LENGTH = 8
export const STUDENTS_PER_PAGE = 10

export const isValidStudentCode = (value: string) =>
  value.length === STUDENT_CODE_LENGTH && /^\d+$/.test(value)
