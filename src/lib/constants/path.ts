export const PATH = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',

  // Student paths
  STUDENT_EXAMS: '/student/exams',
  STUDENT_EXAM_DETAIL: (examId: number) => `/student/exams/${examId}`,
  STUDENT_EXAM_TAKE: (examId: number) => `/student/exams/${examId}/take`,
  STUDENT_EXAM_DOING: (examId: number) => `/student/exams/${examId}/take/doing`,

  // Teacher paths
  TEACHER_CLASSES: '/teacher/classes',
  TEACHER_CLASS_DETAIL: (classId: number) => `/teacher/classes/${classId}`,
  TEACHER_CREATE_CLASS: '/teacher/classes/create',
  TEACHER_CREATE_EXAM: (classId: number) =>
    `/teacher/classes/${classId}/create-exam`,
  TEACHER_EXAM_QUESTIONS: (examId: number) =>
    `/teacher/exams/${examId}/questions`,
  TEACHER_EXAM_SPECIFICATION: (examId: number) =>
    `/teacher/exams/${examId}/specification`,
  TEACHER_SPECIFICATIONS: '/teacher/specifications'
}

export const PRIVATE_PATH = ['/student', '/teacher']

export const PUBLIC_PATH = [PATH.LOGIN, PATH.REGISTER]
