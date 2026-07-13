---
title: "Módulo Bible — Camada de Domínio"
section: "Plans"
subsection: "Feature Plans"
tags: [versum, plans, go, aprendizado, bible, dominio]
up: "[[Plans/Feature Plans/Port para Go/02 - Módulo Bible/_Index]]"
prev: "[[Plans/Feature Plans/Port para Go/02 - Módulo Bible/_Index]]"
next: "[[Plans/Feature Plans/Port para Go/02 - Módulo Bible/02 - Repository (Interface)]]"
related: []
depth: 3
---

# 🧱 Módulo Bible — Camada de Domínio

🏠 [[_Index|Home]] › 🗺️ [[Plans/_Index|Plans]] › 🚀 [[Plans/Feature Plans/_Index|Feature Plans]] › 🐹 [[Plans/Feature Plans/Port para Go/_Index|Port para Go]] › 📜 [[Plans/Feature Plans/Port para Go/02 - Módulo Bible/_Index|Módulo Bible]] › **Domínio**

---

## O que mora aqui

Os arquivos `book.go`, `chapter.go` e `verse.go`, dentro do pacote `internal/bible`. Cada um define um `struct` — a versão Go de "o formato de um dado": os campos que um Livro, um Capítulo e um Versículo têm, e nada além disso. Nenhum dos três sabe o que é SQL, `pgx`, ou HTTP.

## Por que separado do banco

O `struct` `Book` **não** é gerado a partir da tabela `bible_books` — é escrito à mão, com só os campos que a aplicação precisa. Isso é diferente do TypeScript atual, onde `Session = InferSelectModel<typeof sessions>` faz o tipo de domínio ser literalmente a linha da tabela (problema descrito no [[Plans/Feature Plans/Clean Architecture Refactor/00 - Diagnostico|Diagnóstico do refactor em TS]]). Aqui, se uma coluna do banco mudar de nome, só o código que faz a leitura (a camada de repository) precisa mudar — o `struct Book` continua igual, e todo o resto do sistema que depende dele nem percebe.

## Regra de campo exportado

Todo campo do `struct` precisa começar com letra maiúscula (`ID`, `Name`, não `id`, `name`) — ver [[Plans/Feature Plans/Port para Go/01 - Conceitos de Go|Conceitos de Go]] pra entender por quê. Sem isso, dois problemas aparecem mais adiante: a camada de repository (que fica em outro pacote) não consegue preencher os campos, e a resposta HTTP sai vazia.

## Tipos próprios em vez de tipo solto

Quando um campo só pode assumir um conjunto pequeno e fixo de valores — como o "testamento" de um livro, que só pode ser "antigo" ou "novo" — vale a pena criar um tipo próprio pra ele (baseado em `string`) em vez de usar `string` pura com qualquer valor possível. Isso deixa o compilador ajudar: se um valor errado for usado nesse campo em algum lugar do código, some tipos de erro aparecem em tempo de compilação, antes de rodar. É um paralelo direto com a ideia de "Value Object" citada no [[Plans/Feature Plans/Clean Architecture Refactor/03 - Fundacao/01 - Value Objects|plano de refactor em TS]] — só que em Go isso é natural e barato de fazer, não exige criar uma classe inteira.

## Os três arquivos

| Arquivo | Representa | Campos esperados |
|:--|:--|:--|
| `book.go` | Um livro da Bíblia | id, ordem, nome, abreviação, testamento, total de capítulos |
| `chapter.go` | Um capítulo | id, id do livro a que pertence, número |
| `verse.go` | Um versículo | id, id do capítulo a que pertence, número, texto |

Nenhum desses três arquivos importa `internal/postgres/bible` nem qualquer coisa de banco — se algum dia precisar disso, é sinal de que algo foi colocado no lugar errado.

---

◀ [[Plans/Feature Plans/Port para Go/02 - Módulo Bible/_Index|Módulo Bible]] · [[Plans/Feature Plans/Port para Go/02 - Módulo Bible/02 - Repository (Interface)|Repository (Interface)]] ▶
