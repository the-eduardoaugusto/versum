---
title: "Port para Go — Conceitos de Go"
section: "Plans"
subsection: "Feature Plans"
tags: [versum, plans, go, aprendizado, glossario]
up: "[[Plans/Feature Plans/Port para Go/_Index]]"
prev: "[[Plans/Feature Plans/Port para Go/00 - Contexto e Objetivo]]"
next: "[[Plans/Feature Plans/Port para Go/02 - Módulo Bible/_Index]]"
related: []
depth: 2
---

# 📖 Port para Go — Conceitos de Go

🏠 [[_Index|Home]] › 🗺️ [[Plans/_Index|Plans]] › 🚀 [[Plans/Feature Plans/_Index|Feature Plans]] › 🐹 [[Plans/Feature Plans/Port para Go/_Index|Port para Go]] › **Conceitos de Go**

---

Página viva — vai ganhando entrada nova conforme um conceito novo aparece durante o port. Serve pra consultar quando esquecer o que algum termo significa, sem precisar voltar à conversa onde ele foi explicado a primeira vez.

## Organização do projeto

- **Módulo (`go.mod`)** — o arquivo que declara "isso aqui é um projeto Go" e lista as dependências externas, parecido com o `package.json` do Node. Cada projeto Go tem só um `go.mod` na raiz.
- **Pacote (`package`)** — a unidade de organização de código em Go, equivalente a uma pasta. Todo arquivo `.go` começa declarando a que pacote pertence (`package bible`, por exemplo). Arquivos do mesmo pacote enxergam os campos e funções uns dos outros livremente, mesmo sem exportar nada.
- **`internal/`** — uma pasta com nome especial: qualquer pacote dentro dela só pode ser importado por código do mesmo projeto, nunca por outro projeto Go externo. É o mecanismo de "isso é interno, não é uma biblioteca pública" — não existe em JavaScript/TypeScript, lá isso é resolvido só por convenção (não exportar do `index.ts`).

## Exportado vs. não-exportado (a versão Go de "público"/"privado")

Go não tem palavras-chave como `public`/`private`. A regra é a **primeira letra do nome**:

- Começa com **letra maiúscula** → exportado, visível de fora do pacote (ex: `Book`, `FindBooksPaginated`).
- Começa com **letra minúscula** → não-exportado, só visível dentro do mesmo pacote (ex: `book`, `findBooksPaginated`).

Isso vale pra tipos, funções, métodos e campos de `struct` — cada um decide sua própria visibilidade pela própria letra inicial, não existe um "bloco privado" como em outras linguagens. Um efeito colateral importante: bibliotecas que fazem alguma forma de reflexão (como `encoding/json`, usada pra montar resposta HTTP) **ignoram silenciosamente campos não-exportados** — nenhum erro aparece, o campo só some do resultado. Por isso structs de domínio que vão virar resposta HTTP ou ser lidos por outro pacote precisam de campos exportados.

## Erros não são exceção

Go não tem `try`/`catch`. Toda função que pode falhar devolve **dois valores**: o resultado e um `error` — por convenção, o erro é sempre o último valor de retorno. Quem chama é obrigado a decidir o que fazer com esse `error` na mesma linha, tipicamente:

```
resultado, err := algumaFuncao()
if err != nil {
    return err
}
```

Não existe stack de exceção subindo sozinha — se uma função não trata o erro, ela precisa devolvê-lo explicitamente pra quem chamou ela, e assim por diante. Por isso é comum ver `if err != nil` repetido várias vezes seguidas em código Go — não é falta de abstração, é o idioma da linguagem.

## `context.Context`

Um valor que representa "o prazo/cancelamento amarrado a essa operação". Toda função que faz operação de rede (banco de dados, chamada HTTP) recebe um `context.Context` como primeiro parâmetro, por convenção. Se o contexto for cancelado — por timeout, ou porque quem pediu a operação desistiu — a operação em andamento é interrompida no meio, em vez de continuar rodando sem necessidade. Não existe equivalente direto no TypeScript do projeto hoje.

## Receiver: função presa a um tipo (o "método" do Go)

Go não tem `class`. Pra algo se comportar como "método de um objeto", declara-se uma função com um **receiver** — um parâmetro extra antes do nome da função, entre parênteses:

```
func (db *Database) Close() { ... }
```

Isso permite chamar `db.Close()`. A diferença entre receiver com `*` (ponteiro, ex: `*Database`) e sem `*` (valor, ex: `Database`) importa: com ponteiro, o método pode alterar o dado original; sem ponteiro, o método recebe uma cópia e qualquer alteração se perde ao sair da função. Regra prática usada neste projeto: se o método precisa alterar o struct (como o `Connect` guardando o `pool` dentro do `Database`), o receiver é ponteiro.

## Interface é satisfeita implicitamente

Diferente do TypeScript (`class X implements Y`), em Go **nenhuma declaração explícita é necessária**. Se um `struct` tem todos os métodos que uma interface pede, com a assinatura exata, ele já serve como aquele tipo de interface automaticamente — o compilador confere isso sozinho, sem precisar escrever `implements` em lugar nenhum. É o motivo pelo qual, no port, a interface do repository pode viver junto do domínio (pacote `bible`) enquanto a implementação concreta mora em outro pacote (`postgres/bible`) sem que os dois precisem "se conhecer" formalmente — só a implementação precisa importar o pacote do domínio pra saber o formato dos dados, nunca o contrário.

## Ferramentas usadas até agora

- **[`golang-migrate`](https://github.com/golang-migrate/migrate)** — CLI que aplica/reverte arquivos SQL numerados (`NNNNNN_nome.up.sql` / `.down.sql`), guardando o progresso numa tabela própria (`schema_migrations`) dentro do banco.
- **[`pgx`](https://github.com/jackc/pgx)** — driver de conexão com PostgreSQL. O projeto usa o pacote `pgxpool` dele especificamente, que gerencia um **pool de conexões** (várias conexões abertas e reaproveitadas, em vez de abrir uma nova a cada query).

---

◀ [[Plans/Feature Plans/Port para Go/00 - Contexto e Objetivo|Contexto e Objetivo]] · [[Plans/Feature Plans/Port para Go/02 - Módulo Bible/_Index|Módulo Bible]] ▶
