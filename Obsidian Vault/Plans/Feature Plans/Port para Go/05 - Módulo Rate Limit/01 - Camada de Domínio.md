---
title: "Módulo Rate Limit — Camada de Domínio"
section: "Plans"
subsection: "Feature Plans"
tags: [versum, plans, go, aprendizado, rate-limit, dominio]
up: "[[Plans/Feature Plans/Port para Go/05 - Módulo Rate Limit/_Index]]"
prev: "[[Plans/Feature Plans/Port para Go/05 - Módulo Rate Limit/_Index]]"
next: "[[Plans/Feature Plans/Port para Go/05 - Módulo Rate Limit/02 - Middleware HTTP]]"
related: []
depth: 3
---

# 🧱 Módulo Rate Limit — Camada de Domínio

🏠 [[_Index|Home]] › 🗺️ [[Plans/_Index|Plans]] › 🚀 [[Plans/Feature Plans/_Index|Feature Plans]] › 🐹 [[Plans/Feature Plans/Port para Go/_Index|Port para Go]] › 🚦 [[Plans/Feature Plans/Port para Go/05 - Módulo Rate Limit/_Index|Módulo Rate Limit]] › **Domínio**

---

## O que mora aqui

`internal/ratelimit`, três arquivos: `limiter.go`, `keys.go`, `middleware.go` (a última fica pra [[Plans/Feature Plans/Port para Go/05 - Módulo Rate Limit/02 - Middleware HTTP|próxima página]]). Nenhum deles importa `go-redis` ou qualquer coisa de infraestrutura — igual ao [[Plans/Feature Plans/Port para Go/02 - Módulo Bible/01 - Camada de Domínio|Domínio do módulo Bible]], que também não sabe que Postgres existe.

## A interface `Store`

```go
type Store interface {
    // Increment soma 1 ao contador de key dentro da janela window, criando-o
    // com esse TTL se ainda não existir. Retorna a contagem nova e o TTL restante.
    Increment(ctx context.Context, key string, window time.Duration) (count int64, ttl time.Duration, err error)
}
```

É só uma promessa — "quem quiser servir de armazenamento de contadores pro rate limit precisa saber fazer isso aqui" — igual ao papel do `BookRepository` no módulo Bible. Quem cumpre essa promessa de verdade é `internal/redis/ratelimit.RedisStore`, na [[Plans/Feature Plans/Port para Go/05 - Módulo Rate Limit/03 - Cliente Redis e Store Concreto|próxima camada]]; como em Go uma interface é satisfeita implicitamente (ver [[Plans/Feature Plans/Port para Go/01 - Conceitos de Go|Conceitos de Go]]), `RedisStore` nem precisa declarar que implementa `Store`.

## `Config`, `Limiter` e `Result`

```go
type KeyFunc func(r *http.Request) string

type Config struct {
    Limit   int64
    Window  time.Duration
    KeyFunc KeyFunc
    Prefix  string // namespace da chave no Redis, ex.: "global", "magic-link:send"
}

type Limiter struct {
    store  Store
    config Config
}

func NewLimiter(store Store, config Config) *Limiter

type Result struct {
    Allowed    bool
    Limit      int64
    Remaining  int64
    RetryAfter time.Duration // só é válido quando Allowed == false
}

func (l *Limiter) Allow(ctx context.Context, r *http.Request) (Result, error)
```

No TypeScript, cada regra (`GlobalRateLimiter`, `MagicLinkSendRateLimiter`...) é uma **classe separada**, cada uma com sua própria lógica de janela e chave copiada e colada. Aqui existe uma única struct `Limiter`, parametrizada por `Config` — a regra "100 por 60s, por IP, namespace global" e uma futura regra "5 por 60s, por e-mail, namespace magic-link:send" são o **mesmo código**, só instanciado duas vezes com `Config` diferente. Isso é o que sustenta a modularidade pedida: adicionar um rate limit numa rota nova não mexe em `limiter.go` — só cria mais um `NewLimiter(store, outraConfig)` na montagem final.

## `Prefix` e o esquema de chave

A chave final no Redis segue o mesmo esquema de janela fixa do TS — `rate_limit:{prefix}:{identificador}:{windowStart}`, onde `windowStart = agora.Unix() / window.Seconds()` — só que com `Prefix` explícito. No TS a chave usa o path da rota (`rate_limit:{ip}:{path}:{windowStart}`) porque só existe um limitador rodando globalmente, então o path já basta pra separar buckets. Aqui, como vários `Limiter` podem coexistir com propósitos diferentes (não necessariamente presos a uma rota), `Prefix` é quem evita colisão entre eles.

## `keys.go` — `ByIP`

```go
func ByIP(r *http.Request) string
```

Porta a lógica exata de `getClientIp` do TS: prefere o header `X-Real-Ip`; senão, pega a entrada mais à direita de `X-Forwarded-For` que não seja um IP privado; senão, cai pro `r.RemoteAddr`. Vira uma função solta do tipo `KeyFunc`, não um método de uma classe específica — qualquer `Limiter` futuro que também precise identificar por IP reaproveita a mesma função, sem reescrever.

---

◀ [[Plans/Feature Plans/Port para Go/05 - Módulo Rate Limit/_Index|Módulo Rate Limit]] · [[Plans/Feature Plans/Port para Go/05 - Módulo Rate Limit/02 - Middleware HTTP|Middleware HTTP]] ▶
