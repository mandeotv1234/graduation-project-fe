# Graduation Project Frontend

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Frontend Architecture](#frontend-architecture)
4. [Project Structure](#project-structure)
5. [Application Flow](#application-flow)
6. [Getting Started](#getting-started)
7. [UI & State Management Details](#ui--state-management-details)
8. [Authentication Flow](#authentication-flow)
9. [Testing Strategy](#testing-strategy)
10. [Best Practices](#best-practices)
11. [Workflow: Adding New Features](#workflow-adding-new-features)
12. [Team Convention & Workflow](#team-convention--workflow)
13. [References](#references)
14. [Contributors](#contributors)
15. [License](#license)

---

## 🎯 Project Overview

This is the frontend of the **Graduation Project**, built with **Next.js 16**, **React 18** and **TypeScript 5**.

The frontend is designed to:

- Provide a modern, responsive UI for the Graduation Project backend APIs.
- Follow a **feature-based architecture**, aligned with the backend Clean Architecture mindset.
- Separate **UI components**, **feature logic (hooks)** and **infrastructure concerns** (API client, providers, configuration).
- Be easy to extend with new pages/features while keeping a consistent UX and coding style.

---

## 🛠 Technology Stack

| Technology            | Version | Purpose                            |
| --------------------- | ------- | ---------------------------------- |
| Next.js               | 16.0.1  | React framework (routing, SSR/SSG) |
| React                 | 18.2.0  | UI library                         |
| TypeScript            | ^5      | Static typing                      |
| Ant Design            | ^5.28.0 | UI component library               |
| styled-components     | ^6.1.19 | CSS-in-JS styling                  |
| @tanstack/react-query | ^5.90.9 | Server state management & caching  |
| axios                 | ^1.13.2 | HTTP client                        |
| Node.js               | >= 18   | Runtime                            |
| npm                   | >= 10   | Package manager                    |

---

## 🏗 Frontend Architecture

### 🔷 High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    APP / ROUTING LAYER                      │
│  - Next.js App Router (src/app)                             │
│  - RootLayout, pages (/ , /login, ...)                      │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                     FEATURE LAYER                           │
│  - Feature modules (src/features/*)                         │
│  - Page UI components (LoginPage, HomePage, ...)            │
│  - Feature hooks (useLogin, ...)                            │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│           SHARED SERVICES & INFRASTRUCTURE LAYER            │
│  - HTTP client (axiosClient)                               │
│  - API paths (API_PATH)                                    │
│  - React Query configuration (QueryClientProviders)        │
│  - UI providers (AntdRegistry, StyledComponentsRegistry)   │
└────────────────────────┬────────────────────────────────────┘
                         ↓
                    [Backend API]
                 Graduation Project BE
```

### 📐 Dependency Rule

```
Pages (src/app)
    → Feature layer (src/features)
        → Shared services (src/services, src/constants, src.libs)
            → Backend API

❌ Feature components SHOULD NOT call axios or process.env directly.
✅ Feature components SHOULD use services (src/features/.../services)
   + hooks (src/features/.../hooks).
```

---

## 📂 Project Structure

```
src/
│
├── app/                         # Next.js App Router (pages & layout)
│   ├── layout.tsx               # Root layout, global providers
│   ├── page.tsx                 # Home page (demo AntD button)
│   ├── login/
│   │   └── page.tsx             # Login route entry, uses LoginPage feature
│   ├── globals.css              # Global styles
│   └── page.module.css          # Home page styles
│
├── features/                    # Feature-based modules
│   ├── login/
│   │   ├── LoginPage.tsx        # Login page UI (uses AntD Form)
│   │   ├── hooks/
│   │   │   ├── useLogin.ts      # UI logic & navigation
│   │   │   └── loginAPI.ts      # React Query mutation wrapper
│   │   ├── services/
│   │   │   └── loginQueries.ts  # Axios API calls for login
│   │   ├── interfaces/
│   │   │   └── index.ts         # Types for login request/response
│   │   └── styles/
│   │       └── LoginPage.style.ts # styled-components for login UI
│   └── home/                    # Reserved for home feature
│
├── constants/
│   ├── apis.constant.ts         # API_PATH & keys for endpoints
│   └── routes.constant.ts       # PATH_NAMES, PUBLIC_PATHS
│
├── services/
│   └── api/
│       └── apiClient.ts         # axiosClient + interceptors (token/refresh)
│
├── libs/
│   ├── AntdRegistry.tsx             # SSR setup for AntD styles
│   ├── StyledComponentsRegistry.tsx # SSR for styled-components
│   └── QueryClientProviders.tsx     # React Query client/provider
│
├── interfaces/
│   └── query.ts                 # Shared React Query types
│
├── helpers/                     # Helpers (future use)
├── hooks/                       # Global hooks (future use)
└── types/                       # Shared TS types (future use)
```

---

## 🔄 Application Flow

### 1️⃣ Application Startup Flow

```
┌─────────────────────────────────────────────────────────────┐
│  1. Next.js Application Starts                              │
│     - npm run dev (development)                             │
│     - npm run build && npm run start (production)           │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  2. Load Environment Variables                              │
│     - NEXT_PUBLIC_API_END_POINT (backend base URL)          │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  3. Initialize Root Layout                                  │
│     - src/app/layout.tsx                                    │
│     - Wrap children with:                                   │
│       • QueryClientProviders (React Query)                  │
│       • StyledComponentsRegistry                            │
│       • AntdRegistry + AntD <App> context                   │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  4. Render Page Component                                   │
│     - / → src/app/page.tsx                                  │
│     - /login → src/app/login/page.tsx                       │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  5. Feature Logic & API Calls                               │
│     - Page imports FeaturePage & hooks from src/features    │
│     - Hooks call React Query mutations/queries              │
│     - React Query uses axiosClient to talk to backend       │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites

```bash
- Node.js >= 18
- npm >= 10
- Backend Graduation Project API running (Spring Boot)
```

### Step 1: Clone repository

```bash
git clone https://github.com/mandeotv1234/graduation-project-fe.git
cd graduation-project-fe
```

### Step 2: Install dependencies

```bash
npm install
```

### Step 3: Configure Environment

Create `.env` file in project root (same level as `package.json`):

```env
NEXT_PUBLIC_API_END_POINT=http://localhost:8080/api
```

Adjust the URL to match your backend host/port and base path.

### Step 4: Run in development mode

```bash
npm run dev
```

or

```bash
yarn dev
```

- Default URL: http://localhost:3000
- Home page: simple AntD button + notification demo.
- Login page: http://localhost:3000/login

### Step 5: Build & run in production mode

```bash
npm run build
npm run start
```

or

```bash
yarn build
yarn start
```

---

## 🎨 UI & State Management Details

### Ant Design & Layout

- Global AntD `<App>` provider is set up in `src/app/layout.tsx`.
- Components can use `App.useApp()` (e.g., in `src/app/page.tsx`) to access notifications and other global APIs.
- Forms, inputs, buttons, typography are provided by Ant Design.

### styled-components

- `StyledComponentsRegistry` handles SSR setup for styled-components.
- Feature-specific styles live in `src/features/<feature>/styles/`.
  - Example: `LoginPage.style.ts` defines `LoginContainer`, `StyledCard`, `FormItem`, `SubmitButton`.

### React Query

- `QueryClientProviders` initializes a `QueryClient` with sensible defaults:
  - `staleTime`: 60s, `gcTime`: 5 minutes.
- All hooks that call backend APIs should use React Query (`useQuery`, `useMutation`) for caching and error handling.
- Example: `useMutationLogin` in `src/features/login/hooks/loginAPI.ts`.

---

## 🔐 Authentication Flow

### 1️⃣ Login Flow (Frontend)

```
 [User]
    │
    │ Open /login
    ↓
┌─────────────────────────────────────────────────────────────┐
│  Next.js Route                                              │
│  📍 src/app/login/page.tsx                                  │
│                                                             │
│  1. Render <LoginPage /> from src/features/login/LoginPage  │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  LoginPage Component                                        │
│  📍 src/features/login/LoginPage.tsx                        │
│                                                             │
│  2. Initialize AntD Form and UI                             │
│  3. Use hook: const { form, onFinish, isLoading } = useLogin()│
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  useLogin Hook                                              │
│  📍 src/features/login/hooks/useLogin.ts                    │
│                                                             │
│  4. Create AntD form instance                               │
│  5. Initialize router (useRouter)                           │
│  6. Call useMutationLogin(...) to get mutation:             │
│       - mutationFn: loginUser                               │
│       - onSuccess: show success notification                │
│       - onError: show error notification                    │
│  7. onFinish(values):                                       │
│       - await login(values)                                 │
│       - Save accessToken & refreshToken to localStorage     │
│       - Set refreshToken cookie                             │
│       - router.push('/')                                    │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  useMutationLogin Hook                                      │
│  📍 src/features/login/hooks/loginAPI.ts                    │
│                                                             │
│  8. useMutation({                                           │
│       mutationKey: [API_PATH.AUTHENTICATE.LOGIN.API_KEY],   │
│       mutationFn: loginUser,                                │
│       onSuccess, onError                                    │
│     })                                                      │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  loginUser Service                                          │
│  📍 src/features/login/services/loginQueries.ts             │
│                                                             │
│  9. axiosClient.post(API_PATH.AUTHENTICATE.LOGIN.API_PATH, │
│                      params)                                │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  axiosClient                                                │
│  📍 src/services/api/apiClient.ts                           │
│                                                             │
│  10. Attach Authorization header if accessToken exists      │
│  11. Send request to backend                                │
│  12. Return AxiosResponse to React Query                    │
└─────────────────────────────────────────────────────────────┘
```

### 2️⃣ Authenticated Request Flow (with Interceptors)

```
 [Any feature hook/service]
    │
    │ Call axiosClient.<method>(...)
    ↓
┌─────────────────────────────────────────────────────────────┐
│  Request Interceptor                                        │
│  📍 src/services/api/apiClient.ts                           │
│                                                             │
│  1. Read accessToken from localStorage                      │
│  2. If token exists → set Authorization: Bearer <token>     │
│  3. Forward request                                         │
└────────────────────────┬────────────────────────────────────┘
                         ↓
                   [Backend API]
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  Response Interceptor                                       │
│                                                             │
│  4. If 401 Unauthorized:                                   │
│       - Try refresh token: POST API_PATH.AUTHENTICATE.     │
│         REFRESH_TOKEN.API_PATH                              │
│       - If refresh success → retry original request         │
│       - If refresh fails:                                  │
│           • Show notification "Session Expired"            │
│           • Redirect window.location.href = '/login'        │
│  5. For other errors:                                      │
│       - Throw Error with message from response data         │
└─────────────────────────────────────────────────────────────┘
```

### 3️⃣ Error Handling Flow (Frontend)

- Axios wraps backend error messages into `Error` objects.
- React Query `onError` callbacks receive the error and show AntD notifications.
- Example: `useLogin` shows "Login Failed" with detail from `(error as Error).message`.

---

## 🧪 Testing Strategy

(Planned / Recommended)

```
Unit Tests:
  - Feature hooks (e.g., useLogin) – using React Testing Library + Jest.
  - Services (e.g., loginQueries) – mocking axiosClient.

Integration Tests:
  - Page components (LoginPage) – form validation & submission flow.

E2E Tests:
  - Login flow from UI to backend (e.g., using Playwright/Cypress).
```

Currently, the project does not include test files yet; this section serves as a guideline for adding tests later.

---

## 📝 Best Practices

### 1. Dependency Direction

```
❌ DON'T: Page/component directly use axios or hard-coded URLs.
✅ DO: Page → feature hook → service (axiosClient) → backend.
```

### 2. Use Feature Modules

- Group UI, hooks, services, interfaces, styles by feature under `src/features/<feature>`.
- Keep `src/app` pages thin: they should mainly import and render `<FeaturePage />`.

### 3. Error & Notification Handling

- Centralize error messages via React Query `onError` and AntD notifications.
- Avoid `alert()` and ad-hoc error handling inside components.

### 4. Types & Interfaces

- Always define request/response types in `interfaces` folders.
- Reuse shared query options types from `src/interfaces/query.ts` when possible.

---

## 🔄 Workflow: Adding New Features

### Example: Add "User Profile" Page

**Step 1: Define route**

```text
src/app/profile/page.tsx
```

```tsx
// page.tsx
// export default function Profile() { return <ProfilePage />; }
```

**Step 2: Create feature module**

```text
src/features/profile/
  ProfilePage.tsx
  hooks/
  services/
  interfaces/
  styles/
```

- `ProfilePage.tsx`: render layout & UI, use `useProfile()` hook.

**Step 3: Define API & constants**

- Add endpoints to `src/constants/apis.constant.ts` under `USER` (e.g., PROFILE).
- Implement `profileQueries.ts` in `src/features/profile/services/` using `axiosClient`.

**Step 4: Create React Query hooks**

- In `src/features/profile/hooks`:
  - `useProfileQuery` with `useQuery` and `API_PATH.USER.PROFILE.API_KEY`.

**Step 5: Create UI hook**

- `useProfile` to:
  - Call `useProfileQuery`.
  - Map data to UI props.
  - Handle loading/error states and notifications.

**Step 6: Build UI**

- Use AntD components and styled-components (e.g., `ProfilePage.style.ts`).

---

## 📖 References

- [Next.js Documentation](https://nextjs.org/docs)
- [React Query Documentation](https://tanstack.com/query/latest)
- [Ant Design Documentation](https://ant.design/docs/react/introduce)

---

## 👥 Contributors

- **Author:** Ling Vo
- **Project:** Graduation Project Frontend

---

**Last Updated:** November 15, 2025
