export const PATH = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  EXAM: '/exam',

  // Student paths
  STUDENT_EXAMS: '/student/exams',
  STUDENT_EXAM_DETAIL: (examId: number) => `/student/exams/${examId}`,
  STUDENT_EXAM_TAKE: (examId: number) => `/student/exams/${examId}/take`,

  // Teacher paths
  TEACHER_CLASSES: '/teacher/classes',
  TEACHER_CLASS_DETAIL: (classId: number) => `/teacher/classes/${classId}`,
  TEACHER_CREATE_CLASS: '/teacher/classes/create',
  TEACHER_CREATE_EXAM: (classId: number) =>
    `/teacher/classes/${classId}/create-exam`,
  TEACHER_EXAM_QUESTIONS: (examId: number) =>
    `/teacher/exams/${examId}/questions`,
  TEACHER_SCHEMA_TEMPLATES: '/teacher/schema-templates'
}

export const PRIVATE_PATH = [PATH.EXAM, '/student', '/teacher']

export const PUBLIC_PATH = [PATH.LOGIN, PATH.REGISTER]
