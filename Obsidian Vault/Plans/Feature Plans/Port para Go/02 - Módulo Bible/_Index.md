---
title: "Módulo Bible — Arquitetura"
section: "Plans"
subsection: "Feature Plans"
tags: [versum, plans, go, aprendizado, bible]
up: "[[Plans/Feature Plans/Port para Go/_Index]]"
prev: "[[Plans/Feature Plans/Port para Go/01 - Conceitos de Go]]"
next: "[[Plans/Feature Plans/Port para Go/03 - Módulo Seed/_Index]]"
related: []
depth: 2
---

# 📜 Módulo Bible — Arquitetura

🏠 [[_Index|Home]] › 🗺️ [[Plans/_Index|Plans]] › 🚀 [[Plans/Feature Plans/_Index|Feature Plans]] › 🐹 [[Plans/Feature Plans/Port para Go/_Index|Port para Go]] › **Módulo Bible**

---

## Estrutura de pastas

```
apps/api-go/
  cmd/api/                    → ponto de entrada (main.go), monta e sobe tudo
  db/migrations/              → migrations SQL (já feitas, ver Roadmap)
  internal/
    database/                 → conexão com Postgres (já feito, ver Roadmap)
    bible/                    → domínio + regra de negócio do módulo Bible
    postgres/bible/           → implementação concreta do repository, com SQL de verdade
```

Cada pasta abaixo de `internal/` é um pacote Go (ver [[Plans/Feature Plans/Port para Go/01 - Conceitos de Go|Conceitos de Go]] se "pacote" ainda não fizer sentido). O ponto central dessa organização: **`internal/bible` nunca importa `internal/postgres/bible`** — a seta de dependência aponta só numa direção, do código que sabe falar com o banco para o código que define as regras, nunca o contrário. Isso é o que resolve, em Go, o mesmo problema que o [[Plans/Feature Plans/Clean Architecture Refactor/00 - Diagnostico|Diagnóstico do refactor em TypeScript]] identificou (regra de negócio colada em detalhe de banco) — só que aqui a própria estrutura de pastas e o compilador ajudam a manter essa regra, em vez de depender só de disciplina do dev.

## As camadas, em ordem de dependência

| # | Camada | Pacote | Depende de |
|:--|:--|:--|:--|
| 1 | [[Plans/Feature Plans/Port para Go/02 - Módulo Bible/01 - Camada de Domínio\|Domínio]] | `internal/bible` | nada (é a base) |
| 2 | [[Plans/Feature Plans/Port para Go/02 - Módulo Bible/02 - Repository (Interface)\|Repository (Interface)]] | `internal/bible` | Domínio |
| 3 | [[Plans/Feature Plans/Port para Go/02 - Módulo Bible/03 - Repository (Implementação Postgres)\|Repository (Implementação)]] | `internal/postgres/bible` | Domínio + Repository (Interface) |
| 4 | [[Plans/Feature Plans/Port para Go/02 - Módulo Bible/04 - Camada de Service\|Service]] | `internal/bible` | Repository (Interface) — nunca a Implementação |
| 5 | [[Plans/Feature Plans/Port para Go/02 - Módulo Bible/05 - Camada de Handler HTTP\|Handler HTTP]] | `internal/bible` | Service |
| 6 | [[Plans/Feature Plans/Port para Go/02 - Módulo Bible/06 - Montagem Final (main.go)\|Montagem Final]] | `cmd/api` | todas as anteriores |

Detalhe importante na linha 4: o `Service` depende da **interface** do repository, não da implementação concreta com Postgres. Quem decide qual implementação de verdade vai ser usada é só a camada 6 (`main.go`), na hora de montar tudo — é o mesmo princípio de inversão de dependência que o `Clean Architecture Refactor` documentou como faltando no TypeScript, só que aqui nasce assim desde o início.

## Correspondência com o módulo original (TypeScript)

Pra quem for comparar com `apps/api/src/modules/bible`, o de-para é:

| TypeScript | Go | Observação |
|:--|:--|:--|
| `db/*.table.ts` (schema Drizzle) | `db/migrations/*.sql` | Migrations não têm ORM, é SQL puro |
| tipo `Book` (`InferSelectModel`) | `internal/bible` (Domínio) | Em Go o tipo de domínio **não** é gerado do banco — ver [[Plans/Feature Plans/Port para Go/02 - Módulo Bible/01 - Camada de Domínio\|página da camada]] |
| `bible.types.repository.ts` (interface) | `internal/bible` (Repository Interface) | Aqui a interface é usada de verdade pelo Service — no TS ela existe mas ninguém depende dela |
| `bible.repository.ts` | `internal/postgres/bible` | Aqui com SQL escrito à mão, sem Drizzle |
| `bible.v1.service.ts` | `internal/bible` (Service) | Mesma responsabilidade: validar "não encontrado", nada além disso |
| `bible.v1.controller.ts` + `bible.v1.route.ts` | `internal/bible` (Handler HTTP) | Em Go as duas coisas (parsear request + registrar rota) tendem a ficar mais próximas, sem framework separando tanto |

---

◀ [[Plans/Feature Plans/Port para Go/01 - Conceitos de Go|Conceitos de Go]] · [[Plans/Feature Plans/Port para Go/03 - Módulo Seed/_Index|Módulo Seed]] ▶
