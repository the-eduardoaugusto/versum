# AGENTS.md — Versum

## Stack
| Layer | Tech |
|-------|------|
| Frontend | Next.js 16, React 19, Tailwind v4, shadcn/ui |
| Backend | Hono (OpenAPIHono), Drizzle ORM, Zod |
| DB | PostgreSQL |
| Auth | Magic Link + httpOnly cookie (infinite session) |
| Runtime | Bun |
| Lint | Biome |
| Test | Vitest |
| Codegen | Orval (OpenAPI → TanStack Query + Zod) |

## Read Before Coding
`.ai/prd.md` | `.ai/docs/naming-convention.md` | `.ai/docs/api-development.md` | `.ai/docs/git-flow.md` | `.ai/rules/`

## Structure
```
versum/
├── .ai/                 # Docs & rules
├── apps/api/            # REST backend (Hono)
├── apps/client/         # Frontend (Next.js App Router)
├── apps/landing-page/   # Marketing
└── packages/logger/     # @versum/logger
```

## Git — HARD RULE
- Base: `development` — never commit directly
- Naming: `feat/`, `fix/`, `refactor/`, `docs/`, `chore/`
- AI prefix: `feat/ai-`, `fix/ai-`
- Commits: Conventional Commits `type(scope): desc`
- PR always targets `development`

## Pre-Coding Checklist
1. Read AGENTS.md fully
2. Read `.ai/docs/git-flow.md`
3. Read `.ai/prd.md` + relevant `.ai/docs/` + `.ai/rules/`
4. `git branch --show-current` — if `development`, STOP, create sub-branch
5. `git checkout -b <type>/ai-<desc> development`
6. `git stash && git pull origin development --rebase && git stash pop`
7. Check existing code before creating new

## Code Rules
| Concern | Rule |
|---------|------|
| DB columns | `snake_case` |
| Drizzle props | `camelCase` |
| API responses | `camelCase` + `SuccessViewModel.create()` |
| Module files | `<name>.v1.<type>.ts` |
| Cross-module imports | `@/` alias |
| Local imports | relative, no `.ts` |
| Components | PascalCase |
| Tests | colocated (`service.test.ts`) |

## Constraints
- Bun only — never npm/yarn/pnpm
- Never commit `.env`, `.certs`, `node_modules`
- `biome check` + `tsc --noEmit` before every commit
- Next.js 16 has breaking changes — check `node_modules/next/dist/docs/`
