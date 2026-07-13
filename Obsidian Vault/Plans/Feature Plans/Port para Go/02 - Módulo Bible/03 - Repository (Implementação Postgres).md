---
title: "Módulo Bible — Repository (Implementação Postgres)"
section: "Plans"
subsection: "Feature Plans"
tags: [versum, plans, go, aprendizado, bible, repository, sql]
up: "[[Plans/Feature Plans/Port para Go/02 - Módulo Bible/_Index]]"
prev: "[[Plans/Feature Plans/Port para Go/02 - Módulo Bible/02 - Repository (Interface)]]"
next: "[[Plans/Feature Plans/Port para Go/02 - Módulo Bible/04 - Camada de Service]]"
related: []
depth: 3
---

# 🐘 Módulo Bible — Repository (Implementação Postgres)

🏠 [[_Index|Home]] › 🗺️ [[Plans/_Index|Plans]] › 🚀 [[Plans/Feature Plans/_Index|Feature Plans]] › 🐹 [[Plans/Feature Plans/Port para Go/_Index|Port para Go]] › 📜 [[Plans/Feature Plans/Port para Go/02 - Módulo Bible/_Index|Módulo Bible]] › **Repository (Implementação)**

---

## O que é

Um pacote separado, `internal/postgres/bible`, com um `struct` que guarda o pool de conexões (`*pgxpool.Pool`, o mesmo que [[Plans/Feature Plans/Port para Go/03 - Roadmap e Status|já foi construído]] no pacote `database`) e implementa, um por um, todos os métodos prometidos pela [[Plans/Feature Plans/Port para Go/02 - Módulo Bible/02 - Repository (Interface)|interface do repository]]. É aqui — e só aqui — que existe SQL escrito no projeto inteiro.

## O que cada método faz, em termos gerais

Sem entrar em SQL específico (isso já foi trabalhado na conversa que originou este plano — a ideia aqui é só situar o que existe, não repetir a query pronta):

- **Buscar livros paginados**: uma consulta que traz uma página de livros ordenados, mais uma segunda consulta separada que conta o total de livros — as duas rodam em paralelo.
- **Buscar um livro por slug ou nome**: uma consulta que aceita os dois formatos de busca ao mesmo tempo.
- **Buscar capítulos paginados de um livro**: primeiro acha o id do livro, depois busca os capítulos que pertencem a ele — dependência sequencial entre as duas.
- **Buscar um capítulo específico**: mesma ideia, mas travando também pelo número do capítulo.
- **Buscar versículos paginados de um capítulo**: precisa achar o capítulo certo primeiro, cruzando com o livro (é a primeira consulta que junta duas tabelas ao mesmo tempo).
- **Buscar um versículo específico**: a consulta mais profunda — cruza as três tabelas (livro, capítulo, versículo) numa query só.

## O que muda em relação a ter um ORM

Cada método aqui é responsável por converter manualmente o resultado da query pros campos do `struct` de domínio correspondente (`Book`, `Chapter`, `Verse`) — não existe nenhuma mágica preenchendo isso sozinho. Esse passo de "pegar o resultado da query e encaixar campo por campo" é o que mais treina o entendimento de exatamente o que uma query devolve, coluna por coluna, na ordem certa.

## Ligação com a interface

Esse `struct` nunca precisa declarar "eu implemento a interface do repository" — o compilador Go confirma isso sozinho, comparando se todos os métodos esperados existem com a assinatura certa (ver [[Plans/Feature Plans/Port para Go/01 - Conceitos de Go|Conceitos de Go]]). Se faltar um método, ou a assinatura estiver diferente, o erro só aparece no lugar que tenta *usar* esse `struct` no lugar da interface — ou seja, na [[Plans/Feature Plans/Port para Go/02 - Módulo Bible/06 - Montagem Final (main.go)|Montagem Final]], não aqui.

---

◀ [[Plans/Feature Plans/Port para Go/02 - Módulo Bible/02 - Repository (Interface)|Repository (Interface)]] · [[Plans/Feature Plans/Port para Go/02 - Módulo Bible/04 - Camada de Service|Service]] ▶
