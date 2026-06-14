export const PATH = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',

  // Student paths
  STUDENT_EXAMS: '/student/exams',
  STUDENT_EXAM_DETAIL: (examId: number) => `/student/exams/${examId}`,
  STUDENT_EXAM_TAKE: (examId: number) => `/student/exams/${examId}/take`,
  STUDENT_EXAM_DOING: (examId: number) => `/student/exams/${examId}/take/doing`,
  STUDENT_EXAM_RESULTS: '/student/results',
  STUDENT_EXAM_RESULT_PROGRESS: (examId: number) =>
    `/student/results/exams/${examId}`,
  STUDENT_EXAM_RESULT: (resultId: number) => `/student/results/${resultId}`,
  STUDENT_EXAM_RESULT_FEEDBACK: (resultId: number) =>
    `/student/results/${resultId}/feedback`,

  // Teacher paths
  TEACHER_CLASSES: '/teacher/classes',
  TEACHER_CLASS_DETAIL: (classId: number) => `/teacher/classes/${classId}`,
  TEACHER_STUDENT_PROGRESS: (classId: number, studentId: number) =>
    `/teacher/classes/${classId}/students/${studentId}/progress`,
  TEACHER_CREATE_CLASS: '/teacher/classes/create',
  TEACHER_EDIT_CLASS: (classId: number) => `/teacher/classes/${classId}/edit`,
  TEACHER_CREATE_EXAM: (classId: number) =>
    `/teacher/classes/${classId}/create-exam`,
  TEACHER_EXAM_DETAIL: (examId: number) => `/teacher/exams/${examId}`,
  TEACHER_EXAM_RESULT: (examId: number, resultId: number) =>
    `/teacher/exams/${examId}/results/${resultId}`,
  TEACHER_EXAM_MONITOR: (examId: number) => `/teacher/exams/${examId}/monitor`,
  TEACHER_EXAM_QUESTIONS: (examId: number) =>
    `/teacher/exams/${examId}/questions`,
  TEACHER_EXAM_COMMON_PART: (examId: number) =>
    `/teacher/exams/${examId}/common-part`,
  TEACHER_EXAM_SPECIFICATION: (examId: number) =>
    `/teacher/exams/${examId}/specification`,
  TEACHER_SPECIFICATIONS: '/teacher/specifications',
  TEACHER_SPECIFICATION_CREATE: '/teacher/specifications/create',
  TEACHER_SPECIFICATION_EDIT: (specificationId: number) =>
    `/teacher/specifications/${specificationId}/edit`,
  TEACHER_LIBRARY: '/teacher/library',
  TEACHER_EXAM_PREVIEW: (examId: number) => `/teacher/exams/${examId}/preview`,

  // Admin paths
  ADMIN: '/admin',
  ADMIN_FEEDBACKS: '/admin/feedbacks',
  ADMIN_USERS: '/admin/users'
}

export const PRIVATE_PATH = ['/student', '/teacher', '/admin']

export const PUBLIC_PATH = [PATH.LOGIN, PATH.REGISTER]
