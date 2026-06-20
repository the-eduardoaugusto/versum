---
title: "LGPD Implementation"
section: Docs
tags: [versum, docs]
up: "[[Docs/_Index|Docs]]"
prev: "[[Git Flow]]"
next: "[[Incident Response Plan]]"
---

🏠 [[_Index|Home]] › 📚 [[Docs/_Index|Docs]] › **LGPD Implementation**

---

# LGPD — Guia de Implementação

> Como implementar LGPD em novas features seguindo os padrões do projeto.

---

## 1. Consent Middleware (Reutilizável)

Toda rota que processa dados pessoais **deve** usar o middleware `requireConsent`:

```typescript
import { requireConsent } from "@/middlewares/consent.middleware";
import { createRoute, OpenAPIHono } from "@hono/zod-openapi";

// Em routes/<modulo>.v1.route.ts:
router.openapi(
  minhaRota,
  requireConsent("annotations"),  // ← verifica consentimento ANTES do handler
  controller.meuHandler,
);
```

**Middleware disponível em:** `apps/api/src/middlewares/consent.middleware.ts`

---

## 2. Finalidades (Purposes) de Consentimento

Sempre use as finalidades registradas em `CONSENT_PURPOSES`:

| Purpose | Quando usar | Obrigatório |
|---------|-------------|-------------|
| `profile_content` | Nome, username, bio, foto do perfil | Não |
| `annotations` | Anotações e marcadores em versículos | Não |
| `likes` | Curtidas/favoritos | Não |
| `terms` | Aceitação dos Termos de Uso e Política de Privacidade | **Sim** |

---

## 3. Padrão para Criar Nova Feature com LGPD

### 3.1 Service — Verificação Programática

Sempre verifique consentimento no service **antes** de processar:

```typescript
// services/<modulo>.v1.service.ts
import { ConsentLogsRepository } from "../../consent-logs/repositories/consent-logs.repository";

export class MinhaFeatureServiceV1 {
  private readonly consentLogsRepository: ConsentLogsRepository;

  constructor({ consentLogsRepository }: { consentLogsRepository?: ConsentLogsRepository } = {}) {
    this.consentLogsRepository = consentLogsRepository ?? new ConsentLogsRepository();
  }

  async processar(params: { userId: string } & OutrosParams): Promise<Resultado> {
    const hasConsent = await this.consentLogsRepository.hasConsent({
      userId: params.userId,
      purpose: "annotations",  // ← finalidade correta
    });

    if (!hasConsent) {
      throw new ForbiddenError(
        "Consentimento não concedido para anotações",
      );
    }

    // ... lógica do negócio
  }
}
```

### 3.2 Repository — Método `hasConsent`

Use o método já existente em `ConsentLogsRepository`:

```typescript
await consentLogsRepository.hasConsent({
  userId: "uuid-do-usuario",
  purpose: "annotations",  // | "profile_content" | "likes" | "terms"
});
// Retorna: boolean — true se o último registro para essa finalidade é granted
```

### 3.3 Controller + Routes — Dupla Proteção

Sempre aplique as duas camadas:

1. **Middleware** na rota (defense-in-depth, falha rápido)
2. **Verificação no service** (proteção contra chamadas internas)

---

## 4. Excluindo Dados de um Usuário

Ao implementar features que armazenam dados pessoais, adicione a limpeza no `deleteUser`:

**Service** (`user.v1.service.ts`):
```typescript
// Já existe, mas ao adicionar novas tabelas:
async deleteUser({ id }: { id: string }): Promise<void> {
  const user = await this.repository.findById({ id });
  if (!user) throw new Error("User not found");

  await this.transaction(async (tx) => {
    await this.authRepository.deleteSessionsByUserId({ userId: id }, tx);
    await this.profileRepository.deleteByUserId({ userId: id }, tx);
    await this.authRepository.deleteMagicLinksByEmail({ email: user.email }, tx);
    // ADICIONE AQUI novos repositórios:
    // await this.minhaFeatureRepository.deleteByUserId({ userId: id }, tx);
    await this.repository.deleteUser({ id }, tx);
  });
}
```

**Regra:** Se a tabela não tem `onDelete: "cascade"` de `users`, precisa de deleção manual.

---

## 5. Exportando Dados (Portabilidade)

Ao criar uma nova tabela com dados do usuário:

1. Adicione a relation em `users.relations.ts`:
   ```typescript
   minhaFeature: many(minhaFeatureTable),
   ```

2. Adicione no `findByIdWithAllData` em `user.repository.ts`:
   ```typescript
   with: {
     // ... existentes
     minhaFeature: true,
   }
   ```

3. Transforme no `exportUserData` em `user.v1.service.ts`:
   ```typescript
   minhaFeature: (data.minhaFeature ?? []).map((item: unknown) => {
     const f = item as { /* campos */ };
     return { /* mapeamento */ };
   }),
   ```

4. Adicione o schema em `users.v1.common.schema.ts`:
   ```typescript
   minhaFeature: z.array(z.object({ /* campos */ })),
   ```

---

## 6. Testes

### 6.1 Consentimento negado

```typescript
it("deve bloquear quando consentimento foi revogado", async () => {
  mockConsentLogsRepository.hasConsent.mockResolvedValue(false);

  await expect(
    service.minhaFuncao({ userId: "123", ... }),
  ).rejects.toThrow("Consentimento não concedido");

  expect(mockConsentLogsRepository.hasConsent).toHaveBeenCalledWith({
    userId: "123",
    purpose: "annotations",
  });
});
```

### 6.2 Consentimento concedido

```typescript
it("deve processar quando consentimento foi concedido", async () => {
  mockConsentLogsRepository.hasConsent.mockResolvedValue(true);
  // ... mock das outras dependências

  const result = await service.minhaFuncao({ userId: "123", ... });
  expect(result).toBeDefined();
});
```

---

## 7. Checklist para Nova Feature

- [ ] Adicionar finalidade em `CONSENT_PURPOSES` (se nova)
- [ ] Adicionar consent option em `onboarding/constants.ts` (se nova finalidade)
- [ ] Criar service com verificação de consentimento programática
- [ ] Registrar middleware `requireConsent` nas rotas
- [ ] Adicionar deleção manual no `deleteUser` (se sem cascade)
- [ ] Adicionar export no `findByIdWithAllData` + transform no service
- [ ] Adicionar schema de export em `users.v1.common.schema.ts`
- [ ] Escrever testes: consentimento concedido, negado, sem registro

---

## 8. Estrutura de Arquivos (Referência)

```
apps/api/src/
├── middlewares/
│   └── consent.middleware.ts         ← Middleware reutilizável
├── modules/
│   ├── users/
│   │   ├── services/
│   │   │   └── user.v1.service.ts    ← deleteUser + exportUserData
│   │   ├── repositories/
│   │   │   └── user.repository.ts    ← findByIdWithAllData
│   │   └── schemas/v1/
│   │       └── users.v1.common.schema.ts ← export schema
│   └── consent-logs/
│       ├── repositories/
│       │   └── consent-logs.repository.ts ← hasConsent()
│       └── services/
│           └── consent-log.v1.service.ts

apps/client/src/
├── features/
│   └── onboarding/
│       ├── constants.ts              ← CONSENT_OPTIONS
│       └── components/steps/
│           └── consent-step-view.tsx ← Tela de consentimento
├── app/
│   ├── (private)/onboarding/
│   │   └── page.tsx                  ← Fluxo de onboarding
│   └── privacy/
│       └── page.tsx                  ← Política de privacidade
```


---

◀ [[Git Flow]] · 📚 [[Docs/_Index|Docs]] · [[Incident Response Plan]] ▶
