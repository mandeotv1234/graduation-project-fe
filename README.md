## Getting Started

1. **Install dependencies**

```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

2. **Run the development server**

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the result.

You can start editing the main page by modifying `src/app/(main)/page.tsx`. The page auto-updates as you edit the file.

## Next.js Project Structure & Coding Guidelines

### 1. App Router & Routing

- **App directory** – all pages/layouts use the **App Router** (Next 13+):
  - `src/app/layout.tsx`: root layout that imports `globals.css`, fonts, and shared providers.
  - Route groups (folders wrapped in parentheses) help organize code:
    - `src/app/(main)/...`: main application routes after the user has logged in.
    - `src/app/(auth)/...`: authentication-related routes (`/login`, `/register`, ...).
- **Route groups**: the folder name in parentheses is only for organization and does **not** appear in the URL:
  - `src/app/(auth)/login/page.tsx` → URL `/login`.
  - `src/app/(main)/page.tsx` → URL `/`.
- **Adding a new page**:
  - Create `src/app/(main)/<slug>/page.tsx` or `src/app/(auth)/<slug>/page.tsx`.
  - Optionally add a sibling `layout.tsx` if that route group/page needs its own layout.

### 2. Auth pages: Login / Register (shared pattern)

- **Auth folder structure**
  - `src/app/(auth)/login`
    - `page.tsx`: `/login` page (thin server component).
    - `components/login-form.tsx`: login form UI (`'use client'`).
    - `hooks/use-login.ts`: custom hook that holds all login form logic.
  - `src/app/(auth)/register`
    - `page.tsx`: `/register` page.
    - `components/register-form.tsx`: register form UI (`'use client'`).
    - `hooks/use-register.ts`: custom hook that holds all register form logic.
- **Form pattern (recommended for other features as well)**
  - **`hooks/use-xxx.ts`**:
    - Initialize `useForm` with `zodResolver(schema)` from `src/lib/types`.
    - Own local UI state such as `errorMessage`, `isSubmitting`.
    - Call the corresponding **server actions** in `src/lib/actions` (e.g. `loginAction`, `registerAction`).
    - Return a stable API: `{ register, handleSubmit, errors, errorMessage, isSubmitting, onSubmit }`.
  - **`components/xxx-form.tsx`**:
    - Import the hook and focus only on JSX + layout + shadcn UI components.
    - Never call APIs directly; just wire `handleSubmit(onSubmit)` from the hook.
  - **`page.tsx`**:
    - Only imports and renders the form component.
    - Should stay free of business logic or data fetching.

### 3. `src/lib` – shared logic & domain layer

- **`src/lib/api`**
  - Contains API client(s) (currently an `apiClient` based on `fetch`):
    - Applies `baseURL` from `NEXT_PUBLIC_API_URL`.
    - Automatically attaches an `Authorization` header if an `accessToken` cookie exists.
    - Supports building query strings via `qs`.
  - When adding a new backend API, create a small wrapper here (or in a sub-file), e.g.:
    - `apiClient.get<T>(ENDPOINTS.PROJECTS, { queries })`
    - `apiClient.post<T>(ENDPOINTS.UPDATE_PROGRESS, body)`

- **`src/lib/constants`**
  - `PATH`: defines frontend routes used for navigation (e.g. `HOME`, `LOGIN`, `REGISTER`, `PROJECT_DETAIL`, ...).
  - `ENDPOINTS`: defines backend API routes (e.g. `LOGIN`, `REGISTER`, `PROJECTS`, `PROJECT_DETAIL`, ...).
  - When adding a new feature:
    - Add a constant under `ENDPOINTS` for the backend API.
    - Add a constant under `PATH` if there is a corresponding frontend route.

- **`src/lib/types`**
  - `common.type.ts`: shared types, for example:
    - `ApiResponse<T>` – normalized backend response (`data`, `code`, `message`).
  - Domain-specific files (e.g. `auth.type.ts`, `project.type.ts`):
    - Zod schemas for forms and data.
    - Types inferred from those schemas (`FormValues`, entities, responses, ...).
  - `index.ts`: re-exports all domain types so they can be imported from `@/lib/types`.

- **`src/lib/actions`**
  - Contains **server actions** for each domain (auth, project, profile, ...).
  - Each action should:
    - Receive **already validated data** (from react-hook-form + Zod).
    - Call `apiClient` / DB / set cookies, etc.
    - Return a simple object (`{ success, message }`) or perform `redirect()` / `revalidatePath()`.
  - Guidelines:
    - Avoid complex `FormData` handling in components – move that into server actions here.
    - Keep actions “thin”: call APIs, map errors, and handle navigation.

- **`src/lib/utils`**
  - `cn`: Tailwind className merge helper.
  - `cookies`: helpers to read/write cookies on the server (`getCookie`, `setCookie`).
  - Add other small shared utilities here (dates, formatting, etc.).

### 4. Redux Toolkit – Global UI State (no thunks)

- **Location & purpose**
  - `src/lib/redux` is used only for **global UI / client state** (no data fetching inside slices).
  - We do **not** use `redux-thunk` or any async middleware. All network calls still go through
    **server actions** in `src/lib/actions` or the shared `apiClient` in `src/lib/api`.
- **Folder structure**
  - `store.ts`: configures `configureStore` and exports `store`, `RootState`, `AppDispatch`.
  - `hooks.ts`: typed hooks `useAppDispatch`, `useAppSelector`.
  - `slices/*.slice.ts`: feature slices, for example:
    - `sample.slice.ts` – demo slice with `{ value, text }` to illustrate the pattern.
  - `index.ts`: re‑exports store, hooks, and slices so consumers can import from `@/lib/redux`.
- **Provider setup**
  - `src/app/layout.tsx`:
    - Wraps the entire app with `<ReduxProvider>{children}</ReduxProvider>`.
    - `ReduxProvider` is a client component defined in `src/lib/redux/redux-provider.tsx` that uses
      React Redux’s `<Provider store={store}>`.
- **Usage in client components**
  - Read state:
    - `const value = useAppSelector((state) => state.sample.value)`.
  - Dispatch actions:
    - `const dispatch = useAppDispatch(); dispatch(increment());`.
  - Do **not** dispatch actions that perform API calls in slices. Instead:
    - Call the appropriate server action (e.g. `loginAction`) or `apiClient` directly in a hook/component.
    - After you receive the result, optionally dispatch a simple action to sync/reflect it in global state.

### 5. Forms, Validation & UI (for any feature)

- **Validation** – always use **Zod + react-hook-form**:
  - Define domain schemas in `src/lib/types/<domain>.type.ts`.
  - In components:
    - `useForm<FormValues>({ resolver: zodResolver(schema) })`.
    - Read field errors via `formState.errors`.
- **Standard submit flow** for forms:
  1. User types into the form; Zod validates on the client through the resolver.
  2. `handleSubmit(onSubmit)` is called when the data is valid.
  3. `onSubmit` calls the corresponding **server action** from `src/lib/actions`.
  4. The server action runs the business logic (call API, set cookies, redirect, ...).
  5. If there is a business error (conflict, permission, etc.), the server action returns `{ success: false, message }` and the component displays that `message`.
- **UI Components (shadcn/ui)** – `src/components/ui`
  - Use shadcn’s component system to keep UI consistent:
    - `Button`, `Input`, `Label`, etc.
  - Guidelines:
    - In forms, always use `Button`, `Input`, `Label` from `components/ui`.
    - Avoid raw `<button>`, `<input>`, `<label>` unless you really need something low-level.

### 4. Data Fetching, Revalidation, Auth & Middleware

- **Data Fetching (server-first)**:
  - Prefer **server components** in the App Router for fetching data:
    - Call `apiClient` directly in a server component (`async function Page() { ... }`) or inside a server action.
    - Advantages: better security (tokens stay on the server), smaller client bundles.
  - When heavy client interaction is needed (forms, realtime, client-side pagination):
    - Use **client components** (`'use client'`) together with:
      - Server actions (submit forms, mutate data).

- **Revalidation strategy (project convention)**:
  - We keep caching rules simple and rely on **explicit invalidation only**:
    - Use `revalidatePath('/some-path')` in server actions after a successful mutation to invalidate a specific route.
    - Use `revalidateTag('tag-name')` together with `fetch(..., { next: { tags: ['tag-name'] } })` to invalidate a group of related requests.
  - We avoid time-based revalidation (`revalidate = 60`, `next.revalidate`, etc.) to keep behavior predictable.
  - For each new feature, decide:
    - Which pages or data slices need to be invalidated after a mutation.
    - Which `path` or `tag` should be revalidated from the corresponding server action.

- **Auth & cookie-based flow (suggested)**:
  - After a successful login, a server action sets:
    - `accessToken` (short-lived).
    - `refreshToken` (longer-lived).
  - Subsequent requests:
    - `apiClient` reads cookies via `getCookie` and attaches `Authorization` headers.
  - To guard routes:
    - Use a middleware/proxy (e.g. `src/proxy.ts`) to read cookies, match against `PRIVATE_PATH` / `PUBLIC_PATH`, and redirect when needed.

### 6. Lint, Format, Husky

- **Key scripts** in `package.json`:
  - `npm run dev`: run Next dev server.
  - `npm run build`: production build.
  - `npm run lint`: run `next lint --fix --dir .`.
  - `npm run format`: run `prettier --write`.
- **Husky + lint-staged** (pre-commit):
  - `.husky/pre-commit`:
    - Runs `npx lint-staged`.
    - Runs `npm run build` to ensure the app builds before committing.
  - Notes:
    - Install husky: `npm install husky --save-dev`.
    - Enable hooks: `npm run prepare`.

## How to Implement a New Page (High-Level Recipe)

1. **Define routes & constants**
   - Add a file under `src/app/(group)/<slug>/page.tsx` (e.g. `src/app/(main)/projects/page.tsx`).

2. **Add types & validation schemas**
   - In `src/lib/types/<domain>.type.ts`:
     - Define Zod schemas for request/response and forms.
     - Export the inferred TypeScript types (form values, entities, responses).

3. **Call backend via `apiClient`**
   - For data fetching (in server components or server actions), use:
     - `apiClient.get<T>(ENDPOINTS.SOMETHING, { queries })`
     - `apiClient.post<T>(ENDPOINTS.SOMETHING, body)`
   - Let `apiClient` handle base URL, auth header, and normalizing errors.

4. **Create server actions for mutations**
   - In `src/lib/actions/<domain>.action.ts`:
     - Export async functions that:
       - Accept validated data (from Zod + react-hook-form).
       - Call `apiClient` to hit backend APIs.
       - Optionally call `revalidatePath('/some-path')` or `revalidateTag('tag-name')`.
       - Return a simple `{ success, code, message, data? }` result or perform `redirect(...)`.

5. **Build the UI (forms & pages)**
   - Use server components for pure data display where possible.
   - For interactive forms:
     - Create client components with `'use client'`.
     - Use `react-hook-form` + `zodResolver` against your Zod schemas.
     - Use shadcn UI components (`Button`, `Input`, `Label`, etc.).
     - On submit, call the corresponding server action and handle its `{ success, message }` result in the UI.

This flow keeps every page consistent: routing is defined in `app/`, types & schemas live in `lib/types`, network logic is centralized in `lib/api`, mutations go through `lib/actions`, and UI uses shared components in `components/ui`.

### End‑to‑End Page Flow (CSS → UI → Server Action → Navigation)

- **Styling & CSS**
  - Global styles live in `src/app/globals.css` (Tailwind utilities + design tokens).
  - Prefer Tailwind utility classes for layout and spacing directly in JSX.
  - For reusable patterns (e.g. auth layout, cards), create layouts/components with consistent className presets instead of ad‑hoc CSS.

- **UI components (shadcn)**
  - All interactive primitives (button, input, label, etc.) should come from `src/components/ui`.
  - New components can be added via:
    - `npx shadcn@latest add <component>` (e.g. `input`, `label`, `dialog`, ...).
  - Use these building blocks to compose feature UIs instead of styling raw HTML from scratch every time.

- **Typical implementation of a new interactive page**
  1. **Route & layout**
     - Define the route in `src/app/(main)/<slug>/page.tsx` (or `(auth)` / another group).
     - If the page needs a specific frame (sidebar, header, 2‑column layout), create or extend a `layout.tsx` in the same group.
  2. **Types & schema**
     - In `src/lib/types/<domain>.type.ts`, define:
       - Zod schema(s) for form data and responses.
       - Inferred TS types (`FormValues`, `Response`, etc.).
  3. **Server action**
     - In `src/lib/actions/<domain>.action.ts`, create a function that:
       - Accepts the validated form values.
       - Calls `apiClient` to hit the backend.
       - Optionally calls `revalidatePath` / `revalidateTag` after a successful mutation.
       - Either returns `{ success, code, message, data? }` or uses `redirect(PATH.SOMEWHERE)` to navigate on the server.
  4. **Client form component**
     - Mark the file with `'use client'`.
     - Use `useForm` + `zodResolver(schema)` for validation.
     - Use shadcn `Input`, `Label`, `Button`, etc. for fields and actions.
     - On submit:
       - Call the server action with the form values.
       - If the action returns a result object: show `message` or update UI state accordingly.
       - If the action calls `redirect`, you do **not** need to call `router.push` on the client.
  5. **Navigation (`redirect` vs `router.push`)**
     - Use `redirect(PATH.X)` **inside server actions or server components** when:
       - Navigation depends on a server‑only condition (e.g. auth, permission).
       - You want a clean, server‑driven redirect after a mutation.
     - Use `useRouter` from `next/navigation` and `router.push(PATH.X)` **in client components** when:
       - Navigation is purely client‑driven (e.g. button click after viewing data, tab switching).
     - Avoid doing both (`redirect` and `router.push`) for the same flow; pick one place (server **or** client) to own the navigation.

This end‑to‑end recipe (route → types/schema → API client → server action → client UI + navigation) is the recommended way to build any new page in this project.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

# Team Convention & Workflow

## 1. Git Branch Naming Convention

Consistent names keep tracking clear.

**Format**

```
feature/GRAD-XX-description
fix/GRAD-XX-bug-description
hotfix/GRAD-XX-critical-issue
```

**Examples**

- `feature/GRAD-12-user-authentication`
- `fix/GRAD-18-login-validation`
- `hotfix/GRAD-25-deployment-error`

**Rules**

- Branch from `develop`, never `main`.
- Use lowercase with hyphens.
- Include the Jira issue ID.

## 2. Commit Message Convention

Keep commits traceable to Jira.

**Format**

```
GRAD-XX: <short imperative description>
```

**Examples**

- `GRAD-12: Implement JWT-based authentication`
- `GRAD-18: Fix null pointer issue in login service`
- `GRAD-25: Resolve Docker build failure`

**Rules**

- One logical change per commit.
- Use imperative mood (“Add”, not “Added”).
- Keep under ~72 characters when possible.

## 3. Pull Request (PR) Rules

Guarantee quality before merging.

**Checklist**

- Rebase branch on latest `develop` (no merge commits).
- PR title includes Jira ID.
- ≥1 reviewer approval.
- All CI/CD checks pass.
- Delete branch and squash commits after merge.

**Example Title**

`GRAD-12: Add user authentication feature`

## 4. Development Workflow

**Main Branches**

- `main`: production-ready code only.
- `develop`: integration branch for new features.

**Flow**

1. Pick Jira task (e.g., GRAD-12).
2. Branch from `develop`: `feature/GRAD-12-description`.
3. Develop locally and commit with Jira ID.
4. Rebase with latest `develop` before PR.
5. Open PR → review → merge into `develop`.
6. Update Jira status: `To Do → In Progress → In Review → Done`.

**Example Flow**

- Task: `GRAD-12`
- Branch: `feature/GRAD-12-user-authentication`
- Commit: `GRAD-12: Implement JWT authentication`
- PR: `GRAD-12: Add authentication endpoints`

This workflow keeps both backend and frontend repos consistent, traceable, and low-conflict.
