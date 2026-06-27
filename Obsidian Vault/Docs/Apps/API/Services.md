---
title: "API — Services"
section: "Docs"
subsection: "Apps"
tags: [versum, api, services]
up: "[[Docs/Apps/API/_Overview]]"
related: ["[[Docs/Apps/API/Database]]", "[[Docs/API Development]]"]
depth: 2
---

# 🔧 API Services

Serviços principais que implementam lógica de negócio. Cada módulo segue arquitetura em camadas:

```
modules/<feature>/
├── services/      # Lógica de negócio
├── repositories/  # Acesso a dados
├── controllers/   # Handlers HTTP
├── routes/        # Definição de rotas
└── schemas/       # Validação Zod
```

---

## 1. Auth Service

**Gerencia:** Autenticação, sessões, magic link

**Localização:** `apps/api/src/modules/auth/`

**Responsabilidades:**
- Enviar magic link via email
- Validar tokens de sessão
- Criar/revogar sessões (httpOnly cookies infinitas)
- Validar permissões

**Métodos principais:**
```typescript
sendMagicLink(email: string): Promise<void>
validateSession(sessionToken: string): Promise<User>
createSession(userId: string): Promise<Session>
```

---

## 2. Bible Service

**Gerencia:** Estrutura bíblica, versículos, capítulos

**Localização:** `apps/api/src/modules/bible/`

**Responsabilidades:**
- Armazenar e consultar versículos
- Organizar por livro/capítulo/versículo
- Suportar múltiplas traduções
- Busca e indexação

---

## 3. Reading Service

**Gerencia:** Progresso de leitura, jornada do usuário

**Localização:** `apps/api/src/modules/reading/`

**Responsabilidades:**
- Feed infinito de capítulos (buffer com próximos items)
- Marcar capítulos como lidos
- Calcular progresso (% completo)
- Atualizar último capítulo ativo
- Paginação adaptativa de versículos

**Métodos principais:**
```typescript
getFeed(userId: string, bufferSize: number): Promise<JourneyFeed>
markChapterAsRead(userId: string, chapterId: string): Promise<void>
getProgress(userId: string): Promise<ProgressData>
confirmProgressMilestone(userId: string): Promise<Milestone>
```

---

## 4. Users Service

**Gerencia:** Perfis de usuários, preferências, dados pessoais

**Localização:** `apps/api/src/modules/users/`

**Responsabilidades:**
- CRUD de perfis (nome, username, bio, avatar)
- Preferências de leitura (tamanho fonte, tema, etc.)
- Avatar upload via Cloudinary
- Deleção de conta (LGPD)

**Métodos principais:**
```typescript
getProfile(userId: string): Promise<FullProfile>
updateProfile(userId: string, data: UpdateProfileDTO): Promise<User>
uploadAvatar(userId: string, file: File): Promise<AvatarURL>
deleteAccount(userId: string): Promise<void>
```

---

## 5. Interactions Service

**Gerencia:** Engajamento e comportamento do usuário

**Localização:** `apps/api/src/modules/interactions/`

**Responsabilidades:**
- Rastrear tempo gasto lendo
- Registrar eventos (scroll, pause, resume)
- Métricas de engajamento
- Recomendações baseadas em padrões

---

## 6. Consent-Logs Service

**Gerencia:** Conformidade LGPD, consentimento, auditoria

**Localização:** `apps/api/src/modules/consent-logs/`

**Responsabilidades:**
- Registrar consentimento do usuário
- Rastrear acesso a dados pessoais
- Logs de deleção e portabilidade
- Compliance com LGPD/ANPD

**Métodos principais:**
```typescript
grantConsent(userId: string, consentType: string): Promise<void>
revokeConsent(userId: string, consentType: string): Promise<void>
getConsentHistory(userId: string): Promise<ConsentLog[]>
logDataAccess(userId: string, dataType: string): Promise<void>
```

---

## Padrão de Implementação

Cada módulo segue o mesmo padrão:

1. **Controller** — Handler HTTP, recebe request
2. **Schema** — Validação Zod da entrada
3. **Service** — Lógica de negócio pura
4. **Repository** — Queries ao banco (Drizzle)
5. **Routes** — Definição de endpoints

Exemplo: `POST /api/v1/profiles/@me`
```
Route → Controller → Schema validation → Service → Repository → DB
```

---

◀ [[Docs/Apps/API/_Overview|Overview]] · [[Docs/Apps/API/Database|Database]] ▶
