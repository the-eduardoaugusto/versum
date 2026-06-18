# API Response Standardization

## Overview

All API responses now share a unified envelope with `success`, `message`, and `code` always present.

## Success Response

```ts
{
  success: true,
  message: string,   // required — human-readable context
  code: string,      // required — machine-readable identifier
  data?: T,          // optional — structured payload
  pagination?: {     // optional — only on paginated endpoints
    currentPage: number,
    totalPages: number,
    totalItems: number,
    itemsPerPage: number,
    hasNextPage: boolean,
    hasPrevPage: boolean,
  }
}
```

## Error Response

```ts
{
  success: false,
  message: string,  // required — human-readable error description
  code: string,     // required — machine-readable error code
}
```

> Before this change, errors used `error` as the key for the message. Now both success and error use `message`.

## Files Changed

| File | Change |
|---|---|
| `src/view-models/default/success.view-model.ts` | `message` + `code` obrigatórios; assinatura mudou para objeto `{ data?, pagination?, message, code }` |
| `src/view-models/default/error.view-model.ts` | `error` → `message`; `code` obrigatório |
| `src/utils/app/errors/openapi.ts` | Schema OpenAPI atualizado: `error` → `message`, `code` obrigatório |
| `src/utils/app/schemas/success-response.ts` | `message` + `code` obrigatórios no schema OpenAPI |
| `src/modules/auth/controllers/auth.v1.controller.ts` | Atualizado |
| `src/modules/bible/controllers/bible.v1.controller.ts` | Atualizado |
| `src/modules/users/controllers/users.v1.controller.ts` | Atualizado |
| `src/modules/users/controllers/profile.v1.controller.ts` | Atualizado |
| `src/modules/reading/discovery/controllers/discovery.v1.controller.ts` | Atualizado |
| `src/modules/reading/journey/controllers/journey.v1.controller.ts` | Atualizado |
| `src/modules/consent-logs/controllers/consent-log.v1.controller.ts` | Atualizado |
| `src/modules/reading/discovery/schemas/discovery.v1.schema.ts` | `markVersesResponseSchema` data schema ajustado para `z.undefined()` |

## Success Codes por Endpoint

| Endpoint | Code |
|---|---|
| POST /auth/magic-link | `MAGIC_LINK_SENT` |
| GET /auth/magic-link | `AUTHENTICATED` |
| POST /auth/logout | `LOGGED_OUT` |
| GET /users/@me | `USER_RETRIEVED` |
| PATCH /users/@me | `USER_UPDATED` |
| GET /users/@me/export | `USER_DATA_EXPORTED` |
| POST /users/@me/profile | `PROFILE_CREATED` |
| GET /users/@me/profile | `PROFILE_RETRIEVED` |
| PATCH /users/@me/profile | `PROFILE_UPDATED` |
| GET /users/:username/profile | `PROFILE_RETRIEVED` |
| PATCH /users/@me/picture | `PROFILE_PICTURE_UPDATED` |
| GET /bible/books | `BOOKS_RETRIEVED` |
| GET /bible/books/:id | `BOOK_RETRIEVED` |
| GET /bible/books/:id/chapters | `CHAPTERS_RETRIEVED` |
| GET /bible/books/:id/chapters/:n | `CHAPTER_RETRIEVED` |
| GET /bible/books/:id/chapters/:n/verses | `VERSES_RETRIEVED` |
| GET /bible/books/:id/chapters/:n/verses/:v | `VERSE_RETRIEVED` |
| GET /discovery/verses | `VERSES_RETRIEVED` |
| POST /discovery/verses/read | `VERSES_MARKED_AS_READ` |
| GET /discovery/stats | `STATS_RETRIEVED` |
| GET /journey/feed | `FEED_RETRIEVED` |
| POST /journey/read | `MARKED_AS_READ` |
| GET /journey/status | `STATUS_RETRIEVED` |
| POST /consent-logs | `CONSENT_RECORDED` |
| GET /consent-logs | `CONSENT_HISTORY_RETRIEVED` |

## Error Codes

| Classe | Code |
|---|---|
| `BadRequestError` | nome da classe (`BadRequestError`) |
| `NotFoundError` | `NotFoundError` |
| `UnauthorizedError` | `UnauthorizedError` |
| `ForbiddenError` | `ForbiddenError` |
| `ConflictError` | `ConflictError` |
| `InternalServerError` | `InternalServerError` |
| Zod validation | `VALIDATION_ERROR` |
| Payload too large | `PAYLOAD_TOO_LARGE` |
| Unhandled | `INTERNAL_SERVER_ERROR` |
