# Naming Convention

DB: `snake_case` | API/code: `camelCase`

## Rules
| Layer | Convention | Example |
|-------|------------|---------|
| DB table/column | `snake_case` | `bible_books`, `picture_url`, `created_at` |
| Drizzle property | `camelCase` | `niceName`, `totalChapters` |
| API response (JSON) | `camelCase` | `pictureUrl`, `createdAt`, `hasNextPage` |
| OpenAPI schema | `camelCase` | `pictureUrl`, `totalChapters` |
| View Models | `camelCase` | `currentPage`, `hasNextPage` |

## Checklist
- [ ] DB columns: `snake_case`
- [ ] Drizzle props: `camelCase`
- [ ] View Models: `camelCase`
- [ ] OpenAPI schemas: `camelCase`
- [ ] API responses: `camelCase`
