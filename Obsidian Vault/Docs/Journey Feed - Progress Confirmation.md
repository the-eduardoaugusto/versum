---
title: "Journey Feed - Progress Confirmation"
section: Docs
tags: [versum, docs, journey, concurrency, api, client]
up: "[[Docs/_Index|Docs]]"
prev: "[[Profile Edit System - Implementation Plan]]"
next: "[[01 Security]]"
---

🏠 [[_Index|Home]] › 📚 [[Docs/_Index|Docs]] › **Journey Feed - Progress Confirmation**

---

# Journey Feed — Confirmação de Progresso

> [!info] Metadados
> **Data:** 2026-06-21 · **Branch:** `fix/ai-journey-progress-race` · **PR:** #54 · **Status:** Implementado e verificado ao vivo
> **Áreas:** `apps/api/.../reading/journey` · `apps/client/.../features/feed/journey`
> **Relacionado:** [Journey Feed — Client (UI)](Journey%20Feed%20-%20Client%20Implementation.html) · [[02 Scalability]] · [[API Response Standardization]]

Como o avanço de leitura (`POST /journey/next`) é confirmado de forma **consistente, idempotente e segura sob concorrência multi-dispositivo**. Este doc cobre o problema original (race condition), a decisão de arquitetura, o fluxo final ponta-a-ponta e os bugs encontrados ao colocar de pé.

---

## 🧭 Índice

1. [[#1 · TL;DR]]
2. [[#2 · O problema (race condition)]]
3. [[#3 · A decisão de arquitetura]]
4. [[#4 · Fluxo ponta-a-ponta]]
5. [[#5 · Backend — camada por camada]]
6. [[#6 · Client — quem dispara e o que invalida]]
7. [[#7 · Cenários de concorrência]]
8. [[#8 · Bugs encontrados na verificação]]
9. [[#9 · Contrato da API]]
10. [[#10 · Verificação]]
11. [[#11 · Notas e pendências]]

---

## 1 · TL;DR

- O servidor **não armazena** "capítulo atual" — ele recalcula dinamicamente via `MAX(readAt)` + próximo sequencial. Isso abre uma janela onde dois dispositivos podem **pular um capítulo silenciosamente**.
- **Correção:** o client passa a enviar explicitamente o `chapterId` que confirma (ele já tem esse id do `/feed`). O servidor valida existência → checa idempotência → compara com o esperado.
- **Sem** migration, coluna de versão, token assinado ou WebSocket. A constraint `UNIQUE(user_id, chapter_id)` já garantia atomicidade da escrita; a mudança ajusta a **semântica**.
- A correção de semântica veio acompanhada de 3 bugs de runtime descobertos ao testar ao vivo (binding de transação, body vazio → 500, client mandando body errado).

---

## 2 · O problema (race condition)

### Estado anterior

`POST /journey/next` não recebia nenhum dado do client. Ele sempre recalculava o "capítulo atual" no servidor:

```text
findNextChapterToRead(userId):
  lastRead = SELECT chapter_id FROM journey_readings
             WHERE user_id = ? ORDER BY read_at DESC LIMIT 1
  → próximo capítulo sequencial (book.order, chapter.number) após lastRead
```

Não existe coluna "capítulo atual". O ponteiro é **derivado** do histórico de leitura.

### A janela de corrida

```text
Device A (celular)          Device B (notebook)
exibindo capítulo 6         exibindo capítulo 6
       │                           │
       │ POST /next                │
       │ recalcula → atual = 6     │
       │ marca 6 lido  ───────────►│  (commit de A)
       │                           │ POST /next
       │                           │ recalcula → atual = 7  ❌
       │                           │ marca 7 lido
       ▼                           ▼
              capítulo 7 marcado como lido
              SEM o usuário ter lido o 7
```

> [!danger] Sintoma
> Progresso pula capítulos. O usuário no Device B confirmou "li o capítulo que estou vendo" (o 6), mas o servidor avançou para o 7 porque A já tinha movido o ponteiro.

### O que NÃO era o problema

Esconder/ofuscar IDs de capítulo no payload **não** resolve — é segurança por obscuridade. O bug é de **consistência**, não de exposição de dado.

---

## 3 · A decisão de arquitetura

Quatro candidatas foram avaliadas:

| Abordagem | Veredicto |
|:--|:--|
| **Progressão por `chapterId` explícito** | ✅ **Escolhida** — client manda o que confirma; servidor decide |
| Optimistic concurrency / coluna de versão | ❌ Overkill; a `UNIQUE` já dá atomicidade de escrita |
| Tokens de progressão assinados | ❌ Complexidade alta para nenhum ganho real de segurança |
| Sync em tempo real (WS/SSE) | ❌ Problema de infra desproporcional ao caso |

### Princípio da decisão

> [!tip] O cliente é a fonte da verdade sobre **o que ele leu**; o servidor é a fonte da verdade sobre **o que é válido avançar**.

O client envia o `chapterId` que está confirmando (já disponível no payload do `/feed`). O servidor aplica três checagens **nesta ordem** — a ordem importa:

```text
1. Capítulo existe?           não → 404 NotFound
2. Já está lido? (idempotência) sim → 200 no-op   ◄── desarma a corrida
3. Bate com o esperado?       não → 409 Conflict (client deve refazer /feed)
   sim → marca como lido → 200
```

A **idempotência vir antes** da checagem de "esperado" é o que neutraliza a corrida do §2: quando a requisição do Device B chega, seu próprio `chapterId` (o 6) **já está marcado como lido** por A → short-circuit em sucesso, o capítulo 7 nunca é tocado.

### Por que sem migration

`journey_readings` já tem `UNIQUE(user_id, chapter_id)`, e a escrita usa `INSERT ... ON CONFLICT DO UPDATE`. A integridade de dados (não marcar o mesmo par duas vezes) **já estava protegida no banco**. O que faltava era a semântica da resposta — resolvida em código de aplicação.

---

## 4 · Fluxo ponta-a-ponta

```text
┌─ CLIENT (apps/client) ──────────────────────────────────────────┐
│                                                                  │
│  IntersectionObserver detecta capítulo saindo da viewport        │
│  (use-active-chapter.ts) ── debounce 500ms ──┐                   │
│                                              ▼                   │
│  saveQueueRef.push(chapterId)                                    │
│  processQueue() — serializado, uma POST por vez                  │
│                                              │                   │
│  saveChapterRead(chapterId, queryClient):                        │
│   • tenta POST (orval fetch)                                     │
│   • 5xx → retry até 3x (backoff 1s/2s/4s, lib retry-utils.ts)   │
│   • 5xx esgotado → toast.error("Progresso pode não ter sido      │
│     salvo") + console.error, retorna false                       │
│   • 409 → invalidateQueries(["journey-feed"]) + retorna false    │
│   • 200 → retorna true → se near-end: fetchNextPage()            │
│                                              │                   │
│  Retry global do QueryClient (GET /feed apenas):                 │
│   • retry: retryOn5xx (src/lib/retry-utils.ts)                   │
│   • retryDelay: exponentialDelay                                 │
│   • erros 4xx nunca são retentados                               │
└──────────────────────────────────────────────┼──────────────────┘
                                                ▼  POST {chapterId}
┌─ API (apps/api) ────────────────────────────────────────────────┐
│  Route (OpenAPIHono)  → valida body (zod markChapterAsRead…)     │
│  Controller           → guard de chapterId presente               │
│  Service (transação)  → existe? / já lido? / bate? → marca        │
│  Repository           → INSERT ... ON CONFLICT DO UPDATE          │
│  Postgres             → UNIQUE(user_id, chapter_id)               │
└─────────────────────────────────────────────────────────────────┘
```

Após o sucesso, o `invalidateQueries(["journey-feed"])` força o `useInfiniteQuery` a refazer `GET /feed`, que agora retorna o próximo capítulo (o ponteiro do servidor já avançou). O feed re-renderiza com o buffer correto.

---

## 5 · Backend — camada por camada

### Repository — `journey.v1.repository.ts`

Métodos passam a aceitar um `tx?` opcional (mesmo padrão do `UserRepository`), trocando `this.db` por `const client = tx ?? this.db`. Novidades:

- **`findChapterById(chapterId, tx?)`** — valida existência antes do insert, evitando vazar violação de FK como 500.
- **`markChapterAsRead`** — escrita idempotente no nível do banco:

```ts
await client
  .insert(journeyReadings)
  .values({ userId, chapterId, readAt: new Date() })
  .onConflictDoUpdate({
    target: [journeyReadings.userId, journeyReadings.chapterId],
    set: { readAt: new Date() },
  });
```

### Service — `journey.v1.service.ts`

Tudo dentro de uma transação Drizzle, com a ordem de checagens do §3:

```ts
async markCurrentAsRead(userId: string, chapterId: string) {
  return this.transaction(async (tx) => {
    if (!(await this.repository.findChapterById(chapterId, tx)))
      throw new NotFoundError("Chapter not found");

    // idempotência PRIMEIRO — desarma a race do device B
    if (await this.repository.isChapterRead(userId, chapterId, tx))
      return { success: true };

    const expected = await this.repository.findNextChapterToRead(userId, tx);
    if (!expected || expected.chapter.id !== chapterId)
      throw new ConflictError("Chapter does not match expected current chapter");

    await this.repository.markChapterAsRead({ userId, chapterId }, tx);
    return { success: true };
  });
}
```

> [!warning] Mudança de comportamento intencional
> Antes, "fim da jornada" (sem capítulo a marcar) retornava `{ success: true }` silenciosamente. Agora lança `ConflictError` se o `chapterId` enviado não corresponde a nada já lido — mais correto, aceitável por estar em desenvolvimento ativo.

### Controller / Route

- Route declara `markChapterAsReadRequestSchema` (`chapterId: z.string().uuid()`) e `createErrorResponses([400, 401, 404, 409, 500])`.
- Controller faz guard de `chapterId` presente antes de chamar o service.

---

## 6 · Client — quem dispara e o que invalida

> [!important] O gatilho real **não** é um botão
> A confirmação de leitura é disparada por **scroll**, não por clique. Quem chama `POST /next` é o `useActiveChapter`, via `IntersectionObserver`, quando um capítulo **sai** da viewport (com debounce de 500ms e guards `hasBeenActive`/`hasBeenRead`/`isAtEnd`).

`use-active-chapter.ts` serializa as confirmações via `saveQueueRef` (array) + `isSavingRef` (lock) para evitar POSTs concorrentes que causariam 409. A função `saveChapterRead()` cuida de retry e erros:

```ts
async function saveChapterRead(chapterId, queryClient, attempt = 0): Promise<boolean> {
  try {
    await postApiV1ReadingsJourneyNext({ chapterId });
    return true;
  } catch (error) {
    if (error instanceof ApiError && error.response.status === 409) {
      queryClient.invalidateQueries({ queryKey: ["journey-feed"] });
      return false;  // sem toast — é um evento de resync
    }
    if (retryOn5xx(attempt, error)) {
      await sleep(exponentialDelay(attempt));
      return saveChapterRead(chapterId, queryClient, attempt + 1);
    }
    toast.error("Progresso pode não ter sido salvo");
    return false;
  }
}
```

`use-journey-progress.ts` (a mutation TanStack Query, usada onde há feedback de UI) cuida da invalidação de cache:

| Evento | Ação |
|:--|:--|
| `onSuccess` | invalida `["journey-status"]` **e** `["journey-feed"]` |
| `onError` 409 | invalida `["journey-feed"]` → força refetch do estado correto |

> [!note] Retry global para GET /feed
> `react-query-provider.tsx` configura `retry: retryOn5xx` e `retryDelay: exponentialDelay` no `QueryClient`. Isso protege o fetch do feed contra instabilidades 5xx — até 3 tentativas com backoff. Erros 4xx nunca são retentados. Os utilitários vivem em `src/lib/retry-utils.ts`.

---

## 7 · Cenários de concorrência

### Mesmo capítulo, dois dispositivos (req idênticas)

Dois resultados possíveis, **ambos benignos**:

- **A commita antes:** a checagem `isChapterRead` de B vê `true` → `200` no-op, uma única escrita.
- **Verdadeiramente simultâneo:** ambos passam a idempotência, ambos tentam o `INSERT ... ON CONFLICT`. O Postgres serializa no lock da `UNIQUE`: o segundo bloqueia, libera, cai no `DO UPDATE`. `200` para os dois, uma linha só.

Nunca há erro de constraint, deadlock ou dado duplicado.

### Dois capítulos diferentes

Só o `chapterId` que casa com o "esperado" calculado do estado committed naquele instante sucede. O outro:
- se já lido → `200` idempotente;
- se não bate → `409`, forçando refetch.

Como dois IDs diferentes não podem ambos casar com um único "esperado" determinístico, **não existe** janela que corrompa o invariante sequencial. Isolamento `READ COMMITTED` é suficiente: cada statement lê o committed mais recente, e o pior caso é um `409` transitório resolvido por retry/refetch.

### Dois capítulos saindo da viewport quase ao mesmo tempo (mesmo dispositivo)

> [!example] Cenário real observado
> Usuário rola rapidamente: capítulo A e B saem da viewport dentro da janela de debounce. O `IntersectionObserver` dispara para os dois. Sem serialização, duas POSTs seriam enviadas em paralelo — B chegaria ao servidor antes do ponteiro ter avançado com A, causando `409`.

**Solução no client (`use-active-chapter.ts`):**

```text
A sai → push("A") → processQueue() → isSaving=true → POST A → 200 OK
B sai → push("B") → processQueue() → isSaving=true, skip
                     (quando POST A terminar)
                   → processa B → POST B → 200 OK
```

O `saveQueueRef` garante que só uma POST está em curso a qualquer momento. O `409` que poderia acontecer em paralelo simplesmente não ocorre. Se por algum motivo um `409` chegar (ex.: resync de multi-dispositivo interrompendo a fila), o client invalida o feed e re-renderiza com o estado correto do servidor.

---

## 8 · Bugs encontrados na verificação

Colocar de pé revelou três bugs de runtime que os testes unitários (com mocks) não pegavam. Documentados aqui porque o **diagnóstico** é reutilizável.

### 8.1 · `this.session.transaction` — perda de binding

> [!bug] `eb1f16a` — `undefined is not an object (evaluating 'this.session.transaction')`
> O construtor guardava `db.transaction` como referência solta (`this.transaction = transaction ?? db.transaction`). Chamado via `this.transaction(...)`, o método do Drizzle **perdia o `this`** ligado ao `db`.
> **Por que os testes passavam:** eles injetam um mock `vi.fn` que não depende de `this`.
> **Fix:** `db.transaction.bind(db)` no fallback.

### 8.2 · Body malformado/vazio → 500 em vez de 400

> [!bug] `2bf2988` + `0eec0c2`
> O validador de body do Hono envelopa falha de parse como `Error("Malformed JSON in request body")` — **não** um `SyntaxError` — e a lança **antes** do controller, escapando do try/catch local e caindo no 500 genérico.
> **Diagnóstico:** instrumentei o handler global com um probe temporário que imprimia `err.name`/`err.message` na resposta → revelou `name=Error, msg="Malformed JSON in request body"`.
> **Fix:** `isJsonParseError()` no handler global (cobre a forma do Hono **e** `SyntaxError` cru) → normaliza para `400`. Uniforme para todas as rotas.

### 8.3 · Client enviando body vazio

> [!bug] `7584407`
> `use-active-chapter.ts` tinha um `fetch` artesanal **sem body**, escrito antes da exigência do `chapterId` e nunca atualizado — era o gatilho real, que fazia toda confirmação de leitura falhar.
> **Fix:** migrado para `postApiV1ReadingsJourneyNext({ chapterId })` (orval), enviando o id correto.

> [!note] Armadilha de ambiente
> `bun run --watch` **não recarregava** edições em arquivos transitivos (`utils.ts`, `handler.ts`) de forma confiável — foi preciso `touch src/server.ts` para forçar full reload. Se notar comportamento stale, reinicie o dev server.

---

## 9 · Contrato da API

`POST /api/v1/readings/journey/next` — requer sessão (cookie).

**Request body:**
```json
{ "chapterId": "<uuid>" }
```

**Respostas:**

| Status | Code | Quando |
|:--|:--|:--|
| `200` | `MARKED_AS_READ` | Marcado, ou no-op idempotente (já lido) |
| `400` | `VALIDATION_ERROR` | `chapterId` ausente/não-uuid |
| `400` | `BAD_REQUEST` | JSON do body malformado/vazio |
| `401` | `UnauthorizedError` | Sessão inválida / user-agent não bate |
| `404` | `NotFoundError` | `chapterId` não existe |
| `409` | `ConflictError` | `chapterId` não é o capítulo esperado → refazer `/feed` |

---

## 10 · Verificação

Validação ao vivo contra o servidor (`curl` com sessão real):

```text
body vazio                → 400 BAD_REQUEST ("Invalid JSON body")
JSON malformado           → 400 BAD_REQUEST
chapterId ausente         → 400 VALIDATION_ERROR
chapterId inexistente     → 404 NotFoundError
capítulo esperado         → 200 MARKED_AS_READ
repetir o mesmo capítulo  → 200 (idempotente)
```

Suítes: **API 190/190** · **client 98/98** · typecheck e lint limpos em ambos os apps (hooks de pre-commit rodam lint + typecheck + test no monorepo).

---

## 11 · Notas e pendências

- **Mesmo padrão de 500 existe em outros controllers** (ex.: `discovery.v1.controller.ts` → `markVersesAsRead` faz `c.req.json()` sem try/catch). O fix do handler global (§8.2) já cobre o caso de JSON malformado para essas rotas também, mas vale uma passada futura para uniformizar.
- A integração de UI que **exibe** estado de "marcando" (`isMarking` em `feed-context.tsx`) existe, mas a confirmação real é via scroll (`useActiveChapter`), não via componente clicável.

---

> Commits desta entrega: `f2a809f` · `8cfe6e5` · `2bf2988` · `7584407` · `eb1f16a` · `0eec0c2` (PR #54)

---

◀ [[Profile Edit System - Implementation Plan]] · 📚 [[Docs/_Index|Docs]] · [[01 Security]] ▶
