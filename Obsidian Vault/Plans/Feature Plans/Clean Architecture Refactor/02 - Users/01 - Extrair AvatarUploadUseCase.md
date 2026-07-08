---
title: "Extrair AvatarUploadUseCase do ProfileControllerV1"
section: "Plans"
subsection: "Feature Plans"
tags: [versum, plans, refactor, users, avatar, srp]
up: "[[Plans/Feature Plans/Clean Architecture Refactor/02 - Users/_Index]]"
prev: "[[Plans/Feature Plans/Clean Architecture Refactor/02 - Users/_Index]]"
next: "[[Plans/Feature Plans/Clean Architecture Refactor/02 - Users/02 - Extrair UserDataExportMapper]]"
related: ["[[Plans/Feature Plans/Clean Architecture Refactor/00 - Diagnostico]]"]
depth: 3
---

# Extrair AvatarUploadUseCase do ProfileControllerV1

🏠 [[_Index|Home]] › 🗺️ [[Plans/_Index|Plans]] › 🚀 [[Plans/Feature Plans/_Index|Feature Plans]] › 🏗️ [[Plans/Feature Plans/Clean Architecture Refactor/_Index|Clean Architecture Refactor]] › 👤 [[Plans/Feature Plans/Clean Architecture Refactor/02 - Users/_Index|Users]] › **Extrair AvatarUploadUseCase**

---

## Contexto

`ProfileControllerV1.uploadAvatar` (`apps/api/src/modules/users/controllers/profile.v1.controller.ts`, linhas 145-189) faz sozinho:

1. Ler o arquivo do multipart form (`c.req.parseBody()`)
2. Validar o arquivo (`assertValidAvatar`, de `apps/api/src/modules/users/utils/avatar-validation.ts`)
3. Chamar `service.assertProfileEditable` (regra de negócio)
4. Processar/redimensionar a imagem com sharp (`prepareAvatar`, de `apps/api/src/modules/users/utils/avatar-image.ts`)
5. Buscar o perfil antigo pra saber se já existe avatar (`service.getProfileByUserId`)
6. Apagar o avatar antigo do S3, se existir (`this.s3.destroyAvatar`)
7. Subir o avatar novo pro S3 (`this.s3.uploadAvatarWebp`)
8. Salvar a data de atualização do avatar no banco (`service.setAvatarUpdatedAt`)
9. Montar a resposta HTTP

`deleteAvatar` (linhas 191-212) tem o mesmo problema em menor escala: orquestra `service` e `S3Service` direto no controller.

**Por que isso é um problema:** o controller devia só traduzir HTTP para uma chamada de negócio e devolver a resposta. Aqui ele é, na prática, o "caso de uso" inteiro de troca de avatar — o que faz esse fluxo impossível de testar sem simular uma requisição HTTP completa (`Context` do Hono), e impossível de reusar se um dia existir outra forma de entrada (ex: um job admin que reprocessa avatares em lote).

## Objetivo

Uma classe `AvatarUploadUseCase` que recebe `ProfileServiceV1`, `S3Service` e as funções de `avatar-image.ts` via construtor (mesmo padrão de injeção manual já usado no resto do projeto), com dois métodos: `execute` (upload) e `remove` (delete). O controller passa a só: extrair o arquivo da requisição, chamar o caso de uso, formatar a resposta.

## Passo a passo

1. **Criar o arquivo do caso de uso** em `apps/api/src/modules/users/use-cases/avatar-upload.use-case.ts`. Essa é a primeira pasta `use-cases/` do módulo `users` — confirme se esse é o nome de pasta que faz sentido olhando `Obsidian Vault/Docs/Naming Convention.md`; se a convenção do projeto usar outro termo (ex: `interactors/`, `services/` mesmo), seguir o que já existe em vez de inventar um nome novo.

2. **Mover a lógica do passo 3 ao 8 de `uploadAvatar`** (validação de edição, resize, busca do perfil antigo, delete do S3 antigo, upload do novo, salvar `avatarUpdatedAt`) pro método `execute` do caso de uso. Esse método recebe `userId` e os `bytes` já validados (a validação de formato/tamanho do arquivo continua no controller — é validação de entrada HTTP, não regra de negócio) e devolve o `Profile` atualizado.

3. **Mover a lógica de `deleteAvatar`** (passos: buscar perfil, validar que tem avatar, apagar do S3, limpar no banco) pro método `remove` do caso de uso. Recebe `userId`, devolve o `Profile` atualizado.

4. **Simplificar `ProfileControllerV1.uploadAvatar`** pra: extrair o arquivo do form, chamar `assertValidAvatar`, chamar `avatarUploadUseCase.execute({ userId, bytes })`, montar a resposta com `toProfileResponse`. O método deve ficar pequeno o suficiente pra caber numa tela sem rolar.

5. **Simplificar `ProfileControllerV1.deleteAvatar`** de forma equivalente, chamando `avatarUploadUseCase.remove({ userId })`.

6. **Decidir o destino de `toProfileResponse`** (linhas 23-36 do controller). Esse método também usa `S3Service` (pra montar a URL assinada do avatar) fora do fluxo de upload/delete — ele monta a resposta de leitura, não de escrita. Pra esta tarefa, recomenda-se **deixá-lo no controller** (ele é genuinamente responsabilidade de apresentação HTTP, não de caso de uso), mas isso significa que `ProfileControllerV1` continua dependendo de `S3Service` pra leitura — o que é aceitável, diferente de depender dele pra orquestrar upload.

## Arquivos afetados

- **Criar:** `apps/api/src/modules/users/use-cases/avatar-upload.use-case.ts`
- **Criar:** `apps/api/src/modules/users/use-cases/avatar-upload.use-case.test.ts`
- **Modificar:** `apps/api/src/modules/users/controllers/profile.v1.controller.ts`

## Como testar

- Escrever testes do `AvatarUploadUseCase` mockando `ProfileServiceV1` e `S3Service` (mesmo padrão de mock usado em `apps/api/src/modules/users/services/profile.v1.service.test.ts`) — isso já é ganho imediato: hoje esse fluxo não tem teste isolado nenhum porque está preso no controller.
- Casos a cobrir no `execute`: perfil sem avatar anterior (não deve tentar apagar nada do S3), perfil com avatar anterior (deve apagar o antigo antes de subir o novo), perfil não editável (deve barrar antes de processar a imagem).
- Casos a cobrir no `remove`: perfil sem avatar (deve lançar erro, mesma regra que já existe hoje em `deleteAvatar` linha 198-200), perfil com avatar (deve apagar do S3 e limpar no banco).
- Rodar a suíte do módulo: `bun test apps/api/src/modules/users`.
- Teste manual: subir um avatar de verdade pela UI (ou via requisição direta na API) e confirmar que o arquivo aparece no S3/bucket configurado e que o avatar antigo some.

## Riscos

- `avatarUpdatedAt` é gerado com `new Date()` dentro do fluxo (linha 169 do controller original) — ao mover pro caso de uso, garantir que a mesma instância de `Date` é usada tanto no upload pro S3 quanto no `setAvatarUpdatedAt`, senão o timestamp salvo no banco pode não bater com o path do arquivo no S3 (o path é montado a partir de `avatarUpdatedAt`, ver `avatarPath` em `apps/api/src/infrastructure/s3/index.ts`).
- Se o apagar do avatar antigo falhar depois do upload do novo já ter subido, hoje isso já não é atômico (é uma sequência de chamadas, sem transação). Mover pro caso de uso não piora nem resolve isso — só deixar claro que não é escopo desta tarefa.

---

◀ [[Plans/Feature Plans/Clean Architecture Refactor/02 - Users/_Index|Users]] · [[Plans/Feature Plans/Clean Architecture Refactor/02 - Users/02 - Extrair UserDataExportMapper|Extrair UserDataExportMapper]] ▶
