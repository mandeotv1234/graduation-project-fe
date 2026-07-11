'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import {
  GraduationCap,
  Users,
  BookOpen,
  FileText,
  Loader2,
  Search
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

export function GlobalSearch() {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [results, setResults] = React.useState<GlobalSearchResult | null>(null)

  React.useEffect(() => {
    if (!query || query.trim().length === 0) {
      setResults(null)
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await globalSearch(query)
        if (res.data) {
          setResults(res.data)
        }
      } catch (error) {
        console.error('Search error:', error)
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  const runCommand = React.useCallback((command: () => unknown) => {
    setOpen(false)
    command()
  }, [])

  const hasResults =
    results &&
    ((results.classes?.length ?? 0) > 0 ||
      (results.exams?.length ?? 0) > 0 ||
      (results.students?.length ?? 0) > 0 ||
      (results.specifications?.length ?? 0) > 0)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Tìm kiếm lớp học, bài thi, sinh viên..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              if (e.target.value.length > 0) setOpen(true)
              else setOpen(false)
            }}
            onFocus={(e) => {
              if (e.target.value.length > 0) setOpen(true)
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

            {!loading && query.length > 0 && !hasResults && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Không tìm thấy kết quả nào.
              </div>
            )}

            {!loading && hasResults && (
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
