export * from '@/lib/actions/auth.action'
export {
  getExamQuestions,
  getTeacherExamDetail,
  getTeacherExamMonitor,
  updateExam,
  createExam,
  updateExamQuestion,
  deleteExamQuestion
} from '@/lib/actions/exam.action'
export * from '@/lib/actions/student-exam.action'
export {
  getClasses,
  getClassDetail,
  createClass,
  updateClass,
  getStudentsInClass,
  getClassExams,
  getClassTeachers,
  addTeacherToClass,
  removeTeacherFromClass,
  getTeacherExamSettings,
  updateTeacherExamSettings,
  getTeacherExamTemplateVersions,
  getExamResults
} from '@/lib/actions/teacher.action'
export * from '@/lib/actions/anti-cheat.action'
export * from '@/lib/actions/notification.action'
export {
  getSpecifications,
  createSpecification,
  getExamSpecification,
  saveExamSpecification,
  createExamQuestionsBatch,
  getSpecificationDetail,
  updateSpecification,
  generateGradingRubric,
  testGradeCreateTable,
  testGradeInsertData,
  testGradeSelectData
} from '@/lib/actions/exam-specification.action'
export * from '@/lib/actions/library.action'
