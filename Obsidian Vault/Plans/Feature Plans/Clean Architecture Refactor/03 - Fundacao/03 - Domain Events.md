---
title: "Domain Events — onde fariam sentido"
section: "Plans"
subsection: "Feature Plans"
tags: [versum, plans, refactor, ddd, domain-events]
up: "[[Plans/Feature Plans/Clean Architecture Refactor/03 - Fundacao/_Index]]"
prev: "[[Plans/Feature Plans/Clean Architecture Refactor/03 - Fundacao/02 - Interfaces de Repository]]"
related: ["[[Plans/Feature Plans/Clean Architecture Refactor/00 - Diagnostico]]", "[[Plans/Feature Plans/Clean Architecture Refactor/01 - Auth/01 - Separar AuthServiceV1]]"]
depth: 3
---

# Domain Events — onde fariam sentido

🏠 [[_Index|Home]] › 🗺️ [[Plans/_Index|Plans]] › 🚀 [[Plans/Feature Plans/_Index|Feature Plans]] › 🏗️ [[Plans/Feature Plans/Clean Architecture Refactor/_Index|Clean Architecture Refactor]] › 🧱 [[Plans/Feature Plans/Clean Architecture Refactor/03 - Fundacao/_Index|Fundação]] › **Domain Events**

---

## O que é um Domain Event (pra quem nunca usou)

É um registro de "algo aconteceu" no domínio (ex: `UserCreated`, `AvatarUpdated`) que outras partes do sistema podem reagir sem que quem disparou o evento precise saber quem está ouvindo. Serve pra desacoplar efeito colateral (enviar e-mail de boas-vindas, limpar arquivo antigo, registrar log) da ação principal que causou o efeito.

## Por que esta página não é uma tarefa de implementação

**Este plano não propõe montar um Event Bus agora.** Adicionar essa peça de infraestrutura (fila de eventos, handlers assíncronos, garantia de entrega) é um investimento grande que só compensa quando o número de efeitos colaterais acoplados já dói de verdade. Hoje o projeto tem poucos pontos assim — vale só **documentar onde a dor já existe**, pra quando o time decidir que vale a pena, não ter que redescobrir os pontos do zero.

## Onde a dor já aparece hoje

### 1. Criação de usuário durante login por magic link

`AuthServiceV1.createSessionWithMagicLink` (`apps/api/src/modules/auth/services/auth.v1.service.ts`, linhas 117-121) cria um usuário novo se o e-mail do magic link ainda não tiver conta — inline, dentro do fluxo de autenticação. Isso já foi citado na tarefa [[Plans/Feature Plans/Clean Architecture Refactor/01 - Auth/01 - Separar AuthServiceV1|Separar AuthServiceV1]].

Se no futuro precisar disparar algo quando um usuário é criado pela primeira vez (e-mail de boas-vindas, criar registro em outro módulo, analytics de cadastro), um evento `UserCreated` evitaria que o módulo `auth` precisasse saber sobre essas outras responsabilidades — ele só dispara o evento, quem quiser reage.

### 2. Registro de consentimento (LGPD)

`ProfileServiceV1` importa `ConsentLogsRepository` direto (acoplamento cruzado entre os módulos `users` e `consent-logs`). Um evento `ConsentGranted`/`ConsentRevoked` desacoplaria essa dependência — o módulo que trata de perfil dispararia o evento, e o módulo de consent-logs (ou qualquer outro que precise saber) reagiria de forma independente. Ver [[Plans/Compliance/LGPD Compliance|LGPD Compliance]] pra contexto de por que esse registro existe.

### 3. Troca de avatar

Hoje, apagar o avatar antigo do S3 acontece de forma síncrona, no meio do fluxo de upload (ver [[Plans/Feature Plans/Clean Architecture Refactor/02 - Users/01 - Extrair AvatarUploadUseCase|Extrair AvatarUploadUseCase]]). Um evento `AvatarUpdated`, disparado depois que o novo avatar já foi salvo com sucesso, permitiria mover a limpeza do arquivo antigo pra um processo assíncrono — o usuário não fica esperando a resposta HTTP até o S3 confirmar o delete do arquivo velho.

## Quando reconsiderar isso

Vale voltar nesta página e transformar num plano de implementação de verdade quando acontecer qualquer um destes sinais:

- Mais de um efeito colateral precisar ser adicionado no mesmo fluxo (ex: precisar mandar e-mail de boas-vindas E registrar analytics quando um usuário é criado — dois efeitos colaterais já é sinal de que inline não escala mais).
- Um módulo começar a importar repository de outro módulo em mais de um lugar (hoje só acontece pontualmente, ex: `ProfileServiceV1` → `ConsentLogsRepository`).
- Necessidade real de processamento assíncrono (fila) que hoje não existe no projeto.

Até lá, a recomendação é manter as chamadas diretas entre services/repositories como estão — é mais simples de entender e debugar, e simplicidade explícita vale mais que desacoplamento especulativo.

---

◀ [[Plans/Feature Plans/Clean Architecture Refactor/03 - Fundacao/02 - Interfaces de Repository|Interfaces de Repository]] · [[Plans/Feature Plans/Clean Architecture Refactor/03 - Fundacao/_Index|Fundação]]
