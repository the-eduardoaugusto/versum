---
title: "API Response Standardization"
section: Docs
tags: [versum, docs]
up: "[[Docs/_Index|Docs]]"
prev: "[[API Development]]"
next: "[[Git Flow]]"
---

🏠 [[_Index|Home]] › 📚 [[Docs/_Index|Docs]] › **API Response Standardization**

---

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
| `src/modules/reading/journey/controllers/journey.v1.controller.ts` | Atualizado |
| `src/modules/consent-logs/controllers/consent-log.v1.controller.ts` | Atualizado |

## Success Codes por Endpoint

| Endpoint | Code |
|---|---|
| POST /auth/magic-link | `MAGIC_LINK_SENT` |
| GET /auth/magic-link | `AUTHENTICATED` |
| POST /auth/logout | `LOGGED_OUT` |
| GET /users/@me | `USER_RETRIEVED` |
| PATCH /users/@me | `USER_UPDATED` |
| DELETE /users/@me | — (204 sem body) |
| GET /users/@me/export | `USER_DATA_EXPORTED` |
| POST /profiles/@me | `PROFILE_CREATED` |
| GET /profiles/@me | `PROFILE_RETRIEVED` |
| PATCH /profiles/@me | `PROFILE_UPDATED` |
| GET /profiles/{username} | `PROFILE_RETRIEVED` |
| POST /profiles/@me/avatar | `PROFILE_PICTURE_UPDATED` |
| DELETE /profiles/@me/avatar | `PROFILE_PICTURE_DELETED` |
| GET /public/bible/books | `BOOKS_RETRIEVED` |
| GET /public/bible/books/{dynamicId} | `BOOK_RETRIEVED` |
| GET /public/bible/books/{dynamicId}/chapters | `CHAPTERS_RETRIEVED` |
| GET /public/bible/books/{dynamicId}/chapters/{n} | `CHAPTER_RETRIEVED` |
| GET /public/bible/books/{dynamicId}/chapters/{n}/verses | `VERSES_RETRIEVED` |
| GET /public/bible/books/{dynamicId}/chapters/{n}/verses/{v} | `VERSE_RETRIEVED` |
| GET /readings/feed | `FEED_RETRIEVED` |
| POST /readings/next | `MARKED_AS_READ` |
| GET /readings/status | `STATUS_RETRIEVED` |
| POST /consent | `CONSENT_RECORDED` |
| GET /consent | `CONSENT_HISTORY_RETRIEVED` |

## Error Codes

| Classe | Code |
|---|---|
| `BadRequestError` | nome da classe (`BadRequestError`) |
| `NotFoundError` | `NotFoundError` |
| `UnauthorizedError` | `UnauthorizedError` |
| `ConflictError` | `ConflictError` |
| `RateLimitError` | `RateLimitError` |
| `InternalServerError` | `InternalServerError` |
| Zod validation | `VALIDATION_ERROR` |
| Payload too large | `PAYLOAD_TOO_LARGE` |
| Unhandled | `INTERNAL_SERVER_ERROR` |


---

◀ [[API Development]] · 📚 [[Docs/_Index|Docs]] · [[Git Flow]] ▶
