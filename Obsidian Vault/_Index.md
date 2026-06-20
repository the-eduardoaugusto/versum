---
title: "Versum — Vault"
section: Home
tags: [versum, moc]
up: null
prev: null
next: "[[PRD]]"
---
# 📖 Versum

> [!quote] Proposta de valor
> **"Leia a Bíblia no ritmo de hoje, sem perder a essência."**

Aplicativo de leitura bíblica em formato de feed, com foco em constância e reflexão. Este vault centraliza produto, arquitetura, convenções e planos do projeto.

---

## 🧭 Navegação

| Seção | Conteúdo |
|:--|:--|
| 📄 [[PRD]] | Visão de produto, features, dados, métricas |
| 📚 [[Docs/_Index\|Docs]] | Guias de desenvolvimento e arquitetura |
| 📐 [[Rules/_Index\|Rules]] | Regras de código e boas práticas |
| 🗺️ [[Plans/_Index\|Plans]] | Planos de implementação |

---

## 📚 Ordem de leitura

Cada nota tem paginação (◀ anterior · próximo ▶) seguindo esta trilha:

1. [[PRD]]
2. [[Naming Convention]]
3. [[API Development]]
4. [[API Response Standardization]]
5. [[Git Flow]]
6. [[LGPD Implementation]]
7. [[Incident Response Plan]]
8. [[Profile Edit System - Design]]
9. [[Profile Edit System - Implementation Plan]]
10. [[01 Security]] · [[02 Scalability]] · [[03 Modularization]] · [[04 General Practices]] · [[05 Tooling]] · [[06 Frontend Animations]]
11. [[LGPD Compliance]] → [[LGPD Compliance - Next Phases]]

---

## ⚡ Quick Reference

> [!info] Stack
> **Front:** Next.js 16 + React 19 + Tailwind v4 · **API:** Hono + Drizzle + PostgreSQL
> **Auth:** Magic Link + sessão infinita · **Tools:** Bun · Biome · Vitest · Orval

- **DB:** `snake_case` · **API/código:** `camelCase` — ver [[Naming Convention]]
- **Arquivos de módulo:** `<nome>.v1.<tipo>.ts`
- **Commits:** `feat|fix|refactor|docs|chore|test|perf(escopo): desc` — ver [[Git Flow]]
- **Contexto por app:** `apps/client/AGENTS.md` · `apps/api/AGENTS.md` · `apps/landing-page/AGENTS.md`

---

▶ Começar: [[PRD]]
