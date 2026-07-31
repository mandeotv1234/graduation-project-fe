'use client'

import * as React from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
  GraduationCap,
  Users,
  BookOpen,
  FileText,
  Loader2,
  Search,
  Sparkles
} from 'lucide-react'

import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { PATH } from '@/lib/constants'
import { globalSearch, GlobalSearchResult } from '@/lib/actions/search.action'

type FeatureSearchItem = {
  title: string
  description: string
  href: string | ((context: FeatureSearchContext) => string)
  keywords: string[]
}

type FeatureSearchContext = {
  pathname: string
  classId: number | null
  examId: number | null
  specificationId: number | null
}

type FeatureSearchResult = {
  title: string
  description: string
  href: string
}

const FEATURE_SEARCH_ITEMS: FeatureSearchItem[] = [
  {
    title: 'Đặc tả',
    description: 'Quản lý đặc tả cơ sở dữ liệu',
    href: PATH.TEACHER_SPECIFICATIONS,
    keywords: ['đặc tả', 'dac ta', 'spec', 'specification', 'schema']
  },
  {
    title: 'Tạo đặc tả',
    description: 'Tạo đặc tả cơ sở dữ liệu mới',
    href: PATH.TEACHER_SPECIFICATION_CREATE,
    keywords: [
      'tạo đặc tả',
      'tao dac ta',
      'thêm đặc tả',
      'them dac ta',
      'create specification'
    ]
  },
  {
    title: 'Sửa đặc tả',
    description: 'Mở đặc tả hiện tại nếu có, hoặc danh sách đặc tả để chọn',
    href: (context) =>
      context.specificationId
        ? PATH.TEACHER_SPECIFICATION_EDIT(context.specificationId)
        : PATH.TEACHER_SPECIFICATIONS,
    keywords: [
      'sửa đặc tả',
      'sua dac ta',
      'edit specification',
      'chỉnh đặc tả',
      'chinh dac ta'
    ]
  },
  {
    title: 'Thiết kế CSDL',
    description: 'Mở màn hình tạo đặc tả để thiết kế schema và dataset',
    href: PATH.TEACHER_SPECIFICATION_CREATE,
    keywords: [
      'thiết kế csdl',
      'thiet ke csdl',
      'database builder',
      'schema builder',
      'dataset',
      'erd',
      'ddl'
    ]
  },
  {
    title: 'Lớp học',
    description: 'Danh sách lớp học đang quản lý',
    href: PATH.TEACHER_CLASSES,
    keywords: ['lớp học', 'lop hoc', 'class', 'classes']
  },
  {
    title: 'Tạo lớp học',
    description: 'Tạo lớp học mới',
    href: PATH.TEACHER_CREATE_CLASS,
    keywords: [
      'tạo lớp',
      'tao lop',
      'tạo lớp học',
      'tao lop hoc',
      'create class'
    ]
  },
  {
    title: 'Sửa lớp học',
    description: 'Mở lớp hiện tại nếu có, hoặc danh sách lớp để chọn',
    href: (context) =>
      context.classId
        ? PATH.TEACHER_EDIT_CLASS(context.classId)
        : PATH.TEACHER_CLASSES,
    keywords: [
      'sửa lớp',
      'sua lop',
      'chỉnh lớp',
      'chinh lop',
      'edit class',
      'cập nhật lớp',
      'cap nhat lop'
    ]
  },
  {
    title: 'Danh sách sinh viên',
    description: 'Mở lớp hiện tại nếu có, hoặc danh sách lớp để chọn sinh viên',
    href: (context) =>
      context.classId
        ? PATH.TEACHER_CLASS_DETAIL(context.classId)
        : PATH.TEACHER_CLASSES,
    keywords: [
      'sinh viên',
      'sinh vien',
      'student',
      'students',
      'danh sách sinh viên',
      'danh sach sinh vien'
    ]
  },
  {
    title: 'Cấm thi sinh viên',
    description: 'Mở lớp hiện tại để quản lý danh sách sinh viên bị cấm thi',
    href: (context) =>
      context.classId
        ? PATH.TEACHER_CLASS_DETAIL(context.classId)
        : PATH.TEACHER_CLASSES,
    keywords: [
      'cấm thi',
      'cam thi',
      'bị cấm thi',
      'bi cam thi',
      'ban student',
      'unban',
      'vi phạm',
      'vi pham'
    ]
  },
  {
    title: 'Giáo viên lớp',
    description: 'Mở lớp hiện tại để quản lý giáo viên đồng giảng dạy',
    href: (context) =>
      context.classId
        ? PATH.TEACHER_CLASS_DETAIL(context.classId)
        : PATH.TEACHER_CLASSES,
    keywords: [
      'giáo viên lớp',
      'giao vien lop',
      'đồng giảng',
      'dong giang',
      'teacher class',
      'thêm giáo viên',
      'them giao vien'
    ]
  },
  {
    title: 'Tạo bài thi',
    description:
      'Mở trang tạo bài thi nếu đang ở lớp; nếu chưa, mở danh sách lớp',
    href: (context) =>
      context.classId
        ? PATH.TEACHER_CREATE_EXAM(context.classId)
        : PATH.TEACHER_CLASSES,
    keywords: [
      'tạo bài thi',
      'tao bai thi',
      'tạo đề thi',
      'tao de thi',
      'create exam',
      'new exam'
    ]
  },
  {
    title: 'Chi tiết bài thi',
    description:
      'Mở bài thi hiện tại nếu có, hoặc danh sách lớp để chọn bài thi',
    href: (context) =>
      context.examId
        ? PATH.TEACHER_EXAM_DETAIL(context.examId)
        : PATH.TEACHER_CLASSES,
    keywords: [
      'bài thi',
      'bai thi',
      'đề thi',
      'de thi',
      'exam',
      'exam detail',
      'chi tiết bài thi',
      'chi tiet bai thi'
    ]
  },
  {
    title: 'Câu hỏi bài thi',
    description: 'Mở tab câu hỏi của bài thi hiện tại nếu có',
    href: (context) =>
      context.examId
        ? PATH.TEACHER_EXAM_QUESTIONS(context.examId)
        : PATH.TEACHER_CLASSES,
    keywords: [
      'câu hỏi',
      'cau hoi',
      'question',
      'questions',
      'rubric',
      'test case',
      'testcase',
      'chấm điểm',
      'cham diem'
    ]
  },
  {
    title: 'Kết quả bài thi',
    description: 'Mở trang kết quả của bài thi hiện tại nếu có',
    href: (context) =>
      context.examId
        ? `/teacher/exams/${context.examId}/results`
        : PATH.TEACHER_CLASSES,
    keywords: [
      'kết quả',
      'ket qua',
      'result',
      'results',
      'bài nộp',
      'bai nop',
      'submission',
      'submissions',
      'điểm',
      'diem'
    ]
  },
  {
    title: 'Giám sát bài thi',
    description: 'Mở màn hình giám sát của bài thi hiện tại nếu có',
    href: (context) =>
      context.examId
        ? PATH.TEACHER_EXAM_MONITOR(context.examId)
        : PATH.TEACHER_CLASSES,
    keywords: [
      'giám sát',
      'giam sat',
      'monitor',
      'anti cheating',
      'chống gian lận',
      'chong gian lan',
      'violation',
      'vi phạm',
      'vi pham'
    ]
  },
  {
    title: 'Preview bài thi',
    description: 'Mở chế độ xem thử của bài thi hiện tại nếu có',
    href: (context) =>
      context.examId
        ? PATH.TEACHER_EXAM_PREVIEW(context.examId)
        : PATH.TEACHER_CLASSES,
    keywords: [
      'preview',
      'xem thử',
      'xem thu',
      'kiểm thử bài thi',
      'kiem thu bai thi',
      'thi thử',
      'thi thu'
    ]
  },
  {
    title: 'Cấu hình bài thi',
    description: 'Mở chi tiết bài thi hiện tại để chỉnh cấu hình',
    href: (context) =>
      context.examId
        ? PATH.TEACHER_EXAM_DETAIL(context.examId)
        : PATH.TEACHER_CLASSES,
    keywords: [
      'cấu hình bài thi',
      'cau hinh bai thi',
      'settings',
      'exam settings',
      'chỉnh bài thi',
      'chinh bai thi',
      'sửa bài thi',
      'sua bai thi',
      'thời gian thi',
      'thoi gian thi'
    ]
  },
  {
    title: 'Import Moodle SQL',
    description: 'Mở chi tiết bài thi hiện tại để import file SQL từ Moodle',
    href: (context) =>
      context.examId
        ? PATH.TEACHER_EXAM_DETAIL(context.examId)
        : PATH.TEACHER_CLASSES,
    keywords: [
      'moodle',
      'import moodle',
      'sql import',
      'import sql',
      'nộp file sql',
      'nop file sql',
      'chấm file sql',
      'cham file sql'
    ]
  },
  {
    title: 'Xuất PDF bài thi',
    description: 'Mở chi tiết bài thi hiện tại để xuất đề thi PDF',
    href: (context) =>
      context.examId
        ? PATH.TEACHER_EXAM_DETAIL(context.examId)
        : PATH.TEACHER_CLASSES,
    keywords: [
      'pdf',
      'xuất pdf',
      'xuat pdf',
      'export pdf',
      'in đề',
      'in de',
      'đề pdf',
      'de pdf'
    ]
  },
  {
    title: 'Template bài thi',
    description: 'Mở chi tiết bài thi hiện tại hoặc thư viện đề thi mẫu',
    href: (context) =>
      context.examId
        ? PATH.TEACHER_EXAM_DETAIL(context.examId)
        : PATH.TEACHER_LIBRARY,
    keywords: [
      'template',
      'mẫu đề',
      'mau de',
      'lưu template',
      'luu template',
      'chia sẻ đề',
      'chia se de',
      'share exam'
    ]
  },
  {
    title: 'Thư viện đề thi',
    description: 'Quản lý và tạo bảng sao từ đề thi mẫu',
    href: PATH.TEACHER_LIBRARY,
    keywords: [
      'thư viện',
      'thu vien',
      'library',
      'template',
      'đề mẫu',
      'de mau'
    ]
  }
]

function extractPathId(pathname: string, pattern: RegExp) {
  const matched = pathname.match(pattern)
  if (!matched?.[1]) return null

  const parsed = Number(matched[1])
  return Number.isFinite(parsed) ? parsed : null
}

function buildFeatureSearchContext(pathname: string): FeatureSearchContext {
  return {
    pathname,
    classId: extractPathId(pathname, /^\/teacher\/classes\/(\d+)/),
    examId: extractPathId(pathname, /^\/teacher\/exams\/(\d+)/),
    specificationId: extractPathId(
      pathname,
      /^\/teacher\/specifications\/(\d+)/
    )
  }
}

function resolveFeatureHref(
  item: FeatureSearchItem,
  context: FeatureSearchContext
) {
  return typeof item.href === 'function' ? item.href(context) : item.href
}

function normalizeSearchText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
}

function matchFeatureSearchItems(
  query: string,
  context: FeatureSearchContext
): FeatureSearchResult[] {
  const normalizedQuery = normalizeSearchText(query.trim())
  if (!normalizedQuery) return []

  return FEATURE_SEARCH_ITEMS.filter((item) =>
    normalizeSearchText(
      [item.title, item.description, ...item.keywords].join(' ')
    ).includes(normalizedQuery)
  ).map((item) => ({
    title: item.title,
    description: item.description,
    href: resolveFeatureHref(item, context)
  }))
}

export function GlobalSearch() {
  const router = useRouter()
  const pathname = usePathname()
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [results, setResults] = React.useState<GlobalSearchResult | null>(null)
  const requestSeqRef = React.useRef(0)
  const trimmedQuery = query.trim()
  const featureSearchContext = React.useMemo(
    () => buildFeatureSearchContext(pathname),
    [pathname]
  )
  const featureResults = React.useMemo(
    () => matchFeatureSearchItems(trimmedQuery, featureSearchContext),
    [featureSearchContext, trimmedQuery]
  )

  React.useEffect(() => {
    const trimmedQuery = query.trim()
    const requestSeq = ++requestSeqRef.current

    if (trimmedQuery.length === 0) {
      setResults(null)
      setLoading(false)
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await globalSearch(trimmedQuery)
        if (requestSeqRef.current !== requestSeq) {
          return
        }
        setResults(res.data ?? null)
      } catch (error) {
        if (requestSeqRef.current !== requestSeq) {
          return
        }
        console.error('Search error:', error)
        setResults(null)
      } finally {
        if (requestSeqRef.current === requestSeq) {
          setLoading(false)
        }
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  const runCommand = React.useCallback((command: () => unknown) => {
    setOpen(false)
    command()
  }, [])

  const hasDataResults =
    results &&
    ((results.classes?.length ?? 0) > 0 ||
      (results.exams?.length ?? 0) > 0 ||
      (results.students?.length ?? 0) > 0 ||
      (results.specifications?.length ?? 0) > 0)
  const hasFeatureResults = featureResults.length > 0
  const hasResults = hasFeatureResults || Boolean(hasDataResults)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Tìm kiếm chức năng, lớp học, bài thi..."
            value={query}
            onChange={(e) => {
              const nextQuery = e.target.value
              setQuery(nextQuery)
              if (nextQuery.trim().length > 0) setOpen(true)
              else setOpen(false)
            }}
            onFocus={(e) => {
              if (e.target.value.trim().length > 0) setOpen(true)
            }}
            className="w-full h-9 pl-9 bg-surface-container/50 focus-visible:ring-1 focus-visible:border-border focus-visible:bg-surface-container-lowest rounded-full transition-all shadow-none border-none"
          />
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Command shouldFilter={false} className="border-none">
          <CommandList>
            {loading && (
              <div className="flex items-center justify-center p-4 text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang tìm kiếm...
              </div>
            )}

            {hasFeatureResults && (
              <CommandGroup heading="Chức năng">
                {featureResults.map((item) => (
                  <CommandItem
                    key={`feature-${item.href}`}
                    onSelect={() => runCommand(() => router.push(item.href))}
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    <div className="min-w-0">
                      <div className="truncate">{item.title}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {item.description}
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {!loading && trimmedQuery.length > 0 && !hasResults && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Không tìm thấy kết quả nào.
              </div>
            )}

            {!loading && hasDataResults && (
              <>
                {results.classes && results.classes.length > 0 && (
                  <CommandGroup heading="Lớp học">
                    {results.classes.map((cls) => (
                      <CommandItem
                        key={`class-${cls.id}`}
                        onSelect={() =>
                          runCommand(() =>
                            router.push(PATH.TEACHER_CLASS_DETAIL(cls.id))
                          )
                        }
                      >
                        <GraduationCap className="mr-2 h-4 w-4" />
                        <span>{cls.name}</span>
                        {cls.teacherName && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            - {cls.teacherName}
                          </span>
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {results.exams && results.exams.length > 0 && (
                  <CommandGroup heading="Bài thi">
                    {results.exams.map((exam) => (
                      <CommandItem
                        key={`exam-${exam.id}`}
                        onSelect={() =>
                          runCommand(() =>
                            router.push(PATH.TEACHER_EXAM_DETAIL(exam.id))
                          )
                        }
                      >
                        <BookOpen className="mr-2 h-4 w-4" />
                        <span>{exam.title}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {results.students && results.students.length > 0 && (
                  <CommandGroup heading="Sinh viên">
                    {results.students.map((student) => (
                      <CommandItem
                        key={`student-${student.id}`}
                        onSelect={() =>
                          runCommand(() =>
                            router.push(`/teacher/students/${student.id}`)
                          )
                        }
                      >
                        <Users className="mr-2 h-4 w-4" />
                        <span>{student.fullName}</span>
                        {student.studentCode && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            ({student.studentCode})
                          </span>
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {results.specifications &&
                  results.specifications.length > 0 && (
                    <CommandGroup heading="Đặc tả Bài thi">
                      {results.specifications.map((spec) => (
                        <CommandItem
                          key={`spec-${spec.id}`}
                          onSelect={() =>
                            runCommand(() =>
                              router.push(
                                PATH.TEACHER_SPECIFICATION_EDIT(spec.id)
                              )
                            )
                          }
                        >
                          <FileText className="mr-2 h-4 w-4" />
                          <span>{spec.name}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
