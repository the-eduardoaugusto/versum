---
title: "Módulo Bible — Montagem Final (main.go)"
section: "Plans"
subsection: "Feature Plans"
tags: [versum, plans, go, aprendizado, bible, main]
up: "[[Plans/Feature Plans/Port para Go/02 - Módulo Bible/_Index]]"
prev: "[[Plans/Feature Plans/Port para Go/02 - Módulo Bible/05 - Camada de Handler HTTP]]"
related: []
depth: 3
---

# 🔧 Módulo Bible — Montagem Final (main.go)

🏠 [[_Index|Home]] › 🗺️ [[Plans/_Index|Plans]] › 🚀 [[Plans/Feature Plans/_Index|Feature Plans]] › 🐹 [[Plans/Feature Plans/Port para Go/_Index|Port para Go]] › 📜 [[Plans/Feature Plans/Port para Go/02 - Módulo Bible/_Index|Módulo Bible]] › **Montagem Final**

---

## O que é

O arquivo `cmd/api/main.go` — o único lugar do projeto inteiro que conhece **todas** as camadas ao mesmo tempo (Domínio, Repository, Service, Handler) e decide como encaixar uma na outra. É o equivalente ao ponto em que, no TypeScript, um service recebe `new ConcreteRepository()` como valor padrão do construtor — só que aqui essa decisão fica isolada num único lugar, em vez de espalhada dentro de cada classe.

## Ordem de montagem

1. Cria a conexão com o banco (pacote `database`, [[Plans/Feature Plans/Port para Go/03 - Roadmap e Status|já pronto]]).
2. Cria o repository concreto — o `struct` do pacote `internal/postgres/bible` — passando o pool de conexões pra ele.
3. Cria o service, passando o repository concreto do passo 2. É neste momento que o service, mesmo esperando só a interface, recebe de fato uma implementação real com Postgres por trás.
4. Cria o handler, passando o service do passo 3.
5. Registra cada rota do handler no roteador HTTP (`net/http`).
6. Sobe o servidor, escutando numa porta.

## Por que só esse arquivo pode saber de tudo

Se qualquer camada de baixo (Domínio, Repository, Service) precisar importar algo de `cmd/api`, é sinal de inversão errada — a regra de negócio dependendo de detalhe de inicialização, quando deveria ser o contrário. `main.go` é o único ponto do projeto com permissão de "conhecer o projeto inteiro"; todo o resto só conhece a fatia que precisa pra fazer seu trabalho.

## Encerramento controlado

`main.go` também é responsável por fechar o pool de conexões (`Close()`, do pacote `database`) quando o programa for encerrado — normalmente escutando um sinal do sistema operacional (`Ctrl+C`, ou o sinal que a plataforma de deploy manda antes de desligar o processo). Esse é um conceito que ainda não foi trabalhado em nenhuma página anterior — fica marcado aqui como pendência de aprendizado quando chegar a hora.

---

◀ [[Plans/Feature Plans/Port para Go/02 - Módulo Bible/05 - Camada de Handler HTTP|Handler HTTP]] · 📜 [[Plans/Feature Plans/Port para Go/02 - Módulo Bible/_Index|Módulo Bible]]
