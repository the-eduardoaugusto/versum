---
title: "Módulo Rate Limit — Config e Montagem Final"
section: "Plans"
subsection: "Feature Plans"
tags: [versum, plans, go, aprendizado, rate-limit, config]
up: "[[Plans/Feature Plans/Port para Go/05 - Módulo Rate Limit/_Index]]"
prev: "[[Plans/Feature Plans/Port para Go/05 - Módulo Rate Limit/03 - Cliente Redis e Store Concreto]]"
related: []
depth: 3
---

# 🏗️ Módulo Rate Limit — Config e Montagem Final

🏠 [[_Index|Home]] › 🗺️ [[Plans/_Index|Plans]] › 🚀 [[Plans/Feature Plans/_Index|Feature Plans]] › 🐹 [[Plans/Feature Plans/Port para Go/_Index|Port para Go]] › 🚦 [[Plans/Feature Plans/Port para Go/05 - Módulo Rate Limit/_Index|Módulo Rate Limit]] › **Config e Montagem Final**

---

## `internal/config` ganha `RedisURL`

`internal/config/config.go` (`Config` struct) ganha o campo `RedisURL string`, e `internal/config/env.go` ganha uma entrada a mais na lista declarativa de `[]Field{...}` que já existe:

```go
{
    name: "REDIS_URL",
    dest: &c.RedisURL,
},
```

Mesmo padrão de `POSTGRES_URL`, nada novo — é só mais uma linha na mesma lista. `.env` ganha `REDIS_URL=redis://localhost:6379` pro ambiente local.

## Por que `REDIS_URL` e não `REDIS_DATABASE_URL`

No TS a env var se chama `REDIS_DATABASE_URL`. Aqui virou `REDIS_URL` — decisão consciente, não descuido: cada app (`apps/api` e `apps/api-go`) tem seu próprio `.env`, não existe um secret compartilhado entre os dois que exigisse manter o nome idêntico. `REDIS_URL` é o nome mais comum na convenção Go/12-factor.

## `cmd/api/main.go` — montando o limitador global

```go
rdb, err := redisinfra.New(ctx, cfg.RedisURL)
if err != nil {
    log.Fatalf("error on connect to redis: %v", err)
}

store := redis_ratelimit.NewStore(rdb)
globalLimiter := ratelimit.NewLimiter(store, ratelimit.Config{
    Limit:   100,
    Window:  60 * time.Second,
    KeyFunc: ratelimit.ByIP,
    Prefix:  "global",
})

mux := http.NewServeMux()
setupBibleModule(mux, db.Pool)
mux.HandleFunc("GET /", ...)

handler := ratelimit.Middleware(globalLimiter)(mux)
if err := http.ListenAndServe(":"+port, handler); err != nil {
    log.Fatalf("error on server start: %v", err)
}
```

O `mux` continua exatamente como está hoje — nada dentro dele muda. O que muda é o que é passado pro `http.ListenAndServe`: em vez do `mux` puro, vai `ratelimit.Middleware(globalLimiter)(mux)`, que embrulha o mux inteiro. Isso reproduz a posição do `GlobalRateLimiter` no TS — primeiro middleware, antes de qualquer coisa, inclusive antes de qualquer autenticação (que no api-go, igual ao TS, nunca é global — é sempre aplicada por rota).

## Como um rate limit por rota vai encaixar aqui no futuro

Quando alguma rota especifica precisar do próprio limite (o equivalente a `MagicLinkSendRateLimiter` no TS), a receita é: criar outro `*ratelimit.Limiter` com outra `Config` (outro `Limit`/`Window`/`KeyFunc`/`Prefix`), reaproveitando o mesmo `store` já instanciado, e aplicar `ratelimit.Middleware(limiter)` só no `http.Handler` daquela rota — não no `mux` inteiro. Nenhuma das três camadas anteriores ([[Plans/Feature Plans/Port para Go/05 - Módulo Rate Limit/01 - Camada de Domínio|Domínio]], [[Plans/Feature Plans/Port para Go/05 - Módulo Rate Limit/02 - Middleware HTTP|Middleware HTTP]], [[Plans/Feature Plans/Port para Go/05 - Módulo Rate Limit/03 - Cliente Redis e Store Concreto|Store Concreto]]) precisa mudar pra isso — é só mais uma chamada em `main.go`.

## O que fica de fora, por enquanto

Nenhuma chain de middleware genérica (`Chain(mw1, mw2, ...)`) é introduzida — com um único middleware global, embrulhar o `mux` uma vez já resolve. Esse helper só se justifica quando um segundo middleware de nível global aparecer (ex.: logging de request, CORS).

---

◀ [[Plans/Feature Plans/Port para Go/05 - Módulo Rate Limit/03 - Cliente Redis e Store Concreto|Cliente Redis e Store Concreto]] · 🚦 [[Plans/Feature Plans/Port para Go/05 - Módulo Rate Limit/_Index|Módulo Rate Limit]]
