# Versum Docs Index

## Files
- `prd.md` — product, features, data model, tech stack
- `docs/api-development.md` — module structure, response patterns, error handling
- `docs/naming-convention.md` — DB snake_case, API camelCase
- `docs/git-flow.md` — branches, commits, AI agent rules
- `docs/lgpd-implementation.md` — consent middleware, deletion, portability
- `docs/incident-response-plan.md` — detection, triage, containment, ANPD notification
- `rules/01-security.md` — security rules
- `rules/02-scalability.md` — scalability rules
- `rules/03-modularization.md` — code organization
- `rules/04-general-practices.md` — general standards
- `rules/05-tooling.md` — package manager (Bun)

## Quick Ref
Stack: Next.js 16 + React 19 + Tailwind v4 | Hono + Drizzle + PostgreSQL | Magic Link auth | Bun | Biome | Vitest | Orval
File naming: `<name>.v1.<type>.ts`
DB: `snake_case` | API/code: `camelCase`
Commits: `feat|fix|refactor|docs|chore|test|perf(scope): desc`
App-specific: `apps/client/AGENTS.md` | `apps/api/AGENTS.md` | `apps/landing-page/AGENTS.md`
