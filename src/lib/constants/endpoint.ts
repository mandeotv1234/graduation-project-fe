export const ENDPOINTS = Object.freeze({
  // Auth
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  REFRESH_TOKEN: '/auth/refresh',
  LOGOUT: '/auth/logout',

  // Student - Exams
  ENROLLED_EXAMS: '/exams/enrolled',
  EXAM_DETAIL: (examId: number) => `/exams/${examId}`,
  EXAM_QUESTIONS: (examId: number) => `/exams/${examId}/questions`,
  EXAM_EXECUTE_SQL: (examId: number) => `/exams/${examId}/execute-sql`,
  EXAM_SUBMIT: (examId: number) => `/exams/${examId}/submit`,

  // Teacher - Classes
  CLASSES: '/classes',
  CLASS_DETAIL: (classId: number) => `/classes/${classId}`,
  CLASS_STUDENTS: (classId: number) => `/classes/${classId}/students`,
  CLASS_EXAMS: (classId: number) => `/classes/${classId}/exams`,

  // Teacher - Exams
  CREATE_EXAM: '/exams',
  CREATE_EXAM_QUESTION: (examId: number) => `/exams/${examId}/questions`,

  // Teacher - Schema Templates
  SCHEMA_TEMPLATES: '/schema-templates'
})
