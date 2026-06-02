# Frontend Coding Conventions & Best Practices

This document outlines the coding standards and best practices for the **Graduation Project Frontend** (Next.js 16 + TypeScript 5 + Tailwind 4). Adhering to these rules ensures maintainability, scalability, and code quality.

---

## 1. Core Principles

- **Type Safety**: Use TypeScript strictly. Avoid `any` at all costs. Proactively define interfaces and types for every piece of data.
- **Composition over Inheritance**: Build reusable, modular components using React composition patterns.
- **Performance**: Favor React Server Components (RSC) by default. Use Client Components ONLY when client-side interactivity (hooks, event listeners) is required.
- **Consistency**: Follow established naming and folder structures.

---

## 2. Naming Conventions

### Files & Folders

- **Directories**: `kebab-case` (e.g., `src/components/shared`, `app/(main)/teacher`).
- **Component Files**: `kebab-case.tsx` (e.g., `user-avatar.tsx`, `exam-card.tsx`).
- **Hooks**: `camelCase.ts` (e.g., `useAuth.ts`, `useQueryParams.ts`).
- **Utilities/Libs**: `camelCase.ts` (e.g., `formatDate.ts`, `apiClient.ts`).
- **Assets**: `kebab-case.png`, `kebab-case.svg`.

### Code

- **Components (Code Symbol)**: `PascalCase` (e.g., `const ExamForm = () => { ... }`).
- **Interfaces/Types**: `PascalCase` (e.g., `interface UserProfile { ... }`).
- **Variables & Functions**: `camelCase` (e.g., `const studentList = []`, `const handleFormSubmit = () => {}`).
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `const API_BASE_URL = '...'`).

---

## 3. TypeScript Guidelines

- **Zero `any` Tolerance**: Use `unknown` if a type is truly uncertain, or leverage generics (`<T>`).
- **Explicit Return Types**: While TypeScript can often infer, explicit return types on functions (especially exported ones) improve readability and catch bugs early.
- **Interfaces vs. Types**: Favor `interface` for object structures (especially those that might be extended) and `type` for unions, intersections, and primitives.
- **Zod Integration**: Use `zod` for runtime validation (especially for forms and API responses) to derive TypeScript types automatically.

---

## 4. Component Structure

### Next.js App Router Hierarchy

- **Route Groups**: Use `(group-name)` to organize routes without affecting the URL (e.g., `(auth)`, `(main)`).
- **Components Placement**:
  - `src/components/ui`: Primitive UI elements (usually Shadcn/UI components).
  - `src/components/shared`: Reusable business logic components used across multiple pages.
  - `app/.../components`: Locally scoped components relevant only to a specific route or group.

### Component Code Style

```tsx
// 1. Directive (if needed)
'use client'

// 2. Imports (grouped)
import * as React from 'react'
import Link from 'next/link'
import { LucideIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// 3. Types/Interfaces
interface ComponentProps {
  title: string
  onAction?: () => void
}

// 4. Component Definition
export const SimpleCard = ({ title, onAction }: ComponentProps) => {
  // Hooks (Standard order: Redux, Context, Custom Hooks, State)
  const [isActive, setIsActive] = React.useState(false)

  // Handlers
  const handleClick = () => {
    setIsActive(!isActive)
    onAction?.()
  }

  // Render logic
  return (
    <div className={cn("p-4 rounded-lg", isActive && "bg-primary")}>
      <h3 className="text-lg font-bold">{title}</h3>
      <Button onClick={handleClick}>Toggle</Button>
    </div>
  )
}
```

### Component Folder Structure (Required)

- Each component must be placed in its own folder using `kebab-case`.
- Every component folder must contain:
  - `<component-name>.tsx`
  - `<component-name>.module.scss`
- Example:

```text
components/
  exam-card/
    exam-card.tsx
    exam-card.module.scss
```

---

## 5. Styling Standards (Tailwind CSS 4)

- **Utility-First**: Avoid writing custom CSS/SCSS unless the design cannot be achieved with Tailwind.
- **Variable Handling**: Use the `@theme` block in `globals.css` for custom colors and design tokens.
- **Clsx/Tailwind-Merge**: Use the `cn()` utility for conditional classes to prevent styling conflicts.
- **Dark Mode**: Prefix classes with `dark:` for dark theme support. Ensure all components are tested in both modes.

---

## 6. Form Handling & Validation

- **Library**: Use `react-hook-form` for all forms.
- **Validation**: Every form must have a corresponding `zod` schema.
- **Schema Sharing**: If a form schema is reused between FE and BE, keep it in a shared `lib` folder or as a derived type.

```ts
const formSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
})

type FormValues = z.infer<typeof formSchema>
```

---

## 7. State Management

- **Server State**: Leverage Next.js fetch cache, `unstable_cache`, and Server Actions. Avoid fetching data in client components if possible.
- **Global Client State**: Use **Redux Toolkit** (RTK) for application-wide state (e.g., current exam session, user preferences).
- **Local State**: Use `useState` and `useReducer` for internal component logic.

---

## 8. Development Workflow

- **Pre-commit Hooks**: Husky is configured to run `lint-staged`. Do not bypass linting/formatting errors.
- **Imports**: Use absolute paths using the `@/` alias (configured in `tsconfig.json`).
- **Environment Variables**: Prefix client-side variables with `NEXT_PUBLIC_`. Define them in `.env.example` first.

---

## 9. SCSS / Styling Guidelines

While Tailwind is preferred, if you use SCSS:

- **Modular Styles**: Use `.module.scss` for component-scoped styles to prevent global conflicts.
- **Variable Reuse**: Access Tailwind theme variables using `var(--color-primary)` etc.
- **Nesting**: Keep nesting shallow (max 3 levels) for better readability and performance.
- **Mixins**: Use mixins for recurring patterns like flex-center or transitions.

---

---

## 10. Commit Message Convention

**Format**: `GRAD-XXX: Commit message` (first letter of message uppercase)

```
GRAD-XXX: Short description of what was done
```

**Examples:**
- `GRAD-45: Add SQL syntax highlighting to result pages`
- `GRAD-68: Fix HTML rendering in exam statistics table`
- `GRAD-102: Implement student result detail page`

**Rules:**
- Always prefix with the JIRA ticket ID: `GRAD-XXX`
- Separate ticket ID from message with `: ` (colon + space)
- First letter of the message must be **uppercase**
- Use imperative mood: "Add", "Fix", "Implement", "Update", "Remove"
- Keep the message concise (under 72 characters)

**❌ Wrong**: `grad-45 add sql highlighting`, `GRAD-45 - add sql highlighting`, `GRAD-45: add sql highlighting` (lowercase first letter)  
**✅ Correct**: `GRAD-45: Add SQL syntax highlighting to result pages`

---

_Created on: April 3, 2026_
