---
title: "Value Objects para tipos de domínio"
section: "Plans"
subsection: "Feature Plans"
tags: [versum, plans, refactor, ddd, value-objects]
up: "[[Plans/Feature Plans/Clean Architecture Refactor/03 - Fundacao/_Index]]"
prev: "[[Plans/Feature Plans/Clean Architecture Refactor/03 - Fundacao/_Index]]"
next: "[[Plans/Feature Plans/Clean Architecture Refactor/03 - Fundacao/02 - Interfaces de Repository]]"
related: ["[[Plans/Feature Plans/Clean Architecture Refactor/00 - Diagnostico]]"]
depth: 3
---

# Value Objects para tipos de domínio

🏠 [[_Index|Home]] › 🗺️ [[Plans/_Index|Plans]] › 🚀 [[Plans/Feature Plans/_Index|Feature Plans]] › 🏗️ [[Plans/Feature Plans/Clean Architecture Refactor/_Index|Clean Architecture Refactor]] › 🧱 [[Plans/Feature Plans/Clean Architecture Refactor/03 - Fundacao/_Index|Fundação]] › **Value Objects**

---

## O que é um Value Object (pra quem nunca usou)

Um Value Object é um tipo que representa um valor de negócio com regra própria, em vez de um tipo genérico (`string`, `number`) ou uma linha de tabela do banco. Exemplo: em vez de um `email: string` solto que qualquer lugar do código pode atribuir qualquer string, existe um tipo `Email` que só pode ser criado se o valor for um e-mail válido — a validação mora dentro do próprio tipo, não espalhada em vários lugares que recebem `string`.

## Contexto

Hoje, todo tipo que representa uma entidade de negócio (`Session`, `Profile`, `User`) é gerado direto do schema do banco via Drizzle:

- `Session` — `apps/api/src/modules/auth/repositories/auth.types.repository.ts`, linha 1-8: `InferSelectModel<typeof sessions>`
- `Profile` — `apps/api/src/modules/users/repositories/profile.types.repository.ts`, mesmo padrão
- `User` — `apps/api/src/modules/users/repositories/user.types.repository.ts`, mesmo padrão

Isso quer dizer que o "tipo de domínio" é, literalmente, a forma da tabela SQL. Regra de negócio que devia estar encapsulada (ex: "e-mail sempre em minúsculo e sem espaço", que hoje é validação solta em `UserServiceV1.validateEmail`, `apps/api/src/modules/users/services/user.v1.service.ts` linhas 37-52) fica espalhada em vários services em vez de morar dentro de um tipo `Email`.

## Por que isso importa (e por que não é urgente)

Esse é o problema mais "acadêmico" dos identificados no diagnóstico — na prática, o código funciona, e reescrever todos os tipos de domínio pra Value Objects seria um esforço grande com ganho incerto num projeto deste tamanho. Por isso esta tarefa é **de menor prioridade** no [[Plans/Feature Plans/Clean Architecture Refactor/04 - Roadmap|Roadmap]] — é mais uma direção pra adotar aos poucos do que uma tarefa única pra fechar de uma vez.

## Objetivo (incremental, não tudo de uma vez)

Não trocar todos os tipos de uma vez. Em vez disso, criar Value Objects só pra valores que já têm regra de validação espalhada em mais de um lugar do código hoje — esses são os candidatos com ganho real:

1. **`Email`** — a validação de `UserServiceV1.validateEmail` (regex, tamanho máximo 255, normalização pra minúsculo) é regra de negócio que deveria morar num tipo `Email`, não solta num método privado de service. Candidato natural pra primeiro Value Object porque a regra já existe, só está no lugar errado.

2. **`Username`** — mesma situação em `ProfileServiceV1.validateUsername` (`apps/api/src/modules/users/services/profile.v1.service.ts`, linhas 37-114 concentram várias validações desse tipo: username, nome, bio).

## Passo a passo (pra cada Value Object, ex: `Email`)

1. **Criar o tipo** em um lugar compartilhado do módulo, ex: `apps/api/src/modules/users/domain/email.ts` (ou local que a convenção de pastas do projeto já sugerir — checar se existe um padrão de "domain" ou "value-objects" documentado em `Obsidian Vault/Docs/Naming Convention.md` antes de inventar um novo).

2. **Mover a validação** de dentro do service pro Value Object. O tipo deve recusar (lançar erro) na criação se o valor não for válido — assim, se um `Email` existe, ele é garantidamente válido, sem precisar revalidar em todo lugar que o recebe.

3. **Trocar o `string` solto pelo Value Object** nas assinaturas dos métodos que hoje recebem e-mail cru (`createUser`, `updateUserEmail`, etc. em `UserServiceV1`).

4. **Remover a validação duplicada** do service, já que agora ela só existe dentro do Value Object.

## Arquivos afetados (exemplo com Email)

- **Criar:** `apps/api/src/modules/users/domain/email.ts`
- **Criar:** `apps/api/src/modules/users/domain/email.test.ts`
- **Modificar:** `apps/api/src/modules/users/services/user.v1.service.ts` (remover `validateEmail`, trocar `string` por `Email` nas assinaturas)
- **Modificar:** qualquer schema Zod que hoje valide formato de e-mail na borda HTTP — decidir se a validação do Zod continua (validação de I/O, camada diferente) ou se passa a delegar pro Value Object.

## Como testar

- Teste do Value Object isolado: valores válidos são aceitos, valores inválidos lançam erro — sem mock, sem repository, teste puro.
- Ajustar os testes existentes de `UserServiceV1` que hoje testam `validateEmail` direto — essas asserções migram pro teste do Value Object.

## Riscos

- Fazer isso pra todos os tipos de uma vez é retrabalho grande demais pro ganho — reforçando: **só migrar valores que já têm regra de validação repetida ou espalhada**, não criar Value Object por criar.
- Trocar `string` por um tipo novo nas assinaturas de método é uma mudança que o TypeScript vai forçar a propagar por todo lugar que usa aquele método — fazer um valor por vez, com PR próprio, não tudo junto.

---

◀ [[Plans/Feature Plans/Clean Architecture Refactor/03 - Fundacao/_Index|Fundação]] · [[Plans/Feature Plans/Clean Architecture Refactor/03 - Fundacao/02 - Interfaces de Repository|Interfaces de Repository]] ▶
