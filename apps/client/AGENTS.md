@../AGENTS.md

# Client — Specific Context

Stack: Next.js 16 (App Router) + React 19 + Tailwind v4 + shadcn/ui + phosphor-icons + TanStack Query v5 + TanStack Form + Orval + GSAP + SplitText

## Breaking Changes
Next.js 16 has breaking API/file structure changes vs prior versions. Always check `node_modules/next/dist/docs/` before writing code.

## Conventions
- Components: PascalCase in own folders (`UserProfile/index.tsx`)
- Features: `src/features/<name>/` self-contained structure
- DAL: Orval-generated code in `src/dal/orval/` (fetch, tanstackQuery, zod)
- Route Guards: `src/app/(private)/routes/` — auth + onboarding middleware
- UI Components: `src/components/ui/` — custom shadcn
