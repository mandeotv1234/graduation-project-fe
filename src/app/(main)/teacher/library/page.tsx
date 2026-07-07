'use client'

import { ExamTemplateLibraryTab } from './components/exam-template-library-tab'

export default function LibraryPage() {
  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Thư viện
        </h1>
        <p className="mt-2 text-muted-foreground">
          Duyệt và clone đề thi mẫu được chia sẻ bởi giáo viên khác.
        </p>
      </div>

      <ExamTemplateLibraryTab />
    </div>
  )
}
