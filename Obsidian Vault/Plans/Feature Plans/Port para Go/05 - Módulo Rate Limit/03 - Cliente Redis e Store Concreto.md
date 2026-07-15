---
title: "Módulo Rate Limit — Cliente Redis e Store Concreto"
section: "Plans"
subsection: "Feature Plans"
tags: [versum, plans, go, aprendizado, rate-limit, redis]
up: "[[Plans/Feature Plans/Port para Go/05 - Módulo Rate Limit/_Index]]"
prev: "[[Plans/Feature Plans/Port para Go/05 - Módulo Rate Limit/02 - Middleware HTTP]]"
next: "[[Plans/Feature Plans/Port para Go/05 - Módulo Rate Limit/04 - Config e Montagem Final]]"
related: []
depth: 3
---

# 🔌 Módulo Rate Limit — Cliente Redis e Store Concreto

🏠 [[_Index|Home]] › 🗺️ [[Plans/_Index|Plans]] › 🚀 [[Plans/Feature Plans/_Index|Feature Plans]] › 🐹 [[Plans/Feature Plans/Port para Go/_Index|Port para Go]] › 🚦 [[Plans/Feature Plans/Port para Go/05 - Módulo Rate Limit/_Index|Módulo Rate Limit]] › **Cliente Redis e Store Concreto**

---

## Dois pacotes, dois papéis diferentes

```
internal/redis/              → conexão genérica: "como abrir e fechar uma conexão com Redis"
internal/redis/ratelimit/    → implementação concreta do Store: "como contar requisições usando Redis"
```

Essa separação existe pelo mesmo motivo de `internal/postgres` vs. `internal/postgres/bible` no módulo Bible: `internal/redis` não sabe nada sobre rate limit — se amanhã outro módulo precisar de Redis pra cache ou sessão, ele reaproveita `internal/redis.Client` sem herdar nenhuma lógica de janela fixa.

## `internal/redis` — conexão

```go
type Client struct {
    rdb *redis.Client
}

func New(ctx context.Context, url string) (*Client, error) {
    opts, err := redis.ParseURL(url) // cobre redis:// e rediss:// (TLS), sem opções manuais de host/porta
    if err != nil {
        return nil, err
    }
    rdb := redis.NewClient(opts)
    if err := rdb.Ping(ctx).Err(); err != nil {
        return nil, err
    }
    return &Client{rdb: rdb}, nil
}

func (c *Client) Close() error { return c.rdb.Close() }
```

Espelha exatamente `internal/postgres/database.go`: um construtor `New(ctx, url)` que abre a conexão e já confirma com `Ping` antes de devolver, e um `Close()`. `go-redis/v9` já resolve `rediss://` (TLS) sozinho via `redis.ParseURL` — não precisa de opções manuais de host/porta/TLS como o cliente do Bun não precisava também (o TS também só usa a connection string crua).

## `internal/redis/ratelimit` — `RedisStore`

```go
type RedisStore struct {
    rdb *redis.Client
}

func NewStore(client *redisinfra.Client) *RedisStore

func (s *RedisStore) Increment(ctx context.Context, key string, window time.Duration) (int64, time.Duration, error)
```

`RedisStore` implementa a interface `ratelimit.Store` (definida no [[Plans/Feature Plans/Port para Go/05 - Módulo Rate Limit/01 - Camada de Domínio|Domínio]]) implicitamente — não existe `implements` em Go, o compilador só confere que os métodos batem na hora de usar. Igual ao `BookRepository` (Postgres) do módulo Bible: a interface fica no pacote do domínio, a implementação real fica separada, e quem une as duas pontas é só a [[Plans/Feature Plans/Port para Go/05 - Módulo Rate Limit/04 - Config e Montagem Final|montagem final]].

## `INCR` + `EXPIRE NX`, igual ao TS

A lógica interna de `Increment` faz, de forma pipelinada:

1. `INCR key` — soma 1, cria a chave com valor 1 se ela não existir.
2. `EXPIRE key window NX` — seta o TTL só se a chave ainda não tiver um TTL (a flag `NX` do `EXPIRE`, disponível no Redis 7+, evita ter que checar "count == 1" manualmente como o TS faz).
3. `TTL key` — lê o tempo restante, usado pra calcular `RetryAfter` no [[Plans/Feature Plans/Port para Go/05 - Módulo Rate Limit/01 - Camada de Domínio|`Result`]].

O efeito é o mesmo do TS ("o TTL só é setado na primeira requisição da janela, as seguintes só incrementam"), só que resolvido com a flag `NX` do próprio Redis em vez de um `if count === 1` no código da aplicação.

---

◀ [[Plans/Feature Plans/Port para Go/05 - Módulo Rate Limit/02 - Middleware HTTP|Middleware HTTP]] · [[Plans/Feature Plans/Port para Go/05 - Módulo Rate Limit/04 - Config e Montagem Final|Config e Montagem Final]] ▶
