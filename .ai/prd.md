# Versum PRD

## Product
Modern Bible reading app with vertical feed dynamics. Focus: reading + consistency + reflection, no dopamine mechanics.

## Reading Modes
**Discovery (For You):** Random verses/chapters, no repeats, for daily reading
**Journey (Sequential):** Genesis → Revelation, no skipping, auto-saved progress, shows current book/chapter/overall %

## Interactions
- Like individual verses
- Like complete chapters
- No highlights, annotations, or saved excerpts (intentional: reduce complexity, maintain reading focus)

## Likes
Default: private | Visibility: user-toggled | Metrics: hidden by default, opt-in | Influences personal feed

## Social
- Follow users
- Friends feed: only liked verses/chapters from followed users
- No comments, reposts, or public metrics

## Data Model
| Entity | Fields |
|--------|--------|
| User | id, username, name, photoUrl, createdAt |
| Verse | id, book, chapter, verse, text |
| Chapter | id, book, chapter |
| Like | userId, targetId, type (VERSE\|CHAPTER), createdAt |
| Reading | userId, targetId, mode (discovery\|journey), readAt |

## Stack
| Layer | Tech |
|-------|------|
| Frontend | Next.js 16 (App Router) + React 19 |
| API | Hono (OpenAPIHono) + Drizzle ORM |
| DB | PostgreSQL |
| Auth | Magic Link + infinite session |
| Runtime | Bun |
| Lint/Format | Biome |
| Test | Vitest |
| Codegen | Orval (OpenAPI → TanStack Query + Zod) |
| Email | Resend |
| Cache | Redis (optional) |
| UI | Tailwind v4 + shadcn/ui + phosphor-icons |
| Animations | GSAP + SplitText + Lenis |
| Bible data | `src/assets/json/bible.json` |

## MVP Metrics
DAU | verses/chapters per session | D1/D7 retention | likes per user

## Out of Scope
Comments, highlights, saved excerpts, monetization, ads

## Future
Offline reading | reading stats | multiple Bible versions
