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

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
