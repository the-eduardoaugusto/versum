---
title: "Extrair UserDataExportMapper do UserServiceV1"
section: "Plans"
subsection: "Feature Plans"
tags: [versum, plans, refactor, users, lgpd, srp]
up: "[[Plans/Feature Plans/Clean Architecture Refactor/02 - Users/_Index]]"
prev: "[[Plans/Feature Plans/Clean Architecture Refactor/02 - Users/01 - Extrair AvatarUploadUseCase]]"
related: ["[[Plans/Feature Plans/Clean Architecture Refactor/00 - Diagnostico]]", "[[Plans/Compliance/LGPD Compliance]]"]
depth: 3
---

# Extrair UserDataExportMapper do UserServiceV1

🏠 [[_Index|Home]] › 🗺️ [[Plans/_Index|Plans]] › 🚀 [[Plans/Feature Plans/_Index|Feature Plans]] › 🏗️ [[Plans/Feature Plans/Clean Architecture Refactor/_Index|Clean Architecture Refactor]] › 👤 [[Plans/Feature Plans/Clean Architecture Refactor/02 - Users/_Index|Users]] › **Extrair UserDataExportMapper**

---

## Contexto

`UserServiceV1.exportUserData` (`apps/api/src/modules/users/services/user.v1.service.ts`, linhas 138-228 — 90 das 229 linhas do arquivo inteiro) busca os dados do usuário no repository e depois faz o mapeamento manual de **6 tipos de dado diferentes** (sessions, leituras da jornada, leituras de descoberta, marcações/anotações, curtidas, logs de consentimento) pro formato de exportação, com funções internas (`mapSessions`, `mapJourneyReadings`, `mapDiscoveryReadings`, `mapMarks`, `mapLikes`, `mapConsentLogs`) que usam `as` pra forçar tipo em dado que veio como `unknown`.

Esse recurso existe pra atender exportação de dados do usuário (provavelmente ligado ao direito de portabilidade da LGPD — ver [[Plans/Compliance/LGPD Compliance|LGPD Compliance]]).

**Por que isso é um problema:** formatar dado pra exportação não é a mesma responsabilidade de "gerenciar usuário" (criar, buscar, atualizar e-mail, deletar). É um trabalho de **mapper** (uma função/classe cujo único papel é converter um dado de um formato pro outro, sem regra de negócio nenhuma dentro) disfarçado de método de service. Toda vez que um campo novo precisar entrar na exportação (ex: adicionar um novo tipo de interação do usuário), quem for mexer vai abrir `UserServiceV1` e arriscar esbarrar em `deleteUser` ou `createUser` sem querer.

## Objetivo

Uma função (ou classe estática, sem estado) `UserDataExportMapper` que recebe os dados já buscados do repository (o retorno de `findByIdWithAllData`) e devolve o objeto formatado pronto pra exportação. Não faz I/O, não depende de repository — é transformação pura de dado, o que a torna trivial de testar sem mock nenhum.

`UserServiceV1.exportUserData` fica só: buscar o dado, checar se existe, chamar o mapper, devolver o resultado.

## Passo a passo

1. **Criar o arquivo do mapper** em `apps/api/src/modules/users/mappers/user-data-export.mapper.ts`.

2. **Mover as 6 funções internas** (`mapSessions`, `mapJourneyReadings`, `mapDiscoveryReadings`, `mapMarks`, `mapLikes`, `mapConsentLogs`) e o bloco de montagem do objeto final (linhas 205-227) pra esse arquivo, como uma função exportada — por exemplo `toExportUserData(data)` — que recebe o retorno de `findByIdWithAllData` e devolve `ExportUserData` (tipo já definido em `apps/api/src/modules/users/schemas/v1/users.v1.common.schema.ts`, reaproveitar o mesmo tipo).

3. **Tirar os `as unknown as {...}`** durante a mudança, se possível. Esses casts existem porque o retorno de `findByIdWithAllData` provavelmente não está tipado ponta a ponta hoje. Se der pra tipar o retorno do repository corretamente (ver o tipo de retorno de `findByIdWithAllData` em `apps/api/src/modules/users/repositories/user.repository.ts`), o mapper fica sem cast nenhum. Se o tipo do repository for grande demais pra mexer nesta tarefa, tudo bem manter o cast por enquanto — mas documentar com um comentário curto o porquê, não deixar solto.

4. **Simplificar `UserServiceV1.exportUserData`** pra buscar o dado, validar que existe, e chamar `toExportUserData(data)`.

## Arquivos afetados

- **Criar:** `apps/api/src/modules/users/mappers/user-data-export.mapper.ts`
- **Criar:** `apps/api/src/modules/users/mappers/user-data-export.mapper.test.ts`
- **Modificar:** `apps/api/src/modules/users/services/user.v1.service.ts`
- **Modificar (se existir):** `apps/api/src/modules/users/services/user.v1.service.test.ts` — os testes que hoje cobrem `exportUserData` fim-a-fim continuam válidos, mas os casos de borda de formatação (data nula, campo opcional ausente) devem migrar pro teste do mapper.

## Como testar

- Escrever teste do mapper puro: dado um objeto de entrada fixo (sem mock, sem repository), o `toExportUserData` sempre devolve o mesmo formato de saída — teste de tabela-verdade simples, sem setup nenhum.
- Cobrir casos de borda que hoje já existem no código: perfil nulo (linha 211, `data.profile ? {...} : null`), listas vazias/ausentes (`data.sessions ?? []`, etc. — linhas 219-226).
- Rodar a suíte do módulo: `bun test apps/api/src/modules/users`.
- Não precisa de teste manual — é transformação pura, os testes automatizados cobrem o comportamento inteiro.

## Riscos

- Esse endpoint provavelmente tem implicação de compliance (exportação de dado pessoal). Antes de mudar o formato de qualquer campo durante a refatoração, confirmar com quem cuida do tema LGPD no time que o formato de saída (`ExportUserData`) não pode mudar — a refatoração é só estrutural, o JSON que o usuário recebe deve ser byte-a-byte igual antes e depois.

---

◀ [[Plans/Feature Plans/Clean Architecture Refactor/02 - Users/01 - Extrair AvatarUploadUseCase|Extrair AvatarUploadUseCase]] · [[Plans/Feature Plans/Clean Architecture Refactor/02 - Users/_Index|Users]]
