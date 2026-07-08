---
title: "Refactor — Módulo Auth"
section: "Plans"
subsection: "Feature Plans"
tags: [versum, plans, refactor, auth]
up: "[[Plans/Feature Plans/Clean Architecture Refactor/_Index]]"
prev: "[[Plans/Feature Plans/Clean Architecture Refactor/00 - Diagnostico]]"
next: "[[Plans/Feature Plans/Clean Architecture Refactor/02 - Users/_Index]]"
related: []
depth: 2
---

# 🔐 Refactor — Módulo Auth

🏠 [[_Index|Home]] › 🗺️ [[Plans/_Index|Plans]] › 🚀 [[Plans/Feature Plans/_Index|Feature Plans]] › 🏗️ [[Plans/Feature Plans/Clean Architecture Refactor/_Index|Clean Architecture Refactor]] › **Auth**

---

## Problema

`AuthServiceV1` (`apps/api/src/modules/auth/services/auth.v1.service.ts`) mistura 4 responsabilidades numa classe só: geração/validação de token de magic link, hashing de senha, envio de e-mail e gestão de sessão (criar, revalidar, rotacionar, revogar). Ver contexto completo no [[Plans/Feature Plans/Clean Architecture Refactor/00 - Diagnostico|Diagnóstico]].

## Tarefas

| # | Tarefa | Complexidade |
|:--|:--|:--|
| 1 | [[Plans/Feature Plans/Clean Architecture Refactor/01 - Auth/01 - Separar AuthServiceV1|Separar AuthServiceV1 em MagicLinkService e SessionService]] | Média |

---

◀ [[Plans/Feature Plans/Clean Architecture Refactor/00 - Diagnostico|Diagnóstico]] · [[Plans/Feature Plans/Clean Architecture Refactor/02 - Users/_Index|Módulo Users]] ▶
