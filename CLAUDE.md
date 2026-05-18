# CLAUDE.md — graduation-project-fe

## Tech Stack

- **Next.js** (App Router) / **TypeScript 5** / **Tailwind CSS 4**
- **Redux Toolkit** (global client state)
- **react-hook-form** + **zod** (forms and validation)
- **Sonner** (toast notifications)
- **Shadcn/UI** + **Lucide React** (UI primitives and icons)
- **STOMP / SockJS** (WebSocket for exam monitoring)
- **Husky** + **lint-staged** (pre-commit hooks)

## Running the Project

```bash
npm run dev      # start dev server (localhost:3000)
npm run build    # production build
npm run lint     # run ESLint
```

## Architecture

### Route Structure (App Router)

```
src/app/
  (auth)/        → Login, Register pages (public)
  (main)/        → Protected pages (student, teacher, admin)
    student/     → Student exam flow
    teacher/     → Teacher class/exam management
    admin/       → Admin feedbacks and user management
  api/           → Next.js Route Handlers (proxied endpoints)
```

### Source Layout

```
src/
  app/           → Pages and layouts (Next.js App Router)
  components/
    ui/          → Shadcn/UI primitives
    shared/      → Reusable cross-page business components
  hooks/         → Global custom hooks
  lib/
    actions/     → Server Actions ('use server') — all API calls
    api/         → apiClient and HTTP utilities
    constants/   → PATH and ENDPOINTS
    redux/       → Redux store and slices
    socket/      → WebSocket client
    types/       → TypeScript interfaces
    utils/       → Pure utility functions
```

## Key Patterns

### React Server Components (RSC)

- Pages and layouts are **Server Components by default** — no `'use client'` unless you need hooks or event handlers.
- Fetch data in server components by calling Server Actions directly (no `useEffect` + fetch).

### Server Actions

All API calls go through Server Actions in `src/lib/actions/`.

```ts
'use server'
import { apiClient } from '@/lib/api/apiClient'
import { ENDPOINTS } from '@/lib/constants/endpoint'

export async function getAdminFeedbacks(page = 0, size = 10) {
  const data = await apiClient.get(
    `${ENDPOINTS.ADMIN_FEEDBACKS}?page=${page}&size=${size}`
  )
  return data as PaginatedApiResponse<FeedbackItem>
}
```

- Use `useTransition` in client components to call server actions without blocking the UI.
- Show Sonner toasts for success/error feedback.

### API Client

- `apiClient` in `src/lib/api/` — handles token attachment and silent refresh.
- Always cast the return type explicitly: `data as MyType` or `data as PaginatedApiResponse<T>`.

### Pagination

- Backend returns `PaginationResponseDto<T>` — the FE type is `PaginatedApiResponse<T>` (defined in `teacher.type.ts`).
- Shape: `{ data: { items: T[], meta: { page, size, total, totalPages } } }`

### Constants

- All routes: `PATH` in `src/lib/constants/path.ts`
- All API endpoints: `ENDPOINTS` in `src/lib/constants/endpoint.ts`
- Never hardcode route strings or endpoint URLs inline — always use these constants.

### Types

- All types exported from `src/lib/types/index.ts` via barrel exports.
- Add new type files and re-export from `index.ts`.
- No `any` — use `unknown` or generics when a type is uncertain.

### State Management

- **Server state**: fetch in Server Components or Server Actions; use Next.js cache.
- **Global client state**: Redux Toolkit (`src/lib/redux/slices/`).
- **Local state**: `useState` / `useReducer`.

### Forms

- Always use `react-hook-form` with a `zod` schema.
- Use `z.infer<typeof schema>` to derive the TypeScript type from the schema.

### Auth and Role-Based Routing

- Auth state from `src/lib/redux/slices/` (user slice).
- Role constants in `ROLES` — values: `STUDENT`, `TEACHER`, `ADMIN`.
- Login redirects: STUDENT → `/student/exams`, TEACHER → `/teacher/classes`, ADMIN → `/admin/feedbacks`.
- `PRIVATE_PATH = ['/student', '/teacher', '/admin']` in `path.ts`.

## Component Structure

### Every component lives in its own folder

```
components/
  feedback-list/
    feedback-list.tsx
    feedback-list.module.scss   ← include even if empty
```

### Component Code Order

1. `'use client'` directive (if needed)
2. Imports (React, Next.js, third-party, internal)
3. TypeScript interfaces/types for props
4. Component definition (arrow function, named export)
5. Hooks (Redux → Context → Custom → State)
6. Handlers
7. JSX return

### Class Utilities

Use `cn()` (from `src/lib/utils`) for conditional Tailwind classes — never concatenate class strings manually.

## Important Files

| File | Purpose |
|------|---------|
| `src/lib/constants/path.ts` | All route path constants (`PATH`) |
| `src/lib/constants/endpoint.ts` | All API endpoint constants (`ENDPOINTS`) |
| `src/lib/types/index.ts` | Barrel export for all types |
| `src/lib/actions/index.ts` | Barrel export for all server actions |
| `src/lib/api/apiClient.ts` | HTTP client with auth + refresh logic |
| `src/lib/redux/` | Redux store and slices |
| `src/app/(main)/layout.tsx` | Root protected layout (auth guard) |
| `src/middleware.ts` | Next.js middleware (route protection) |

## Styling

- **Utility-first Tailwind** — avoid custom CSS unless Tailwind cannot achieve the design.
- Custom design tokens via `@theme` block in `globals.css`.
- Use `dark:` prefix for dark mode support.
- SCSS modules (`.module.scss`) only for component-scoped styles that Tailwind cannot handle.

## What NOT to Do

- **Never** hardcode route strings or API URLs — use `PATH` and `ENDPOINTS`.
- **Never** fetch data in a client component with `useEffect` + `fetch` when a Server Component could do it.
- **Never** add `'use client'` to a page or layout unless it strictly requires client-side hooks.
- **Never** use `any` — use `unknown`, generics, or define a proper type.
- **Never** export types directly from files — always re-export through `src/lib/types/index.ts`.
- **Never** export server actions directly from action files without adding them to `src/lib/actions/index.ts`.
- **Never** skip the `.module.scss` file when creating a new component folder — the convention requires it.
- **Never** bypass Husky pre-commit hooks with `--no-verify`.
- **Never** use inline string concatenation for class names — use `cn()`.
