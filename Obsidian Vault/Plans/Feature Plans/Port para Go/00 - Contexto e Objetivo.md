---
title: "Port para Go — Contexto e Objetivo"
section: "Plans"
subsection: "Feature Plans"
tags: [versum, plans, go, aprendizado]
up: "[[Plans/Feature Plans/Port para Go/_Index]]"
prev: "[[Plans/Feature Plans/Port para Go/_Index]]"
next: "[[Plans/Feature Plans/Port para Go/01 - Conceitos de Go]]"
related: []
depth: 2
---

# 📋 Port para Go — Contexto e Objetivo

🏠 [[_Index|Home]] › 🗺️ [[Plans/_Index|Plans]] › 🚀 [[Plans/Feature Plans/_Index|Feature Plans]] › 🐹 [[Plans/Feature Plans/Port para Go/_Index|Port para Go]] › **Contexto e Objetivo**

---

## Por que esse projeto existe

O objetivo principal é **aprender Go** — sintaxe, biblioteca padrão (`stdlib`), goroutines, o jeito idiomático de organizar código. Portar a API pra Go é o exercício prático escolhido pra isso, não uma necessidade técnica: a API atual em TypeScript funciona bem e o plano [[Plans/Feature Plans/Clean Architecture Refactor/_Index|Clean Architecture Refactor]] já cobre os problemas de arquitetura dela, sem precisar trocar de linguagem.

**Por que isso é seguro de fazer agora:** a aplicação ainda não foi lançada — está em pré-alpha, sem usuário real. Não existe risco de quebrar produção, não existe prazo, não existe necessidade de manter duas versões sincronizadas. Se o port não avançar além do módulo `bible`, não tem problema nenhum — o valor já foi extraído no aprendizado.

## Decisões já tomadas

Essas decisões foram conversadas e valem pra qualquer módulo que for portado, não só o `bible`:

- **Sem ORM.** Query SQL é escrita à mão, usando o driver [`pgx`](https://github.com/jackc/pgx) direto — sem `sqlc`, sem `gorm`, sem query builder. O objetivo é aprender SQL de verdade, não esconder ele atrás de uma abstração.
- **Migrations com [`golang-migrate`](https://github.com/golang-migrate/migrate).** Cada tabela nasce em sua própria migration numerada (ver [[Plans/Feature Plans/Port para Go/03 - Roadmap e Status|Roadmap]] pra status atual), nunca uma migration monolítica com várias tabelas juntas — fica mais fácil alterar uma tabela no futuro sem mexer nas outras.
- **Sem framework HTTP.** `net/http` da própria `stdlib` — o Go moderno (1.22+) já roteia por método e caminho nativamente, sem precisar de Gin, Echo ou similares. O objetivo aqui também é aprender a base antes de qualquer abstração em cima dela.
- **Organização por camada, dentro de cada módulo** — domínio, repository (contrato + implementação separados) e service continuam existindo, só que usando os mecanismos do próprio Go (pacotes, interfaces implícitas) em vez dos padrões manuais que o TypeScript usa hoje. Detalhe completo em [[Plans/Feature Plans/Port para Go/02 - Módulo Bible/_Index|Módulo Bible]].

## Por que começar pelo módulo `bible`

`bible` foi escolhido de propósito como primeiro módulo: é só leitura (nenhum `INSERT`/`UPDATE`/`DELETE` na aplicação, só consulta), não tem autenticação, não depende de nenhum outro módulo. Isso deixa a complexidade nova (sintaxe de Go, SQL puro, `pgx`) isolada, sem competir com complexidade de negócio ao mesmo tempo.

## O que este plano NÃO é

- Não é uma promessa de que a API inteira será reescrita em Go. Pode parar no `bible` e ficar só nisso.
- Não substitui nem cancela o [[Plans/Feature Plans/Clean Architecture Refactor/_Index|Clean Architecture Refactor]] — os dois planos são independentes, cada um resolve um problema diferente (aprendizado vs. arquitetura do código existente).
- Não tem prazo. Cada página de progresso deve ser atualizada conforme o trabalho avança, sem pressa de terminar.

---

◀ [[Plans/Feature Plans/Port para Go/_Index|Port para Go]] · [[Plans/Feature Plans/Port para Go/01 - Conceitos de Go|Conceitos de Go]] ▶
