---
title: "Port para Go"
section: "Plans"
subsection: "Feature Plans"
tags: [versum, plans, go, aprendizado, api]
up: "[[Plans/Feature Plans/_Index]]"
related: ["[[Plans/Feature Plans/Clean Architecture Refactor/_Index]]"]
depth: 1
---

# 🐹 Port para Go

Registro de aprendizado e plano de organização do port da API (`apps/api`, hoje em TypeScript) para Go — módulo por módulo, começando pelo mais simples. Esse plano é diferente do [[Plans/Feature Plans/Clean Architecture Refactor/_Index|Clean Architecture Refactor]]: aquele é sobre arrumar a arquitetura do código TypeScript existente; este é sobre aprender Go do zero escrevendo uma versão nova, sem pressa e sem risco, porque **a aplicação ainda não foi lançada** (pré-alpha, sem usuário real).

> Se você não sabe quase nada de Go ainda, sem problema — cada página aqui explica os conceitos novos conforme aparecem, sem assumir conhecimento prévio da linguagem.

## Por onde começar

1. Leia **[[Plans/Feature Plans/Port para Go/00 - Contexto e Objetivo|Contexto e Objetivo]]** — por que esse projeto existe e quais decisões já foram tomadas.
2. Depois **[[Plans/Feature Plans/Port para Go/01 - Conceitos de Go|Conceitos de Go]]** — um glossário vivo dos conceitos da linguagem aprendidos até agora, útil pra consultar quando esquecer o que alguma coisa significa.
3. Veja a arquitetura do primeiro módulo em **[[Plans/Feature Plans/Port para Go/02 - Módulo Bible/_Index|Módulo Bible]]**.
4. Veja o plano de migração do seed em **[[Plans/Feature Plans/Port para Go/03 - Módulo Seed/_Index|Módulo Seed]]**.
5. Acompanhe o progresso em **[[Plans/Feature Plans/Port para Go/04 - Roadmap e Status|Roadmap e Status]]**.
6. Veja o plano do rate limit global em **[[Plans/Feature Plans/Port para Go/05 - Módulo Rate Limit/_Index|Módulo Rate Limit]]**.

## Conteúdo

| Área | Descrição | Link |
|:--|:--|:--|
| 📋 Contexto e Objetivo | Por que aprender Go assim, decisões já tomadas | [[Plans/Feature Plans/Port para Go/00 - Contexto e Objetivo\|Abrir]] |
| 📖 Conceitos de Go | Glossário dos conceitos da linguagem aprendidos até agora | [[Plans/Feature Plans/Port para Go/01 - Conceitos de Go\|Abrir]] |
| 📜 Módulo Bible | Primeiro módulo portado — estrutura de pastas e camadas | [[Plans/Feature Plans/Port para Go/02 - Módulo Bible/_Index\|Abrir]] |
| 🌱 Módulo Seed | Migração do CLI de seed (TS) pro binário `go run cmd/seed/bible` | [[Plans/Feature Plans/Port para Go/03 - Módulo Seed/_Index\|Abrir]] |
| 🗺️ Roadmap e Status | O que já foi feito, o que falta, em que ordem | [[Plans/Feature Plans/Port para Go/04 - Roadmap e Status\|Abrir]] |
| 🚦 Módulo Rate Limit | Plano do rate limit global (Redis, fixed window) para `apps/api-go` | [[Plans/Feature Plans/Port para Go/05 - Módulo Rate Limit/_Index\|Abrir]] |

---

◀ [[Plans/Feature Plans/_Index|Feature Plans]]
