export const ENDPOINTS = Object.freeze({
  // Auth
  LOGIN: '/auth/login',
  LOGIN_OAUTH: '/auth/google',
  LOGIN_MICROSOFT: '/auth/microsoft',
  REGISTER: '/auth/register',
  REFRESH_TOKEN: '/auth/refresh',
  LOGOUT: '/auth/logout',
  USER_ME: '/users/me',

  // Student - Exams
  ENROLLED_EXAMS: '/exams/enrolled',
  MY_RESULTS: '/exams/my-results',
  MY_RESULT_DETAIL: (resultId: number) => `/exams/my-results/${resultId}`,
  EXAM_DETAIL: (examId: number) => `/exams/${examId}`,
  EXAM_QUESTIONS: (examId: number) => `/exams/${examId}/questions`,
  EXAM_EXECUTE_SQL: (examId: number) => `/exams/${examId}/execute-sql`,
  EXAM_CLEAR_SCHEMA: (examId: number) => `/exams/${examId}/clear-schema`,
  EXAM_SUBMIT: (examId: number) => `/exams/${examId}/submit`,
  EXAM_DRAFT: (examId: number) => `/exams/${examId}/draft`,

  // Anti-Cheating
  EXAM_START_SESSION: (examId: number) => `/exams/${examId}/start-session`,
  EXAM_REPORT_VIOLATION: (examId: number) => `/exams/${examId}/violations`,
  EXAM_TIME: (examId: number) => `/exams/${examId}/time`,
  EXAM_DEVICE_CONFLICT_APPROVE: (examId: number, conflictId: string) =>
    `/exams/${examId}/device-conflict/${conflictId}/approve`,
  EXAM_DEVICE_CONFLICT_REJECT: (examId: number, conflictId: string) =>
    `/exams/${examId}/device-conflict/${conflictId}/reject`,

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
  TEACHER_EXAM_SETTINGS: (examId: number) => `/exams/${examId}/settings`,
  TEACHER_EXAM_TEMPLATE_VERSIONS: (examId: number) =>
    `/exams/${examId}/template-versions`,
  CREATE_EXAM_QUESTION: (examId: number) => `/exams/${examId}/questions`,
  EXAM_QUESTION_DETAIL: (examId: number, questionId: number) =>
    `/exams/${examId}/questions/${questionId}`,
  EXAM_MONITOR: (examId: number) => `/exams/${examId}/monitor`,

  // Teacher - Specifications
  SPECIFICATIONS: '/specifications',
  SPECIFICATIONS_V2: '/specifications/v2',
  SPECIFICATIONS_AI_SCHEMA: '/specifications/ai-schema',
  SPECIFICATIONS_SCHEMA_FROM_DDL: '/specifications/schema-from-ddl',
  SPECIFICATION_DETAIL: (specificationId: number) =>
    `/specifications/${specificationId}`,

  // Exam PDF
  EXAM_PDF: (examId: number) => `/exams/${examId}/pdf`,

  // Exam Specification (teacher: POST, student: GET)
  EXAM_SPECIFICATION: (examId: number) => `/exams/${examId}/specification`,
  EXAM_CREATE_BATCH_QUESTIONS: (examId: number) => `/exams/${examId}/questions`,
  EXAM_GENERATE_RUBRIC: '/exams/generate-rubric',
  EXAM_TEST_GRADE: '/exams/test-grade',
  EXAM_TEST_GRADE_INSERT: (examId: number) =>
    `/exams/${examId}/test-grade-insert`,
  EXAM_TEST_GRADE_SELECT: (examId: number) =>
    `/exams/${examId}/test-grade-select`,
  EXAM_RUN_SELECT_TESTCASE: (examId: number) =>
    `/exams/${examId}/run-select-testcase`,
  EXAM_BUILD_INSERT_TABLES: (examId: number) =>
    `/exams/${examId}/build-insert-tables`,
  EXAM_BUILD_CREATE_TABLES: (examId: number) =>
    `/exams/${examId}/build-create-tables`,
  EXAM_RESULTS: (examId: number) => `/exams/${examId}/results`,
  EXAM_RESULT_DETAIL: (examId: number, resultId: number) =>
    `/exams/${examId}/results/${resultId}`,
  EXAM_STATISTICS: (examId: number) => `/exams/${examId}/statistics`,
  EXAM_OVERRIDE_SUBMISSION: (
    examId: number,
    resultId: number,
    submissionId: number
  ) =>
    `/exams/${examId}/results/${resultId}/submissions/${submissionId}/override`,
  EXAM_REGRADE_RESULT: (examId: number, resultId: number) =>
    `/exams/${examId}/results/${resultId}/regrade`,
  EXAM_REGRADE_ALL: (examId: number) => `/exams/${examId}/regrade-all`,
  RULE_PRESETS: '/exams/rule-presets',
  RULE_PRESET_DELETE: (id: number) => `/exams/rule-presets/${id}`,

  // Teacher - Notifications
  NOTIFICATIONS: '/notifications',
  NOTIFICATIONS_UNREAD_COUNT: '/notifications/unread-count',
  NOTIFICATION_READ: (id: number) => `/notifications/${id}/read`,
  NOTIFICATIONS_READ_ALL: '/notifications/read-all',
  NOTIFICATION_DELETE: (id: number) => `/notifications/${id}`,
  NOTIFICATIONS_DELETE_ALL: '/notifications',

  // Library
  LIBRARY_EXAM_TEMPLATES: '/library/exam-templates',
  LIBRARY_EXAM_TEMPLATE_VERSIONS: (sourceExamId: number) =>
    `/library/exam-templates/source/${sourceExamId}/versions`,
  LIBRARY_EXAM_TEMPLATE_CLONE: (id: number) =>
    `/library/exam-templates/${id}/clone`,
  LIBRARY_EXAM_TEMPLATE_VISIBILITY: (id: number) =>
    `/library/exam-templates/${id}/visibility`,
  LIBRARY_EXAM_TEMPLATE_LINEAGE_VISIBILITY: (sourceExamId: number) =>
    `/library/exam-templates/source/${sourceExamId}/visibility`,

  // Admin
  ADMIN_FEEDBACKS: '/admin/feedbacks',
  ADMIN_USERS: '/admin/users',
  ADMIN_USER_ROLE: (userId: number) => `/admin/users/${userId}/role`
})
