export type TeacherBreadcrumbItem = {
  key: string
  label: string
  href?: string
  clickable: boolean
}

type BreadcrumbParams = Record<string, string>
type BreadcrumbDynamicParams = Record<string, string | undefined>

type BreadcrumbContext = {
  pathname: string
  params: BreadcrumbParams
}

type BreadcrumbCrumbConfig = {
  label: string
  href?: string
  clickable?: boolean
}

type BreadcrumbTemplateRule = {
  id: string
  kind: 'template'
  template: string
  crumbs: BreadcrumbCrumbConfig[]
}

type BreadcrumbRegexRule = {
  id: string
  kind: 'regex'
  pattern: RegExp
  paramKeys?: string[]
  crumbs: (context: BreadcrumbContext) => BreadcrumbCrumbConfig[]
}

type BreadcrumbCustomRule = {
  id: string
  kind: 'custom'
  match: (pathname: string) => BreadcrumbParams | null
  crumbs: (context: BreadcrumbContext) => BreadcrumbCrumbConfig[]
}

type TeacherBreadcrumbRule =
  | BreadcrumbTemplateRule
  | BreadcrumbRegexRule
  | BreadcrumbCustomRule

const HOME_CRUMB: BreadcrumbCrumbConfig = {
  label: 'Trang chủ',
  href: '/teacher/classes',
  clickable: true
}

// Rule configuration for teacher breadcrumb chains.
// You can add more entries with template, regex, or custom matching logic.
const TEACHER_BREADCRUMB_RULES: TeacherBreadcrumbRule[] = [
  // {
  //   id: 'teacher-classes',
  //   kind: 'template',
  //   template: '/teacher/classes',
  //   crumbs: [HOME_CRUMB]
  // },
  {
    id: 'teacher-classes-create',
    kind: 'template',
    template: '/teacher/classes/create',
    crumbs: [
      HOME_CRUMB,
      { label: 'Tạo lớp', href: '/teacher/classes/create', clickable: true }
    ]
  },
  {
    id: 'teacher-class-detail',
    kind: 'template',
    template: '/teacher/classes/:classId',
    crumbs: [
      HOME_CRUMB,
      {
        label: ':classLabel',
        href: '/teacher/classes/:classId',
        clickable: true
      }
    ]
  },
  {
    id: 'teacher-class-create-exam',
    kind: 'template',
    template: '/teacher/classes/:classId/create-exam',
    crumbs: [
      HOME_CRUMB,
      {
        label: ':classLabel',
        href: '/teacher/classes/:classId',
        clickable: true
      },
      {
        label: 'Tạo bài thi',
        href: '/teacher/classes/:classId/create-exam',
        clickable: true
      }
    ]
  },
  {
    id: 'teacher-class-edit-class',
    kind: 'template',
    template: '/teacher/classes/:classId/edit',
    crumbs: [
      HOME_CRUMB,
      {
        label: ':classLabel',
        href: '/teacher/classes/:classId',
        clickable: true
      },
      {
        label: 'Chỉnh sửa',
        href: '/teacher/classes/:classId/edit',
        clickable: true
      }
    ]
  },
  {
    id: 'teacher-class-student-progress',
    kind: 'template',
    template: '/teacher/classes/:classId/students/:studentId/progress',
    crumbs: [
      HOME_CRUMB,
      {
        label: ':classLabel',
        href: '/teacher/classes/:classId',
        clickable: true
      },
      {
        label: 'Dữ liệu sinh viên - :studentLabel',
        href: '/teacher/classes/:classId/students/:studentId/progress',
        clickable: false
      }
    ]
  },
  {
    id: 'teacher-specifications',
    kind: 'template',
    template: '/teacher/specifications',
    crumbs: [
      HOME_CRUMB,
      {
        label: 'Đặc tả',
        href: '/teacher/specifications',
        clickable: true
      }
    ]
  },
  {
    id: 'teacher-schema-templates',
    kind: 'template',
    template: '/teacher/schema-templates',
    crumbs: [
      HOME_CRUMB,
      {
        label: 'Mẫu schema',
        href: '/teacher/schema-templates',
        clickable: true
      }
    ]
  },
  {
    id: 'teacher-exam-detail',
    kind: 'template',
    template: '/teacher/exams/:examId',
    crumbs: [
      HOME_CRUMB,
      {
        label: ':classLabel',
        href: '/teacher/classes/:classId',
        clickable: true
      },
      {
        label: ':examTitle',
        href: '/teacher/exams/:examId',
        clickable: false
      }
    ]
  },
  {
    id: 'teacher-library',
    kind: 'template',
    template: '/teacher/library',
    crumbs: [
      HOME_CRUMB,
      {
        label: 'Thư viện',
        href: '/teacher/library',
        clickable: true
      }
    ]
  },
  {
    id: 'teacher-exam-tabs',
    kind: 'regex',
    pattern:
      /^\/teacher\/exams\/(\d+)\/(questions|specification|monitor|common-part)$/,
    paramKeys: ['examId', 'tab'],
    crumbs: ({ params }) => {
      const tabLabelMap: Record<string, string> = {
        questions: 'Câu hỏi',
        specification: 'Đặc tả đề thi',
        monitor: 'Giám sát thi',
        'common-part': 'Phần yêu cầu chung'
      }

      return [
        HOME_CRUMB,
        {
          label: ':classLabel',
          href: '/teacher/classes/:classId',
          clickable: true
        },
        {
          label: ':examTitle',
          clickable: true,
          href: '/teacher/exams/:examId'
        },
        {
          label: tabLabelMap[params.tab] ?? params.tab,
          href: `/teacher/exams/${params.examId}/${params.tab}`,
          clickable: true
        }
      ]
    }
  },
  {
    id: 'teacher-exam-results',
    kind: 'regex',
    pattern: /^\/teacher\/exams\/(\d+)\/results(?:\/(\d+))?$/,
    paramKeys: ['examId', 'submissionId'],
    crumbs: ({ params }) => {
      const crumbs = [
        HOME_CRUMB,
        {
          label: ':classLabel',
          href: '/teacher/classes/:classId',
          clickable: true
        },
        {
          label: ':examTitle',
          href: '/teacher/exams/:examId',
          clickable: true
        },
        {
          label: 'Kết quả bài làm',
          href: '/teacher/exams/:examId/results',
          clickable: true
        }
      ]

      if (params.submissionId) {
        crumbs.push({
          label: 'Chi tiết bài làm',
          href: `/teacher/exams/${params.examId}/results/${params.submissionId}`,
          clickable: false
        })
      }

      return crumbs
    }
  },
  {
    id: 'specification-edit',
    kind: 'template',
    template: '/teacher/specifications/:specificationId/edit',
    crumbs: [
      HOME_CRUMB,
      {
        label: 'Đặc tả',
        href: '/teacher/specifications',
        clickable: true
      },
      {
        label: ':specificationName',
        href: '/teacher/specifications/:specificationId/edit',
        clickable: false
      }
    ]
  }
  // {
  //   id: 'teacher-fallback',
  //   kind: 'custom',
  //   match: (pathname) => {
  //     if (!pathname.startsWith('/teacher')) {
  //       return null
  //     }
  //     return {}
  //   },
  //   crumbs: () => [HOME_CRUMB]
  // }
]

function normalizePath(pathname: string) {
  if (!pathname) {
    return '/'
  }

  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1)
  }

  return pathname
}

function extractTemplateParams(pathname: string, template: string) {
  const pathSegments = normalizePath(pathname).split('/').filter(Boolean)
  const templateSegments = normalizePath(template).split('/').filter(Boolean)

  if (pathSegments.length !== templateSegments.length) {
    return null
  }

  const params: BreadcrumbParams = {}

  for (let i = 0; i < templateSegments.length; i += 1) {
    const segment = templateSegments[i]
    const value = pathSegments[i]

    if (segment.startsWith(':')) {
      params[segment.slice(1)] = value
      continue
    }

    if (segment !== value) {
      return null
    }
  }

  return params
}

function interpolate(template: string, params: BreadcrumbParams) {
  return template.replace(
    /:([A-Za-z0-9_]+)/g,
    (_, key: string) => params[key] ?? ''
  )
}

function resolveRule(
  pathname: string,
  rule: TeacherBreadcrumbRule
): BreadcrumbContext | null {
  const normalizedPath = normalizePath(pathname)

  if (rule.kind === 'template') {
    const params = extractTemplateParams(normalizedPath, rule.template)
    if (!params) {
      return null
    }

    return { pathname: normalizedPath, params }
  }

  if (rule.kind === 'regex') {
    const match = normalizedPath.match(rule.pattern)
    if (!match) {
      return null
    }

    const params: BreadcrumbParams = {}

    if (rule.paramKeys && rule.paramKeys.length > 0) {
      rule.paramKeys.forEach((key, index) => {
        const captureValue = match[index + 1]
        if (captureValue !== undefined) {
          params[key] = captureValue
        }
      })
    } else if (match.groups) {
      Object.assign(params, match.groups as BreadcrumbParams)
    }

    return {
      pathname: normalizedPath,
      params
    }
  }

  const customParams = rule.match(normalizedPath)
  if (!customParams) {
    return null
  }

  return {
    pathname: normalizedPath,
    params: customParams
  }
}

function materializeCrumbs(
  rule: TeacherBreadcrumbRule,
  context: BreadcrumbContext,
  dynamicParams: BreadcrumbDynamicParams
): TeacherBreadcrumbItem[] {
  const configs = rule.kind === 'template' ? rule.crumbs : rule.crumbs(context)
  const resolvedParams: BreadcrumbParams = {
    ...context.params,
    ...Object.fromEntries(
      Object.entries(dynamicParams).filter(([, value]) => value !== undefined)
    )
  } as BreadcrumbParams

  const seen = new Set<string>()

  return configs
    .map((crumb, index) => {
      const label = interpolate(crumb.label, resolvedParams)
      const href = crumb.href
        ? interpolate(crumb.href, resolvedParams)
        : undefined
      const clickable = crumb.clickable ?? Boolean(href)
      const uniqueKey = `${rule.id}:${href ?? label}:${index}`

      return {
        key: uniqueKey,
        label,
        href,
        clickable
      }
    })
    .filter((item) => {
      const dedupeKey = `${item.href ?? ''}|${item.label}`
      if (seen.has(dedupeKey)) {
        return false
      }

      seen.add(dedupeKey)
      return true
    })
}

export function resolveTeacherBreadcrumb(
  pathname: string,
  dynamicParams: BreadcrumbDynamicParams = {}
): TeacherBreadcrumbItem[] {
  const normalizedPath = normalizePath(pathname)

  for (const rule of TEACHER_BREADCRUMB_RULES) {
    const context = resolveRule(normalizedPath, rule)
    if (!context) {
      continue
    }

    return materializeCrumbs(rule, context, dynamicParams)
  }

  return []
}
