export const ENDPOINTS = Object.freeze({
  // Auth
  LOGIN: '/auth/login',
  LOGIN_OAUTH: '/auth/google',
  LOGIN_MICROSOFT: '/auth/microsoft',
  REGISTER: '/auth/register',
  REFRESH_TOKEN: '/auth/refresh',
  LOGOUT: '/auth/logout',

  // Student - Exams
  ENROLLED_EXAMS: '/exams/enrolled',
  EXAM_DETAIL: (examId: number) => `/exams/${examId}`,
  EXAM_QUESTIONS: (examId: number) => `/exams/${examId}/questions`,
  EXAM_EXECUTE_SQL: (examId: number) => `/exams/${examId}/execute-sql`,
  EXAM_SUBMIT: (examId: number) => `/exams/${examId}/submit`,

  // Anti-Cheating
  EXAM_START_SESSION: (examId: number) => `/exams/${examId}/start-session`,
  EXAM_REPORT_VIOLATION: (examId: number) => `/exams/${examId}/violations`,
  EXAM_TIME: (examId: number) => `/exams/${examId}/time`,

  // Teacher - Classes
  CLASSES: '/classes',
  CLASS_DETAIL: (classId: number) => `/classes/${classId}`,
  CLASS_STUDENTS: (classId: number) => `/classes/${classId}/students`,
  CLASS_EXAMS: (classId: number) => `/classes/${classId}/exams`,
  CLASS_TEACHERS: (classId: number) => `/classes/${classId}/teachers`,
  CLASS_TEACHER: (classId: number, teacherId: number) =>
    `/classes/${classId}/teachers/${teacherId}`,

  // Teacher - Exams
  CREATE_EXAM: '/exams',
  CREATE_EXAM_QUESTION: (examId: number) => `/exams/${examId}/questions`,

  // Teacher - Specifications
  SPECIFICATIONS: '/specifications',
  SPECIFICATIONS_V2: '/specifications/v2',

  // Exam Specification (teacher: POST, student: GET)
  EXAM_SPECIFICATION: (examId: number) => `/exams/${examId}/specification`,
  EXAM_CREATE_BATCH_QUESTIONS: (examId: number) => `/exams/${examId}/questions`,

  // Teacher - Notifications
  NOTIFICATIONS: '/notifications',
  NOTIFICATIONS_UNREAD_COUNT: '/notifications/unread-count',
  NOTIFICATION_READ: (id: number) => `/notifications/${id}/read`,
  NOTIFICATIONS_READ_ALL: '/notifications/read-all',
  NOTIFICATION_DELETE: (id: number) => `/notifications/${id}`,
  NOTIFICATIONS_DELETE_ALL: '/notifications'
})
