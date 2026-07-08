---
title: "Separar AuthServiceV1 em MagicLinkService e SessionService"
section: "Plans"
subsection: "Feature Plans"
tags: [versum, plans, refactor, auth, srp]
up: "[[Plans/Feature Plans/Clean Architecture Refactor/01 - Auth/_Index]]"
prev: "[[Plans/Feature Plans/Clean Architecture Refactor/01 - Auth/_Index]]"
related: ["[[Plans/Feature Plans/Clean Architecture Refactor/00 - Diagnostico]]"]
depth: 3
---

# Separar AuthServiceV1 em MagicLinkService e SessionService

🏠 [[_Index|Home]] › 🗺️ [[Plans/_Index|Plans]] › 🚀 [[Plans/Feature Plans/_Index|Feature Plans]] › 🏗️ [[Plans/Feature Plans/Clean Architecture Refactor/_Index|Clean Architecture Refactor]] › 🔐 [[Plans/Feature Plans/Clean Architecture Refactor/01 - Auth/_Index|Auth]] › **Separar AuthServiceV1**

---

## Contexto

`AuthServiceV1` (`apps/api/src/modules/auth/services/auth.v1.service.ts`) tem 225 linhas e faz 4 coisas que não têm relação direta entre si:

1. **Criar e enviar magic link** — métodos `createMagicLink` (linha 33) e `sendMagicLink` (linha 52). Gera token, faz hash com argon2, lê um arquivo HTML do disco (`Bun.file("src/assets/html/magic-link.html")`, linha 60) e dispara e-mail via `EmailProvider`.
2. **Autenticar com magic link e criar sessão** — método `createSessionWithMagicLink` (linha 70). Valida o token do magic link E cria a sessão do usuário no mesmo método.
3. **Revalidar/rotacionar sessão** — método `refreshSession` (linha 141).
4. **Revogar sessão (logout)** — método `revokeSession` (linha 196).

**Por que isso é um problema:** se amanhã alguém precisar mudar o template do e-mail do magic link, vai mexer numa classe que também é responsável por rotação de sessão — arriscando quebrar login de usuários já autenticados por causa de uma mudança que não tinha nada a ver com sessão. São dois "motivos de mudança" diferentes morando na mesma classe, o que viola o Princípio de Responsabilidade Única (o "S" do SOLID).

Quem usa `AuthServiceV1` hoje: `AuthControllerV1` (`apps/api/src/modules/auth/controllers/auth.v1.controller.ts`), que chama `createMagicLink`, `sendMagicLink`, `createSessionWithMagicLink` e `revokeSession`. O middleware de autenticação (`apps/api/src/middlewares/auth.middleware.ts`) provavelmente usa `refreshSession` — confirme isso antes de mexer (passo 1 abaixo).

## Objetivo

Duas classes, cada uma com um motivo de mudança só:

- **`MagicLinkService`** — dono de tudo que envolve gerar, enviar e validar magic link. Métodos: `createMagicLink`, `sendMagicLink`, e a parte de `createSessionWithMagicLink` que valida o token (não a parte que cria a sessão).
- **`SessionService`** — dono de tudo que envolve sessão já existente. Métodos: criar sessão pra um usuário (recebe o `userId` já resolvido, não lida com magic link), `refreshSession`, `revokeSession`.

`AuthControllerV1` passa a depender das duas classes em vez de uma só. O fluxo de "autenticar com magic link" fica assim: o controller chama `MagicLinkService` pra validar o token e descobrir o e-mail, depois chama `SessionService` pra criar a sessão — a orquestração entre os dois passa a ser do controller (ou de um pequeno caso de uso, se o controller ficar poluído), não de um service monolítico.

## Passo a passo

1. **Mapear todo mundo que usa `AuthServiceV1` hoje.** Buscar por `AuthServiceV1` e por `new AuthServiceV1(` no projeto inteiro (não só no módulo auth — o service de purge, por exemplo, pode depender dele). Anotar cada método usado por cada consumidor antes de mexer em qualquer coisa.

2. **Criar `MagicLinkService`** em `apps/api/src/modules/auth/services/magic-link.v1.service.ts`. Mover pra lá: `createMagicLink`, `sendMagicLink`, e o trecho de `createSessionWithMagicLink` que resolve e valida o token de magic link (as validações de expiração/uso/invalidação e o `argon2.verify`). Esse service continua dependendo de `AuthRepository` (pra buscar/invalidar o magic link) e de `EmailProvider`.

3. **Criar `SessionService`** em `apps/api/src/modules/auth/services/session.v1.service.ts`. Mover pra lá: a parte de `createSessionWithMagicLink` que cria a sessão a partir de um `userId` já resolvido, `refreshSession`, `revokeSession`, e o helper `generateRandomToken` (linha 216 — usado tanto pra token de sessão quanto de magic link; **duplicar** essa função pequena nas duas classes é aceitável e mais simples do que criar um módulo compartilhado só pra ela — ver `Obsidian Vault/Rules/` se houver uma regra específica sobre isso).

4. **Decidir onde fica a criação do usuário.** Hoje, se o e-mail do magic link não tem usuário associado, `createSessionWithMagicLink` cria um usuário novo (linhas 113-121) usando `UserRepository` direto dentro do fluxo de auth. Isso é uma decisão de negócio (auto-cadastro no primeiro login) que mistura módulos (`auth` decidindo sobre `users`). Pra esta tarefa, a recomendação mínima é manter esse comportamento, só movendo-o pra dentro de `SessionService` (que já vai orquestrar a criação da sessão) — sem tentar resolver o acoplamento entre módulos agora. Se quiser resolver isso também, ver [[Plans/Feature Plans/Clean Architecture Refactor/03 - Fundacao/03 - Domain Events|Domain Events]] pra uma proposta de como desacoplar isso no futuro.

5. **Atualizar `AuthControllerV1`** pra instanciar e usar `MagicLinkService` e `SessionService` no lugar de `AuthServiceV1`. Cada método do controller (`authenticateWithMagicLink`, `createAndSendMagicLink`, `logout`) deve deixar claro, só de ler o código, qual dos dois services está sendo usado em cada linha.

6. **Atualizar qualquer outro consumidor** identificado no passo 1 (ex: middleware de auth, se ele usar `refreshSession`).

7. **Apagar `auth.v1.service.ts`** depois de confirmar que nada mais importa dele.

## Arquivos afetados

- **Criar:** `apps/api/src/modules/auth/services/magic-link.v1.service.ts`
- **Criar:** `apps/api/src/modules/auth/services/session.v1.service.ts`
- **Criar:** `apps/api/src/modules/auth/services/magic-link.v1.service.test.ts`
- **Criar:** `apps/api/src/modules/auth/services/session.v1.service.test.ts`
- **Modificar:** `apps/api/src/modules/auth/controllers/auth.v1.controller.ts`
- **Modificar:** qualquer arquivo encontrado no passo 1 (provavelmente `apps/api/src/middlewares/auth.middleware.ts`)
- **Apagar:** `apps/api/src/modules/auth/services/auth.v1.service.ts`
- **Apagar:** `apps/api/src/modules/auth/services/auth.v1.service.test.ts` (se existir — os testes migram pros dois arquivos novos, não somem)

## Como testar

- Os testes atuais de `AuthServiceV1` (se existirem) devem ser divididos entre os dois arquivos novos, seguindo o padrão de mock de repository já usado no projeto (ver `apps/api/src/modules/users/services/profile.v1.service.test.ts` como referência de estilo — usa `createMockRepository()` com `vi.fn()`, não bate em banco real).
- Escrever teste específico pra confirmar que `SessionService` sozinho não sabe nada sobre magic link (ele só recebe `userId`/dados de sessão prontos).
- Escrever teste específico pra confirmar que `MagicLinkService` sozinho não cria sessão nenhuma — só resolve/valida o token e retorna o e-mail.
- Rodar a suíte inteira do módulo auth: `bun test apps/api/src/modules/auth`.
- Teste manual: fluxo completo de login por magic link no ambiente local (pedir link, clicar, confirmar cookie de sessão setado) — como é fluxo de auth, vale testar na mão além dos testes automatizados.

## Riscos

- **Sessão duplicada de responsabilidade entre módulos:** a criação de usuário dentro do fluxo de auth (passo 4) é o ponto mais delicado — não corrigir isso agora é uma escolha consciente de escopo, não um esquecimento.
- **Geração de token duplicada:** duplicar `generateRandomToken` nas duas classes é intencional (ver passo 3), não decidir isso na hora pode gerar um "AuthUtils" fantasma que vira dumping ground de novo.
- Qualquer consumidor de `AuthServiceV1` não mapeado no passo 1 vai quebrar em runtime, não em compile-time, se o TypeScript não pegar (ex: injeção via string/DI container). Confirme que não existe nada assim no projeto antes de apagar o arquivo antigo.

---

◀ [[Plans/Feature Plans/Clean Architecture Refactor/01 - Auth/_Index|Auth]]
