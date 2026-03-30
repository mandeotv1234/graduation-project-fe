'use client'

import { ExamTemplateLibraryTab } from './components/exam-template-library-tab'

export default function LibraryPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
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
