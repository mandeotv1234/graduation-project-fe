# AGENTS.md - graduation-project-fe

## Project Snapshot

- Frontend for a SQL exam/grading platform.
- Next.js 16 App Router, React 19, TypeScript 5 strict mode, Tailwind CSS 4, Redux Toolkit, Shadcn/UI, Lucide React, Sonner, react-hook-form, zod, STOMP/SockJS.
- Read `CLAUDE.md` and `convention.md` for fuller rules; this file is the concise Codex entrypoint.

## Commands

- Start dev server: `npm run dev`
- Production build: `npm run build`
- Lint: `npm run lint`
- Format: `npm run format`
- E2E tests: `npm run test:e2e`
- Targeted E2E scripts exist for auth, exam list, pre-exam, interface, draft, anti-cheat, submit, timer, navigation, results, session, and security.

## Source Layout

- `src/app`: Next App Router pages/layouts/loading files and route-local components.
- `src/app/(auth)`: login/register public pages.
- `src/app/(main)`: protected student/teacher/admin pages.
- `src/app/api`: Next route handlers/proxies when needed.
- `src/components/ui`: Shadcn/UI primitives.
- `src/components/shared`: reusable business components.
- `src/hooks`: global hooks.
- `src/lib/actions`: server actions. Re-export new actions from `src/lib/actions/index.ts`.
- `src/lib/api/index.ts`: `ApiClient` and `apiClient`; handles auth, refresh, errors, tracing.
- `src/lib/api/exam-client.ts` and `pdf-client.ts`: multipart/PDF or specialized clients.
- `src/lib/constants/path.ts`: all route constants.
- `src/lib/constants/endpoint.ts`: all backend endpoint constants.
- `src/lib/redux`: store, provider, typed hooks, slices.
- `src/lib/socket`: WebSocket client code.
- `src/lib/types`: TypeScript types. Re-export new types from `src/lib/types/index.ts`.
- `src/lib/utils`: pure helpers, including `cn()`.
- `src/proxy.ts`: Next 16 proxy for auth redirects, token refresh, CSP nonce, and route protection. Do not rename it to `middleware.ts`.

## Next.js and Data Rules

- Pages and layouts are Server Components by default. Add `'use client'` only for hooks, browser APIs, event handlers, Redux, or interactive state.
- Fetch server data in Server Components through server actions from `src/lib/actions`.
- All backend API calls should go through server actions and `apiClient` unless the feature specifically needs multipart upload or a route handler.
- Use `ENDPOINTS` for backend URLs and `PATH` for frontend routes. Do not hardcode route or endpoint strings inline when a constant belongs in those files.
- `apiClient` methods return `ApiResponse<T>`. Cast/generic the expected data type explicitly.
- Use `cache: 'no-store'` for dynamic/auth-sensitive reads such as exam monitor, teacher detail, active sessions, or live grading status.
- Server action files start with `'use server'`.
- Client components should call server actions with `useTransition` when triggering mutations or long-running requests.
- Show user feedback with Sonner toasts for success/error flows.

## TypeScript Rules

- `strict` mode is enabled. Do not use `any`; use a proper type, generics, or `unknown`.
- Prefer `interface` for object shapes and `type` for unions/intersections/primitives.
- Keep exported domain/API types in `src/lib/types/*` and re-export them from `src/lib/types/index.ts`.
- Use the `@/` alias for internal imports.
- Keep function/component names descriptive and use existing naming style.

## Component Rules

- Directories and files use `kebab-case`.
- Component symbols use `PascalCase`; hooks use `camelCase` and start with `use`.
- Each non-trivial component lives in its own folder:
  - `<component-name>.tsx`
  - `<component-name>.module.scss`
- Tailwind is preferred. Use SCSS modules only for component-scoped styling that Tailwind cannot express cleanly.
- Use `cn()` from `src/lib/utils` for conditional classes. Do not manually concatenate class strings.
- Use Shadcn/UI primitives from `src/components/ui` and Lucide icons for buttons/actions when available.
- Forms use `react-hook-form` plus `zod`; derive values with `z.infer<typeof schema>`.
- For local route-only UI, place components under that route's `components` folder. Use `src/components/shared` only for reusable cross-route business components.

## Auth, Security, and Runtime Context

- Auth cookies: `accessToken`, `refreshToken`, `userRole`.
- `src/proxy.ts` protects `PRIVATE_PATH`, redirects logged-in users away from public auth pages, refreshes tokens for page navigations, and sets CSP nonce headers.
- Root layout reads `x-nonce` and sets `window.__webpack_nonce__` before other scripts. Preserve this ordering.
- `NEXT_PUBLIC_API_URL` defaults to `http://localhost:8080/api`.
- Add new client-visible env vars to `.env.example` and prefix with `NEXT_PUBLIC_`.
- Do not bypass Husky or lint-staged hooks with `--no-verify`.

## UI and Product Guidance

- This is an operational exam/grading application, not a marketing site. Prefer dense, scannable, workflow-first UI.
- Keep layouts predictable for repeated teacher/student/admin actions.
- Avoid oversized hero sections, decorative card-heavy pages, and purely illustrative UI.
- Use compact headings inside panels and dashboards.
- Ensure text does not overflow buttons, cards, table cells, or narrow mobile layouts.
- Use clear loading/empty/error states for async actions.

## Backend Contract Context

- Backend wraps responses as `ApiResponse<T>` and pagination as `PaginatedApiResponse<T>`.
- Backend endpoint constants belong in `ENDPOINTS`; route constants belong in `PATH`.
- SQL exam features are sensitive to schema, rubric JSON, result grading, anti-cheat/session state, and PDF extraction. Preserve existing response shapes unless changing BE and FE together.
- FE roles are `STUDENT`, `TEACHER`, `ADMIN`; default redirects are student exams, teacher classes, and admin feedbacks.

## Editing Guidance

- Keep changes scoped to the feature and nearby patterns.
- Search existing pages/actions/types before adding new names.
- When adding a feature, usually update: endpoint constant, type, server action, page/component, and any route path constant.
- Do not refactor unrelated code while fixing a focused issue.
- The worktree may contain user changes. Do not revert files unless explicitly asked.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, invoke the `skill` tool with `skill: "graphify"` before doing anything else.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
