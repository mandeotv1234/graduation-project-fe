'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
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
  href: string
  keywords: string[]
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
    title: 'Thư viện đề thi',
    description: 'Quản lý và clone đề thi mẫu',
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

function normalizeSearchText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
}

function matchFeatureSearchItems(query: string) {
  const normalizedQuery = normalizeSearchText(query.trim())
  if (!normalizedQuery) return []

  return FEATURE_SEARCH_ITEMS.filter((item) => {
    const haystack = normalizeSearchText(
      [item.title, item.description, ...item.keywords].join(' ')
    )
    return haystack.includes(normalizedQuery)
  })
}

export function GlobalSearch() {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [results, setResults] = React.useState<GlobalSearchResult | null>(null)
  const requestSeqRef = React.useRef(0)
  const trimmedQuery = query.trim()
  const featureResults = React.useMemo(
    () => matchFeatureSearchItems(trimmedQuery),
    [trimmedQuery]
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
