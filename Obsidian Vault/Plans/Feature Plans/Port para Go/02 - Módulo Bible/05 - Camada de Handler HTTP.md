---
title: "Módulo Bible — Camada de Handler HTTP"
section: "Plans"
subsection: "Feature Plans"
tags: [versum, plans, go, aprendizado, bible, http]
up: "[[Plans/Feature Plans/Port para Go/02 - Módulo Bible/_Index]]"
prev: "[[Plans/Feature Plans/Port para Go/02 - Módulo Bible/04 - Camada de Service]]"
next: "[[Plans/Feature Plans/Port para Go/02 - Módulo Bible/06 - Montagem Final (main.go)]]"
related: []
depth: 3
---

# 🌐 Módulo Bible — Camada de Handler HTTP

🏠 [[_Index|Home]] › 🗺️ [[Plans/_Index|Plans]] › 🚀 [[Plans/Feature Plans/_Index|Feature Plans]] › 🐹 [[Plans/Feature Plans/Port para Go/_Index|Port para Go]] › 📜 [[Plans/Feature Plans/Port para Go/02 - Módulo Bible/_Index|Módulo Bible]] › **Handler HTTP**

---

## O que é

Um arquivo `handler.go` (pacote `internal/bible`) com uma função por rota HTTP. Cada função: lê os parâmetros da requisição (parâmetros de caminho, query string de paginação), chama o método correspondente do [[Plans/Feature Plans/Port para Go/02 - Módulo Bible/04 - Camada de Service|Service]], e escreve a resposta em JSON.

Diferente do TypeScript, onde `bible.v1.controller.ts` (parseia request, chama service) e `bible.v1.route.ts` (registra a rota no framework) são dois arquivos separados, em Go — usando `net/http` puro em vez de um framework — as duas coisas tendem a ficar mais próximas uma da outra, porque não existe camada de framework separando "definição de rota" de "código que atende a rota".

## As seis rotas a portar

Mesmo conjunto que já existe em `bible.v1.route.ts`:

| Rota | O que faz |
|:--|:--|
| Listar livros (paginado) | |
| Obter um livro por slug/nome | |
| Listar capítulos de um livro (paginado) | |
| Obter um capítulo específico | |
| Listar versículos de um capítulo (paginado) | |
| Obter um versículo específico | |

## Erro de domínio vira código HTTP

Quando o [[Plans/Feature Plans/Port para Go/02 - Módulo Bible/04 - Camada de Service|Service]] devolve o erro sentinela de "não encontrado", é o handler quem decide transformar isso em `404`. É também o handler quem valida os parâmetros que vêm crus da URL (por exemplo, "número do capítulo" precisa ser um número positivo antes mesmo de perguntar pro service) — mesma responsabilidade que `parsePositiveInt` tem em `bible.v1.controller.ts` hoje.

## O que essa camada NÃO faz

Não decide regra de negócio (isso é do Service), e não sabe nada sobre SQL ou Postgres (isso é do Repository). Só sabe falar o protocolo HTTP: ler requisição, escrever resposta.

---

◀ [[Plans/Feature Plans/Port para Go/02 - Módulo Bible/04 - Camada de Service|Service]] · [[Plans/Feature Plans/Port para Go/02 - Módulo Bible/06 - Montagem Final (main.go)|Montagem Final]] ▶
