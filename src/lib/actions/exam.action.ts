'use server'

import { apiClient } from '@/lib/api'
import { ENDPOINTS } from '@/lib/constants'
import {
  ApiResponse,
  CreateExamRequest,
  CreateExamResponse,
  ExamQuestionItem,
  Question,
  TeacherExamDetail,
  TeacherExamMonitorData,
  UpdateExamQuestionRequest,
  UpdateExamRequest
} from '@/lib/types'

const mockQuestions: Question[] = [
  {
    id: 1,
    status: 'completed',
    title: 'Truy vấn thông tin nhân viên',
    description:
      'Truy xuất tên, họ và tên phòng ban của tất cả nhân viên được thuê sau ngày 1 tháng 1 năm 2022. Kết quả phải được sắp xếp theo họ theo thứ tự tăng dần.',
    defaultCode: `-- Viết truy vấn của bạn tại đây
SELECT 
    first_name,
    last_name,
    department_name
FROM 
    Employees
JOIN 
    Departments ON Employees.department_id = Departments.id
WHERE 
    hire_date > '2022-01-01'
ORDER BY 
    last_name ASC;`
  },
  {
    id: 2,
    status: 'pending',
    title: 'Đếm số lượng nhân viên',
    description:
      'Đếm tổng số nhân viên trong mỗi phòng ban. Kết quả bao gồm tên phòng ban và số lượng nhân viên, sắp xếp theo số lượng giảm dần.',
    defaultCode: `-- Viết truy vấn của bạn tại đây
SELECT 
    d.department_name,
    COUNT(e.id) as employee_count
FROM 
    Departments d
LEFT JOIN 
    Employees e ON d.id = e.department_id
GROUP BY 
    d.id, d.department_name
ORDER BY 
    employee_count DESC;`
  },
  {
    id: 3,
    status: 'pending',
    title: 'Tìm nhân viên lương cao nhất',
    description:
      'Tìm nhân viên có mức lương cao nhất trong mỗi phòng ban. Hiển thị tên nhân viên, tên phòng ban và mức lương.',
    defaultCode: `-- Viết truy vấn của bạn tại đây
-- Giả sử có cột salary trong bảng Employees
SELECT 
    e.first_name,
    e.last_name,
    d.department_name,
    e.salary
FROM 
    Employees e
JOIN 
    Departments d ON e.department_id = d.id
WHERE 
    e.salary = (
        SELECT MAX(salary) 
        FROM Employees 
        WHERE department_id = e.department_id
    );`
  },
  {
    id: 4,
    status: 'pending',
    title: 'Cập nhật thông tin',
    description:
      'Viết câu lệnh UPDATE để tăng lương thêm 10% cho tất cả nhân viên thuộc phòng ban "IT".',
    defaultCode: `-- Viết truy vấn của bạn tại đây
UPDATE Employees
SET salary = salary * 1.1
WHERE department_id = (
    SELECT id FROM Departments WHERE department_name = 'IT'
);`
  },
  {
    id: 5,
    status: 'pending',
    title: 'Xóa dữ liệu cũ',
    description:
      'Viết câu lệnh DELETE để xóa tất cả nhân viên đã nghỉ việc trước năm 2020.',
    defaultCode: `-- Viết truy vấn của bạn tại đây
DELETE FROM Employees
WHERE hire_date < '2020-01-01' AND status = 'resigned';`
  }
]

export async function getExamQuestions(): Promise<ApiResponse<Question[]>> {
  return {
    data: mockQuestions,
    code: '200',
    message: 'Fetched exam questions successfully'
  }
}

export async function getTeacherExamDetail(
  examId: number
): Promise<ApiResponse<TeacherExamDetail>> {
  return apiClient.get<TeacherExamDetail>(`/exams/${examId}/teacher-detail`, {
    cache: 'no-store'
  })
}

export async function getTeacherExamMonitor(
  examId: number,
  params: {
    page?: number
    size?: number
    keyword?: string
    riskFilter?: string
    examStatusFilter?: string
    highRiskThreshold?: number
    sortColumn?: string
    sortDirection?: string
  } = {}
): Promise<ApiResponse<TeacherExamMonitorData>> {
  return apiClient.get<TeacherExamMonitorData>(ENDPOINTS.EXAM_MONITOR(examId), {
    queries: {
      page: params.page ?? 1,
      size: params.size ?? 10,
      keyword: params.keyword ?? '',
      riskFilter: params.riskFilter ?? 'all',
      examStatusFilter: params.examStatusFilter ?? 'IN_PROGRESS',
      highRiskThreshold: params.highRiskThreshold ?? 3,
      sortColumn: params.sortColumn ?? 'violationCount',
      sortDirection: params.sortDirection ?? 'desc'
    },
    cache: 'no-store'
  })
}

export async function updateExam(
  examId: number,
  data: UpdateExamRequest
): Promise<ApiResponse<TeacherExamDetail>> {
  return apiClient.put<TeacherExamDetail>(`/exams/${examId}`, data)
}

export async function createExam(
  data: CreateExamRequest
): Promise<ApiResponse<CreateExamResponse>> {
  return apiClient.post<CreateExamResponse>(ENDPOINTS.CREATE_EXAM, data)
}

export async function deleteExam(examId: number): Promise<ApiResponse<void>> {
  return apiClient.delete(`/exams/${examId}`)
}

export async function updateExamQuestion(
  examId: number,
  questionId: number,
  data: UpdateExamQuestionRequest
): Promise<ApiResponse<ExamQuestionItem>> {
  return apiClient.put<ExamQuestionItem>(
    ENDPOINTS.EXAM_QUESTION_DETAIL(examId, questionId),
    data
  )
}

export async function deleteExamQuestion(
  examId: number,
  questionId: number
): Promise<ApiResponse<void>> {
  return apiClient.delete(ENDPOINTS.EXAM_QUESTION_DETAIL(examId, questionId))
}

export async function remindStudent(
  examId: number,
  studentId: number,
  message: string
): Promise<ApiResponse<void>> {
  return apiClient.post(`/exams/${examId}/students/${studentId}/remind`, {
    message
  })
}

export async function forceSubmitStudentExam(
  examId: number,
  studentId: number
): Promise<ApiResponse<void>> {
  return apiClient.post(
    `/exams/${examId}/students/${studentId}/force-submit`,
    {}
  )
}
