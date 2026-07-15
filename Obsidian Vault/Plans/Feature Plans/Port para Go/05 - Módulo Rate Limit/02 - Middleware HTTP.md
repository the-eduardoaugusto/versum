---
title: "Módulo Rate Limit — Middleware HTTP"
section: "Plans"
subsection: "Feature Plans"
tags: [versum, plans, go, aprendizado, rate-limit, http]
up: "[[Plans/Feature Plans/Port para Go/05 - Módulo Rate Limit/_Index]]"
prev: "[[Plans/Feature Plans/Port para Go/05 - Módulo Rate Limit/01 - Camada de Domínio]]"
next: "[[Plans/Feature Plans/Port para Go/05 - Módulo Rate Limit/03 - Cliente Redis e Store Concreto]]"
related: []
depth: 3
---

# 🌐 Módulo Rate Limit — Middleware HTTP

🏠 [[_Index|Home]] › 🗺️ [[Plans/_Index|Plans]] › 🚀 [[Plans/Feature Plans/_Index|Feature Plans]] › 🐹 [[Plans/Feature Plans/Port para Go/_Index|Port para Go]] › 🚦 [[Plans/Feature Plans/Port para Go/05 - Módulo Rate Limit/_Index|Módulo Rate Limit]] › **Middleware HTTP**

---

## O que é um middleware em Go (sem framework)

O api-go não usa Express/Hono — é `net/http` puro. Um "middleware" aqui é só uma função que recebe um `http.Handler` e devolve outro `http.Handler`, decidindo se chama o próximo (`next.ServeHTTP`) ou responde direto e para ali:

```go
func Middleware(limiter *Limiter) func(http.Handler) http.Handler {
    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            // decide: chama next.ServeHTTP(w, r) ou responde aqui e para
        })
    }
}
```

Isso mora em `internal/ratelimit/middleware.go`, ainda dentro do domínio — a única coisa nova que essa camada adiciona é traduzir um `Result` do [[Plans/Feature Plans/Port para Go/05 - Módulo Rate Limit/01 - Camada de Domínio|Domínio]] em resposta HTTP.

## Corpo do middleware

```go
func Middleware(limiter *Limiter) func(http.Handler) http.Handler {
    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            result, err := limiter.Allow(r.Context(), r)
            if err != nil {
                // fail-closed: erro no Store bloqueia a requisição
                httputil.WriteError(w, httputil.ServiceUnavailable("temporarily unavailable"))
                return
            }

            w.Header().Set("X-RateLimit-Limit", strconv.FormatInt(result.Limit, 10))
            w.Header().Set("X-RateLimit-Remaining", strconv.FormatInt(result.Remaining, 10))

            if !result.Allowed {
                w.Header().Set("Retry-After", strconv.Itoa(int(result.RetryAfter.Seconds())))
                httputil.WriteError(w, httputil.TooManyRequests("too many requests"))
                return
            }

            next.ServeHTTP(w, r)
        })
    }
}
```

## Fail-closed: erro de Redis também bloqueia

No TS, um erro no `INCR`/`EXPIRE` responde 503 em vez de deixar passar — decisão consciente de que é mais seguro barrar tráfego durante uma instabilidade do Redis do que abrir uma brecha de abuso. O port mantém o mesmo comportamento: qualquer `error` vindo de `limiter.Allow` (que por sua vez vem de `Store.Increment`) já responde 503 antes mesmo de olhar pro `Result`.

## Dois construtores novos em `httputil`

`internal/httputil/error.go` já tem `BadRequest` e `NotFound`, cada um só um atalho pra `&Error{Status: ..., Message: ...}`. Esta camada segue o mesmo padrão, adicionando:

```go
func TooManyRequests(message string) *Error {
    return &Error{Status: http.StatusTooManyRequests, Message: message}
}

func ServiceUnavailable(message string) *Error {
    return &Error{Status: http.StatusServiceUnavailable, Message: message}
}
```

## Corpo da resposta: por que não é igual ao TS

O TS responde, no 429: `{ success: false, message: "Muitas requisições...", retryAfter: 42 }`. Aqui, a resposta usa o shape padrão já usado em toda a API Go — `httputil.Error{Status, Message}`, serializado como `{"status":429,"message":"too many requests"}`. Foi uma escolha deliberada (ver [[Plans/Feature Plans/Port para Go/05 - Módulo Rate Limit/_Index|Módulo Rate Limit — Decisões tomadas]]): manter consistência de formato de erro em toda a API pesa mais do que replicar bit-a-bit o corpo do TS, já que a informação de rate limit (limite, restante, tempo de espera) continua acessível — só que via headers (`X-RateLimit-Limit`, `X-RateLimit-Remaining`, `Retry-After`), não duplicada no corpo.

## Por que os headers são setados antes de saber se passou

`X-RateLimit-Limit`/`X-RateLimit-Remaining` são escritos **sempre**, mesmo quando a requisição é permitida — igual ao TS, que também expõe esses dois headers em toda resposta, não só nas bloqueadas. `Retry-After` só aparece quando `Allowed == false`, porque só faz sentido dizer "tente de novo em N segundos" quando a requisição foi de fato barrada.

---

◀ [[Plans/Feature Plans/Port para Go/05 - Módulo Rate Limit/01 - Camada de Domínio|Domínio]] · [[Plans/Feature Plans/Port para Go/05 - Módulo Rate Limit/03 - Cliente Redis e Store Concreto|Cliente Redis e Store Concreto]] ▶
