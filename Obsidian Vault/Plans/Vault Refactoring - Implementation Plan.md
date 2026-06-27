---
title: "Obsidian Vault Refactoring — Implementation Plan"
section: Plans
subsection: Infrastructure
tags: [versum, vault, obsidian, implementation]
up: "[[Plans/_Index]]"
related: ["[[Vault Refactoring - Design]]"]
depth: 2
---

# Obsidian Vault Refactoring — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task.

**Goal:** Reorganizar Obsidian Vault com estrutura escalável, templates automáticos, e navegação otimizada para graph 3D.

**Architecture:** 
1. Criar estrutura de pastas (Guides/, Apps/, Decisions/, Feature Plans/, Compliance/)
2. Definir templates Obsidian pra cada tipo de documento
3. Reorganizar documentos existentes pra locais corretos
4. Criar scaffolding de documentação pra cada app/package
5. Configurar navegação linear (paginação prev/next)
6. Validar links e graph no Obsidian

**Tech Stack:** Markdown, Obsidian (plugins: Templater ou Templates), git

---

## Global Constraints

- Documentação apenas em `.md` (sem HTML)
- Frontmatter padrão em todo arquivo: title, section, subsection, tags, up, related
- Wikilinks `[[]]` pra referenciar documentação interna
- Máximo 5 relacionamentos por documento (evitar poluição do graph)
- Paginação linear (prev/next) em trilhas temáticas
- Commits: `docs(vault): <tarefa específica>`

---

## Tasks

### Task 1: Criar estrutura de pastas

**Files:**
- Create: `Obsidian Vault/Docs/Guides/` (pasta)
- Create: `Obsidian Vault/Docs/Apps/` (pasta)
- Create: `Obsidian Vault/Docs/Decisions/` (pasta)
- Create: `Obsidian Vault/Plans/Feature Plans/` (pasta)
- Create: `Obsidian Vault/Plans/Feature Plans/Profile Edit System/` (pasta)
- Create: `Obsidian Vault/Plans/Compliance/` (pasta)
- Create: `Obsidian Vault/.obsidian/templates/` (pasta, se não existir)

**Interfaces:**
- Produces: Estrutura de diretórios base para todas as tarefas seguintes

- [ ] **Step 1: Criar pasta Docs/Guides**

```bash
mkdir -p '/home/eduardoaugusto/Documentos/www/projetos/versum/Obsidian Vault/Docs/Guides'
```

- [ ] **Step 2: Criar pasta Docs/Apps**

```bash
mkdir -p '/home/eduardoaugusto/Documentos/www/projetos/versum/Obsidian Vault/Docs/Apps'
```

- [ ] **Step 3: Criar pastas para cada app em Docs/Apps**

```bash
mkdir -p '/home/eduardoaugusto/Documentos/www/projetos/versum/Obsidian Vault/Docs/Apps/API'
mkdir -p '/home/eduardoaugusto/Documentos/www/projetos/versum/Obsidian Vault/Docs/Apps/Client'
mkdir -p '/home/eduardoaugusto/Documentos/www/projetos/versum/Obsidian Vault/Docs/Apps/Landing Page'
mkdir -p '/home/eduardoaugusto/Documentos/www/projetos/versum/Obsidian Vault/Docs/Apps/Packages/Logger'
```

- [ ] **Step 4: Criar pasta Docs/Decisions**

```bash
mkdir -p '/home/eduardoaugusto/Documentos/www/projetos/versum/Obsidian Vault/Docs/Decisions'
```

- [ ] **Step 5: Criar pastas em Plans**

```bash
mkdir -p '/home/eduardoaugusto/Documentos/www/projetos/versum/Obsidian Vault/Plans/Feature Plans/Profile Edit System'
mkdir -p '/home/eduardoaugusto/Documentos/www/projetos/versum/Obsidian Vault/Plans/Compliance'
```

- [ ] **Step 6: Criar pasta de templates**

```bash
mkdir -p '/home/eduardoaugusto/Documentos/www/projetos/versum/Obsidian Vault/.obsidian/templates'
```

- [ ] **Step 7: Verificar estrutura**

```bash
tree -L 3 '/home/eduardoaugusto/Documentos/www/projetos/versum/Obsidian Vault' | grep -E "Guides|Apps|Decisions|Feature Plans|Compliance|templates"
```

Expected: Todas as pastas listadas

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "docs(vault): create directory structure for refactoring"
```

---

### Task 2: Criar templates Obsidian

**Files:**
- Create: `.obsidian/templates/doc-guide-template.md`
- Create: `.obsidian/templates/doc-app-overview.md`
- Create: `.obsidian/templates/doc-decision.md`
- Create: `.obsidian/templates/rule-template.md`
- Create: `.obsidian/templates/plan-template.md`

**Interfaces:**
- Produces: 5 templates prontos para uso via Templater/Templates plugin

- [ ] **Step 1: Criar doc-guide-template.md**
- [ ] **Step 2: Criar doc-app-overview.md**
- [ ] **Step 3: Criar doc-decision.md**
- [ ] **Step 4: Criar rule-template.md**
- [ ] **Step 5: Criar plan-template.md**
- [ ] **Step 6: Verificar templates criados**
- [ ] **Step 7: Commit**

---

### Task 3: Reorganizar documentos existentes — Profile Edit System

- [ ] **Step 1-8: Mover Profile Edit System**

---

### Task 4: Reorganizar documentos existentes — Journey Feed

- [ ] **Step 1-7: Mover/converter Journey Feed**

---

### Task 5: Criar documentação de Apps — Scaffolding

- [ ] **Step 1-12: Criar Docs/Apps com _Index e sub-documentação**

---

### Task 6: Criar documentação de Guides e Decisions

- [ ] **Step 1-3: Criar Docs/Guides/_Index e Docs/Decisions/_Index**

---

### Task 7: Reorganizar Plans — Feature Plans e Compliance

- [ ] **Step 1-5: Criar Plans/Feature Plans/_Index e Plans/Compliance/_Index**

---

### Task 8: Atualizar Docs/_Index.md com nova estrutura

- [ ] **Step 1-3: Atualizar Docs/_Index.md**

---

### Task 9: Atualizar Plans/_Index.md com nova estrutura

- [ ] **Step 1-3: Atualizar Plans/_Index.md**

---

### Task 10: Atualizar Main _Index.md (Home)

- [ ] **Step 1-3: Validar e atualizar _Index.md raiz**

---

### Task 11: Validar estrutura e links

- [ ] **Step 1-4: Verificar integridade do vault**

---

### Task 12: Commit final e limpeza

- [ ] **Step 1-3: Final commit**

---

## Self-Review

✅ Spec Coverage - todos os requisitos do design cobertos
✅ No Placeholders - todos os caminhos e comandos específicos
✅ Type Consistency - todos os links e frontmatters consistentes

---

