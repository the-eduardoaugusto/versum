---
title: "Módulo Rate Limit — Arquitetura"
section: "Plans"
subsection: "Feature Plans"
tags: [versum, plans, go, aprendizado, rate-limit, redis]
up: "[[Plans/Feature Plans/Port para Go/_Index]]"
prev: "[[Plans/Feature Plans/Port para Go/04 - Roadmap e Status]]"
related: []
depth: 2
---

# 🚦 Módulo Rate Limit — Arquitetura

🏠 [[_Index|Home]] › 🗺️ [[Plans/_Index|Plans]] › 🚀 [[Plans/Feature Plans/_Index|Feature Plans]] › 🐹 [[Plans/Feature Plans/Port para Go/_Index|Port para Go]] › **Módulo Rate Limit**

---

## O que está sendo migrado

`apps/api/src/middlewares/rate-limiter/middleware.ts` (TypeScript) implementa um limitador global de requisições — janela fixa (fixed window) contada no Redis via `INCR`+`EXPIRE`, chave `rate_limit:{ip}:{path}:{windowStart}`, 100 requisições por 60 segundos por IP. Roda como o primeiro middleware global da aplicação (`apps/api/src/utils/app/setups/setup-middlewares.ts`), antes de qualquer autenticação — que, nesse projeto, nunca é global mesmo, só por rota. Existem ainda três limitadores por rota (magic-link send/consume, upload de avatar) que **não fazem parte desta migração** — ficam para quando as rotas de auth/users forem portadas.

O destino é `apps/api-go`, usando `github.com/redis/go-redis/v9` (já presente no `go.mod` como dependência indireta, nunca importada até agora).

## Escopo desta migração

Só o limitador global (IP, 100 req/60s). A camada de domínio, porém, é desenhada de forma genérica desde o início — não porque o escopo pediu, mas porque é a única forma de depois ligar um limitador numa rota específica sem reabrir o pacote de domínio: basta compor um `Limiter` novo com outra `Config`, reaproveitando o mesmo `Store`.

## Estrutura de pastas

```
apps/api-go/
  internal/
    ratelimit/              → domínio: Store (interface), Limiter, Config, KeyFunc — zero import de Redis
    redis/                  → conexão genérica com Redis (mirror de internal/postgres)
    redis/ratelimit/        → implementação concreta do Store, com INCR+EXPIRE via go-redis
```

O ponto central, igual ao módulo Bible: **`internal/ratelimit` nunca importa `internal/redis/ratelimit`**. A seta de dependência aponta só numa direção — do código que sabe falar com o Redis para o código que define a regra de negócio, nunca o contrário. Ver [[Plans/Feature Plans/Port para Go/02 - Módulo Bible/_Index|Módulo Bible — Arquitetura]] pro mesmo princípio já aplicado ali.

## As camadas, em ordem de dependência

| # | Camada | Pacote | Depende de |
|:--|:--|:--|:--|
| 1 | [[Plans/Feature Plans/Port para Go/05 - Módulo Rate Limit/01 - Camada de Domínio\|Domínio]] | `internal/ratelimit` | nada (é a base) |
| 2 | [[Plans/Feature Plans/Port para Go/05 - Módulo Rate Limit/02 - Middleware HTTP\|Middleware HTTP]] | `internal/ratelimit` | Domínio |
| 3 | [[Plans/Feature Plans/Port para Go/05 - Módulo Rate Limit/03 - Cliente Redis e Store Concreto\|Cliente Redis e Store Concreto]] | `internal/redis`, `internal/redis/ratelimit` | Domínio (implementa a interface `Store`) |
| 4 | [[Plans/Feature Plans/Port para Go/05 - Módulo Rate Limit/04 - Config e Montagem Final\|Config e Montagem Final]] | `internal/config`, `cmd/api` | todas as anteriores |

Igual ao módulo Bible: quem decide qual implementação de `Store` vai ser usada de verdade é só a última camada (`main.go`), na hora de montar tudo.

## Decisões tomadas

- **Fail-closed.** Se o Redis falhar (erro de conexão, timeout no `INCR`), a requisição é bloqueada (503) — mesmo comportamento do TS. Redis vira um ponto único de disponibilidade, mas é a opção mais segura contra abuso durante uma instabilidade.
- **Corpo de resposta segue o padrão do `httputil` do api-go, não o corpo do TS.** O TS responde `{success, message, retryAfter}`; aqui, o 429/503 usa o mesmo shape `{status, message}` já usado por `httputil.BadRequest`/`NotFound` em todo o resto da API. Os dados específicos de rate limit (limite, restante, tempo de espera) ficam só nos headers `X-RateLimit-Limit`, `X-RateLimit-Remaining` e `Retry-After` — não duplicados no corpo.
- **Limites hardcoded, não vêm de env var.** Mesmo comportamento do TS: só a connection string do Redis é configurável, o `Limit`/`Window` de cada `Limiter` é decidido em código, na hora de instanciar.
- **Sem chain de middleware genérica ainda.** O api-go não tem nenhum conceito de middleware chain hoje — `mux` vai direto pro `http.ListenAndServe`. Como só existe um middleware global (o rate limiter), ele embrulha o `mux` diretamente; um helper `Chain(...)` só se justifica quando aparecer um segundo middleware de nível global.

## Correspondência com o módulo original (TypeScript)

| TypeScript | Go | Observação |
|:--|:--|:--|
| `middlewares/rate-limiter/middleware.ts` (classe `GlobalRateLimiter`) | `internal/ratelimit` (`Limiter` + `Config`) | Em Go não é uma classe por limitador — é uma única struct `Limiter`, parametrizada por `Config`, reaproveitável pra qualquer regra |
| Bun `RedisClient` (`infrastructure/redis/client.ts`) | `internal/redis` (`Client`) | Troca o cliente embutido do Bun pelo `go-redis/v9`, com `redis.ParseURL` cobrindo `redis://`/`rediss://` |
| Lógica de `INCR`+`EXPIRE` dentro do próprio middleware | `internal/redis/ratelimit` (`RedisStore`) | Em Go essa lógica sai do middleware e vira uma implementação isolada de `Store` — o middleware não sabe que é Redis |
| `getClientIp` (dentro do middleware) | `internal/ratelimit` (`ByIP`, em `keys.go`) | Mesma precedência de headers, mas vira uma função de domínio reaproveitável (`KeyFunc`), não presa a um limitador específico |
| `env.REDIS_DATABASE_URL` (schema Zod) | `internal/config` (`RedisURL`, env `REDIS_URL`) | Nome da env var diferente por decisão — cada app tem seu próprio `.env`, sem necessidade de paridade de nome |
| Resposta `{success, message, retryAfter}` + headers | `httputil.Error{status, message}` + os mesmos headers | Corpo adaptado ao padrão já usado no api-go (ver "Decisões tomadas" acima) |
| `MagicLinkSendRateLimiter`, `MagicLinkConsumeRateLimiter`, `AvatarUploadRateLimiter` | *(fora de escopo)* | Cada um vira, no futuro, só mais um `ratelimit.Config` diferente aplicado a uma rota específica — não exige mudança nas camadas 1-3 |

---

◀ [[Plans/Feature Plans/Port para Go/04 - Roadmap e Status|Roadmap e Status]] · 🐹 [[Plans/Feature Plans/Port para Go/_Index|Port para Go]]
