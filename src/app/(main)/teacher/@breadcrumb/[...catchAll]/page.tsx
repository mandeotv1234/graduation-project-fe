import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

import { resolveTeacherBreadcrumb } from '@/app/(main)/teacher/components/teacher-breadcrumb-rules'
import {
  getClassDetail,
  getClassExams,
  getClasses,
  getTeacherExamDetail
} from '@/lib/actions'

type TeacherBreadcrumbSlotProps = {
  params: Promise<{ catchAll: string[] }>
}

type ResolvedExamMeta = {
  classId: string
  classLabel: string
  examTitle: string
}

function parseClassId(catchAll: string[]) {
  if (catchAll[0] === 'classes' && /^\d+$/.test(catchAll[1] ?? '')) {
    return catchAll[1]
  }

  return null
}

function parseExamId(catchAll: string[]) {
  if (catchAll[0] === 'exams' && /^\d+$/.test(catchAll[1] ?? '')) {
    return catchAll[1]
  }

  return null
}

async function findExamMetaFromTeacherClasses(
  examId: number
): Promise<ResolvedExamMeta | null> {
  const pageSize = 50
  let currentPage = 1
  let totalPages = 1

  while (currentPage <= totalPages) {
    const classesResponse = await getClasses(currentPage, pageSize)
    const classes = classesResponse.data ?? []
    const total = classesResponse.meta?.pagination?.total ?? classes.length
    totalPages = Math.max(1, Math.ceil(total / pageSize))

    if (classes.length === 0) {
      return null
    }

    const examResponses = await Promise.all(
      classes.map(async (classItem) => {
        try {
          const response = await getClassExams(classItem.id)
          return {
            classItem,
            exams: response.data ?? []
          }
        } catch {
          return {
            classItem,
            exams: []
          }
        }
      })
    )

    for (const examResponse of examResponses) {
      const matchedExam = examResponse.exams.find((item) => item.id === examId)

      if (matchedExam) {
        return {
          classId: String(examResponse.classItem.id),
          classLabel: `Lớp ${examResponse.classItem.classCode}`,
          examTitle: matchedExam.title
        }
      }
    }

    currentPage += 1
  }

  return null
}

export default async function TeacherBreadcrumbSlot({
  params
}: TeacherBreadcrumbSlotProps) {
  const { catchAll } = await params

  if (!catchAll || catchAll.length === 0) {
    return null
  }

  const pathname = `/teacher/${catchAll.join('/')}`

  const classId = parseClassId(catchAll)
  const examId = parseExamId(catchAll)

  let classLabel: string | undefined
  let classIdForExam: string | undefined
  let examTitle: string | undefined

  if (classId) {
    try {
      const classResponse = await getClassDetail(Number(classId))
      classLabel = classResponse.data?.classCode
        ? `Lớp ${classResponse.data.classCode}`
        : `Lớp ${classId}`
    } catch {
      classLabel = `Lớp ${classId}`
    }
  }

  if (examId) {
    try {
      const examResponse = await getTeacherExamDetail(Number(examId))
      const examData = examResponse.data

      if (examData) {
        classIdForExam = String(examData.classId)
        examTitle = examData.title

        try {
          const classResponse = await getClassDetail(examData.classId)
          classLabel = classResponse.data?.classCode
            ? `Lớp ${classResponse.data.classCode}`
            : `Lớp ${examData.classId}`
        } catch {
          classLabel = `Lớp ${examData.classId}`
        }
      } else {
        const fallbackMeta = await findExamMetaFromTeacherClasses(
          Number(examId)
        )

        if (fallbackMeta) {
          classIdForExam = fallbackMeta.classId
          classLabel = fallbackMeta.classLabel
          examTitle = fallbackMeta.examTitle
        } else {
          classLabel = 'Lớp học'
          examTitle = `Bài thi ${examId}`
        }
      }
    } catch {
      const fallbackMeta = await findExamMetaFromTeacherClasses(Number(examId))

      if (fallbackMeta) {
        classIdForExam = fallbackMeta.classId
        classLabel = fallbackMeta.classLabel
        examTitle = fallbackMeta.examTitle
      } else {
        classLabel = 'Lớp học'
        examTitle = `Bài thi ${examId}`
      }
    }
  }

  const items = resolveTeacherBreadcrumb(pathname, {
    classId: classIdForExam,
    classLabel,
    examTitle
  }).map((item) => {
    if (item.href === '/teacher/classes/') {
      return {
        ...item,
        href: undefined,
        clickable: false
      }
    }

    return item
  })

  if (items.length === 0) {
    return null
  }

  return (
    <nav aria-label="Breadcrumb" className="mb-5 pt-1">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
        {items.map((item, index) => {
          const isLast = index === items.length - 1

          return (
            <li key={item.key} className="flex items-center gap-1">
              {index > 0 && <ChevronRight className="h-3.5 w-3.5" />}
              {isLast || !item.clickable || !item.href ? (
                <span className="font-medium text-foreground">
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="hover:text-foreground transition-colors"
                >
                  {item.label}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
