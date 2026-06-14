# Versum Documentation

Centralized documentation for Versum project architecture, conventions, and guidelines.

## Quick Navigation

### Getting Started
- **[prd.md](./prd.md)** — Product Requirements Document
  - Project overview, features, tech stack, success metrics

### Development Guides
- **[docs/api-development.md](./docs/api-development.md)** — Backend API development
  - Module structure, naming conventions, patterns
  
- **[docs/naming-convention.md](./docs/naming-convention.md)** — Naming standards
  - Database (snake_case), API responses (camelCase)
  
- **[docs/git-flow.md](./docs/git-flow.md)** — Git workflow
  - Branch structure, conventional commits, AI agent rules

### Compliance & Security
- **[docs/lgpd-implementation.md](./docs/lgpd-implementation.md)** — LGPD compliance
  - Consent middleware, data deletion, portability
  
- **[docs/incident-response-plan.md](./docs/incident-response-plan.md)** — Security incident response
  - Detection, triage, containment, notification procedures

### Development Rules
- **[rules/01-security.md](./rules/01-security.md)** — Security best practices
- **[rules/02-scalability.md](./rules/02-scalability.md)** — Scalability patterns
- **[rules/03-modularization.md](./rules/03-modularization.md)** — Code organization
- **[rules/04-general-practices.md](./rules/04-general-practices.md)** — General coding standards

## Key Principles

- **Consistency:** Follow naming conventions and code patterns across the codebase
- **Clarity:** Write self-documenting code and document complex logic
- **Security:** Protect user data, validate inputs, use secure patterns
- **Scalability:** Design stateless services, optimize queries, use caching
- **Modularity:** Keep concerns separated, avoid tight coupling, maximize reusability

## Quick Reference

### Tech Stack
- **Frontend:** Next.js 16 + React 19 + Tailwind CSS v4
- **API:** Hono + Drizzle ORM + PostgreSQL
- **Auth:** Magic Link + Infinite Sessions
- **Tools:** Biome (formatting), Vitest (testing), Orval (codegen)

### Module Naming
- Database tables/columns: `snake_case`
- Drizzle schemas: `camelCase` properties
- API responses: `camelCase` properties
- Module files: `<name>.v1.<type>.ts`

### Commit Types
- `feat` — New feature
- `fix` — Bug fix
- `refactor` — Refactoring (no behavior change)
- `docs` — Documentation
- `chore` — Maintenance, dependencies
- `test` — Tests
- `perf` — Performance improvement

## Related Resources

- **Project Rules:** See `CLAUDE.md`, `AGENTS.md` in each app directory
- **App-Specific Context:** Check `apps/client/AGENTS.md` and `apps/landing-page/AGENTS.md`
