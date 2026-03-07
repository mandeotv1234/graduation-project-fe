'use server'

import { ApiResponse, Question } from '@/lib/types'

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
