---
title: "Refactor — Módulo Users"
section: "Plans"
subsection: "Feature Plans"
tags: [versum, plans, refactor, users]
up: "[[Plans/Feature Plans/Clean Architecture Refactor/_Index]]"
prev: "[[Plans/Feature Plans/Clean Architecture Refactor/01 - Auth/_Index]]"
next: "[[Plans/Feature Plans/Clean Architecture Refactor/03 - Fundacao/_Index]]"
related: []
depth: 2
---

# 👤 Refactor — Módulo Users

🏠 [[_Index|Home]] › 🗺️ [[Plans/_Index|Plans]] › 🚀 [[Plans/Feature Plans/_Index|Feature Plans]] › 🏗️ [[Plans/Feature Plans/Clean Architecture Refactor/_Index|Clean Architecture Refactor]] › **Users**

---

## Problema

Duas classes do módulo `users` acumulam responsabilidade demais: `ProfileControllerV1` orquestra upload/delete de avatar direto na camada HTTP, e `UserServiceV1` faz mapeamento de exportação de dado dentro do que devia ser só um service de CRUD de usuário. Ver contexto completo no [[Plans/Feature Plans/Clean Architecture Refactor/00 - Diagnostico|Diagnóstico]].

## Tarefas

| # | Tarefa | Complexidade |
|:--|:--|:--|
| 1 | [[Plans/Feature Plans/Clean Architecture Refactor/02 - Users/01 - Extrair AvatarUploadUseCase\|Extrair AvatarUploadUseCase do ProfileControllerV1]] | Média |
| 2 | [[Plans/Feature Plans/Clean Architecture Refactor/02 - Users/02 - Extrair UserDataExportMapper\|Extrair UserDataExportMapper do UserServiceV1]] | Baixa |

As duas tarefas são independentes entre si — podem ser feitas em qualquer ordem, ou em paralelo por pessoas diferentes.

---

◀ [[Plans/Feature Plans/Clean Architecture Refactor/01 - Auth/_Index|Módulo Auth]] · [[Plans/Feature Plans/Clean Architecture Refactor/03 - Fundacao/_Index|Fundação]] ▶
