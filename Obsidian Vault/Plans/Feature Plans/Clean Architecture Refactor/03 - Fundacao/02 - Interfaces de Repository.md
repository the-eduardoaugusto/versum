---
title: "Interfaces de Repository (Inversão de Dependência real)"
section: "Plans"
subsection: "Feature Plans"
tags: [versum, plans, refactor, ddd, dip, repository]
up: "[[Plans/Feature Plans/Clean Architecture Refactor/03 - Fundacao/_Index]]"
prev: "[[Plans/Feature Plans/Clean Architecture Refactor/03 - Fundacao/01 - Value Objects]]"
next: "[[Plans/Feature Plans/Clean Architecture Refactor/03 - Fundacao/03 - Domain Events]]"
related: ["[[Plans/Feature Plans/Clean Architecture Refactor/00 - Diagnostico]]"]
depth: 3
---

# Interfaces de Repository (Inversão de Dependência real)

🏠 [[_Index|Home]] › 🗺️ [[Plans/_Index|Plans]] › 🚀 [[Plans/Feature Plans/_Index|Feature Plans]] › 🏗️ [[Plans/Feature Plans/Clean Architecture Refactor/_Index|Clean Architecture Refactor]] › 🧱 [[Plans/Feature Plans/Clean Architecture Refactor/03 - Fundacao/_Index|Fundação]] › **Interfaces de Repository**

---

## O que é Inversão de Dependência (pra quem nunca usou)

É o "D" do SOLID. A ideia: a regra de negócio (service) não deveria depender da implementação concreta de quem busca/salva dado (repository) — deveria depender de uma interface (um contrato). Assim, dá pra trocar a implementação real por uma falsa em teste, ou trocar de banco no futuro, sem tocar no service.

## Contexto

O projeto já tem interfaces de repository em alguns módulos:

- `iAuthRepository` — `apps/api/src/modules/auth/repositories/auth.types.repository.ts`, linhas 23-56, implementada por `AuthRepository`
- `ConsentLogsRepo` — módulo `consent-logs`, mesmo padrão

O problema: **essas interfaces existem mas não são usadas pra desacoplar nada.** `AuthServiceV1` (`apps/api/src/modules/auth/services/auth.v1.service.ts`, linha 11) importa `AuthRepository` — a classe concreta — não `iAuthRepository`. `BibleServiceV1` nem tem interface, acopla direto em `BibleRepository`. Ou seja: a interface é só um tipo decorativo, o service continua amarrado à implementação concreta do Drizzle.

Isso não impede nada hoje porque os testes já mockam a classe concreta inteira (o TypeScript permite passar um objeto com os métodos certos, mock estrutural). Mas é uma inconsistência: existe um contrato formal (`interface`) que ninguém respeita, o que confunde quem lê o código pela primeira vez — parece que tem DIP, mas não tem.

## Objetivo

Decisão a tomar antes de mexer em qualquer código: **escolher entre duas saídas**, não fazer as duas.

### Opção A — Usar as interfaces que já existem (recomendada, menor esforço)

Trocar o tipo do parâmetro `repository` no construtor dos services pra apontar pra interface (`iAuthRepository`) em vez da classe concreta (`AuthRepository`). A classe concreta continua sendo o valor default (`repository ?? new AuthRepository()`), só o *tipo* do parâmetro muda. Replicar esse padrão nos módulos que ainda não têm interface (`bible`, `users`).

### Opção B — Remover as interfaces que não são usadas (menor esforço ainda, mas abre mão do DIP)

Se o time decidir que não vale o custo de manter interface + implementação em sincronia pra um projeto deste tamanho, apagar `iAuthRepository` e `ConsentLogsRepo` e assumir que o acoplamento a classes concretas é uma escolha consciente. Isso é uma opção legítima — nem todo projeto precisa de DIP formal — mas precisa ser uma decisão explícita, documentada aqui, não um esquecimento.

**Este plano recomenda a Opção A**, porque o custo de manter é baixo (a interface já existe, só falta ser referenciada no tipo certo) e o ganho aparece na hora de escrever teste: com a interface valendo de verdade, dá pra criar um fake simples que implementa `iAuthRepository` sem precisar herdar/mockar a classe inteira do Drizzle.

## Passo a passo (Opção A)

1. **Módulo Auth** — em `auth.v1.service.ts` (ou nos services novos, se a tarefa [[Plans/Feature Plans/Clean Architecture Refactor/01 - Auth/01 - Separar AuthServiceV1|Separar AuthServiceV1]] já tiver rodado), trocar o tipo do parâmetro `repository` de `AuthRepository` pra `iAuthRepository` no construtor.

2. **Módulo Consent Logs** — mesma troca em `consent-log.v1.service.ts`, tipo do parâmetro pra `ConsentLogsRepo`.

3. **Módulo Bible** — criar uma interface `iBibleRepository` a partir dos métodos públicos que `BibleRepository` já tem hoje (`apps/api/src/modules/bible/repositories/bible.repository.ts`), e trocar o tipo do parâmetro em `BibleServiceV1`.

4. **Módulo Users** — mesma coisa pra `UserRepository` e `ProfileRepository`: criar `iUserRepository` e `iProfileRepository`, trocar o tipo nos services correspondentes.

5. **Confirmar que a suíte de testes inteira continua passando** sem nenhuma mudança de comportamento — essa tarefa só troca tipos, não lógica.

## Arquivos afetados

- **Modificar:** `apps/api/src/modules/auth/services/auth.v1.service.ts` (ou os arquivos resultantes de [[Plans/Feature Plans/Clean Architecture Refactor/01 - Auth/01 - Separar AuthServiceV1|Separar AuthServiceV1]])
- **Modificar:** `apps/api/src/modules/consent-logs/services/consent-log.v1.service.ts`
- **Criar:** `apps/api/src/modules/bible/repositories/bible.types.repository.ts` (se não existir — checar antes de criar)
- **Modificar:** `apps/api/src/modules/bible/services/bible.v1.service.ts`
- **Criar/Modificar:** `apps/api/src/modules/users/repositories/user.types.repository.ts` e `profile.types.repository.ts` (adicionar as interfaces, se não existirem)
- **Modificar:** `apps/api/src/modules/users/services/user.v1.service.ts` e `profile.v1.service.ts`

## Como testar

- Nenhum teste deveria precisar mudar de comportamento — só de tipo. Se algum teste quebrar, é sinal de que a interface está incompleta (faltando um método que o service usa) — corrigir a interface, não o service.
- Rodar a suíte inteira: `bun test`.
- Rodar `tsc --noEmit` (regra do projeto, ver `AGENTS.md`) — essa tarefa é praticamente só troca de tipo, então o compilador é o principal validador aqui.

## Riscos

- Baixo risco — é uma mudança de tipo, não de lógica, então o TypeScript pega qualquer método que a interface não cubra antes mesmo de rodar teste.
- O risco real é de escopo: é tentador, no meio dessa tarefa, começar a "melhorar" os métodos das interfaces (renomear, adicionar parâmetro). Não fazer isso aqui — esta tarefa é só sobre inversão de dependência, não sobre desenho de API do repository.

---

◀ [[Plans/Feature Plans/Clean Architecture Refactor/03 - Fundacao/01 - Value Objects|Value Objects]] · [[Plans/Feature Plans/Clean Architecture Refactor/03 - Fundacao/03 - Domain Events|Domain Events]] ▶
