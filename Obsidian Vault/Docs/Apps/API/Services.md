---
title: "API — Services"
section: "Docs"
subsection: "Apps"
tags: [versum, api, services]
up: "[[Docs/Apps/API/_Overview]]"
related: ["[[Docs/Apps/API/Database]]", "[[Docs/Guides/API Development]]"]
depth: 2
---

# 🔧 API Services

Serviços principais que implementam lógica de negócio.

## Estrutura

Serviços são colocalizados em `apps/api/src/modules/<feature>/` e nomeados `<feature>.v1.service.ts`.

### Journey Service

Gerencia leitura bíblica, capítulos, progresso do usuário.

**Localização:** `apps/api/src/modules/journey/journey.v1.service.ts`

**Responsabilidades:**
- Calcular próximo capítulo
- Salvar progresso de leitura
- Marcar capítulos como lidos
- Confirmar conclusão de jornada

**Métodos principais:**
```typescript
getNextChapter(userId: string): Promise<Chapter>
markAsRead(userId: string, chapterId: string): Promise<void>
confirmProgress(userId: string): Promise<ProgressConfirmation>
```

### Auth Service

Gerencia autenticação via Magic Link.

**Localização:** `apps/api/src/modules/auth/auth.v1.service.ts`

---

◀ [[Docs/Apps/API/_Overview|Overview]] · [[Docs/Apps/API/Database|Database]] ▶
