---
title: "Módulo Bible — Camada de Service"
section: "Plans"
subsection: "Feature Plans"
tags: [versum, plans, go, aprendizado, bible, service]
up: "[[Plans/Feature Plans/Port para Go/02 - Módulo Bible/_Index]]"
prev: "[[Plans/Feature Plans/Port para Go/02 - Módulo Bible/03 - Repository (Implementação Postgres)]]"
next: "[[Plans/Feature Plans/Port para Go/02 - Módulo Bible/05 - Camada de Handler HTTP]]"
related: []
depth: 3
---

# ⚙️ Módulo Bible — Camada de Service

🏠 [[_Index|Home]] › 🗺️ [[Plans/_Index|Plans]] › 🚀 [[Plans/Feature Plans/_Index|Feature Plans]] › 🐹 [[Plans/Feature Plans/Port para Go/_Index|Port para Go]] › 📜 [[Plans/Feature Plans/Port para Go/02 - Módulo Bible/_Index|Módulo Bible]] › **Service**

---

## O que é

Um arquivo `service.go`, de volta no pacote `internal/bible` (junto do [[Plans/Feature Plans/Port para Go/02 - Módulo Bible/01 - Camada de Domínio|Domínio]] e da [[Plans/Feature Plans/Port para Go/02 - Módulo Bible/02 - Repository (Interface)|Interface do Repository]]). Camada fina: chama o repository, decide o que fazer quando o dado não existe, e devolve pro chamador. Sem SQL, sem HTTP.

## Ponto central: depende da interface, não da implementação

O `struct` do service guarda um campo do tipo da **interface** do repository (`BookRepository`, por exemplo), não do tipo concreto `internal/postgres/bible.BookRepository`. Na prática isso significa que o arquivo `service.go` nem precisa importar o pacote `internal/postgres/bible` — ele não sabe, e não precisa saber, que por trás da interface existe Postgres. Poderia ser qualquer outra fonte de dado (um arquivo, uma API externa, um banco diferente) que o `service.go` continuaria igual.

É a mesma ideia central do "inversão de dependência" citada no [[Plans/Feature Plans/Clean Architecture Refactor/00 - Diagnostico|Diagnóstico do refactor em TS]], só que aqui ela é natural de escrever — o tipo do campo já força essa direção, não depende de lembrar de "usar a interface e não a classe concreta" como disciplina manual.

## Regra de negócio que mora aqui

Comparando com `bible.v1.service.ts` no TypeScript: a única regra que existe hoje é "se o repository não achou nada, isso é um erro de domínio" (ex: `throw new Error("Book not found")`). Na versão Go, o equivalente é devolver um `error` sentinela — um valor de erro pré-criado e exportado (`ErrBookNotFound`, por exemplo), que a camada de cima consegue comparar (`errors.Is`) pra saber exatamente qual problema aconteceu, sem depender do texto da mensagem.

## Quem chama o service

A próxima camada — [[Plans/Feature Plans/Port para Go/02 - Módulo Bible/05 - Camada de Handler HTTP|Handler HTTP]] — é o único lugar que instancia e usa esse service.

---

◀ [[Plans/Feature Plans/Port para Go/02 - Módulo Bible/03 - Repository (Implementação Postgres)|Repository (Implementação)]] · [[Plans/Feature Plans/Port para Go/02 - Módulo Bible/05 - Camada de Handler HTTP|Handler HTTP]] ▶
