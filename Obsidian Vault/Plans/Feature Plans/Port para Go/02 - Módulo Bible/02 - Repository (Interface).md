---
title: "Módulo Bible — Repository (Interface)"
section: "Plans"
subsection: "Feature Plans"
tags: [versum, plans, go, aprendizado, bible, repository]
up: "[[Plans/Feature Plans/Port para Go/02 - Módulo Bible/_Index]]"
prev: "[[Plans/Feature Plans/Port para Go/02 - Módulo Bible/01 - Camada de Domínio]]"
next: "[[Plans/Feature Plans/Port para Go/02 - Módulo Bible/03 - Repository (Implementação Postgres)]]"
related: []
depth: 3
---

# 📇 Módulo Bible — Repository (Interface)

🏠 [[_Index|Home]] › 🗺️ [[Plans/_Index|Plans]] › 🚀 [[Plans/Feature Plans/_Index|Feature Plans]] › 🐹 [[Plans/Feature Plans/Port para Go/_Index|Port para Go]] › 📜 [[Plans/Feature Plans/Port para Go/02 - Módulo Bible/_Index|Módulo Bible]] › **Repository (Interface)**

---

## O que é

O arquivo `repository.go`, dentro do mesmo pacote `internal/bible` do [[Plans/Feature Plans/Port para Go/02 - Módulo Bible/01 - Camada de Domínio|Domínio]]. Ele **não tem nenhuma lógica dentro** — só declara quais operações de busca de dado devem existir, sem dizer como elas são feitas. É uma lista de promessas: "quem quiser servir de repository do módulo Bible precisa saber fazer isso aqui".

Cada operação equivale a um método que já existe hoje em `bible.repository.ts` no TypeScript: buscar livros paginados, buscar um livro por slug/nome, buscar capítulos paginados, buscar um capítulo específico, buscar versículos paginados, buscar um versículo específico.

## Por que isso importa

Em Go, uma interface é satisfeita **implicitamente** — nenhum código precisa declarar "eu implemento essa interface" (ver [[Plans/Feature Plans/Port para Go/01 - Conceitos de Go|Conceitos de Go]]). Isso muda a dinâmica do que vimos no TypeScript: lá, a interface `iAuthRepository` existe, mas o `AuthServiceV1` importa a classe concreta direto, ignorando a interface — ela virou decoração. Aqui, como a interface é satisfeita de forma automática pelo compilador, é natural (e mais simples) fazer o [[Plans/Feature Plans/Port para Go/02 - Módulo Bible/04 - Camada de Service|Service]] depender só da interface, sem nem precisar importar o pacote onde mora a implementação real com Postgres.

## Onde essa interface mora

Fica no mesmo pacote do domínio (`internal/bible`), não no pacote da implementação (`internal/postgres/bible`). A regra prática: **quem define o contrato é quem vai usar o contrato**, não quem vai cumprir ele. É a camada de repository concreta (Postgres) que vai importar o pacote `bible` pra saber o que precisa implementar — nunca o contrário.

## O que essa página NÃO cobre

O corpo de cada método (a query SQL de verdade) mora na próxima camada — ver [[Plans/Feature Plans/Port para Go/02 - Módulo Bible/03 - Repository (Implementação Postgres)|Repository (Implementação Postgres)]].

---

◀ [[Plans/Feature Plans/Port para Go/02 - Módulo Bible/01 - Camada de Domínio|Domínio]] · [[Plans/Feature Plans/Port para Go/02 - Módulo Bible/03 - Repository (Implementação Postgres)|Repository (Implementação)]] ▶
