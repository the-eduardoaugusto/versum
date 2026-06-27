---
title: "Obsidian Vault Refactoring"
section: Plans
subsection: Infrastructure
tags: [versum, vault, obsidian, ux]
up: "[[Plans/_Index]]"
related: ["[[Rules/_Index]]", "[[Docs/_Index]]"]
depth: 2
---

# 🏗️ Obsidian Vault Refactoring — Design

> [!quote]
> Reorganizar o Obsidian Vault para escalabilidade, clareza de contexto e navegação visual otimizada via graph 3D. Documentação restrita a arquitetura, fluxos e estrutura da codebase.

---

## 📋 Objetivos

1. **Clareza contextual** — novo dev entende rapidinho pra que serve cada coisa
2. **Escalabilidade** — estrutura suporta crescimento de apps/packages sem confusão
3. **Graph limpo** — apenas relacionamentos semânticos relevantes, sem poluição visual
4. **UI/UX otimizada** — navegação intuitiva via paginação linear + hierarquia
5. **Codebase integration** — wikilinks [[]] marcam direto a documentação
6. **Templates automáticos** — plugins Obsidian geram novos arquivos com padrão consistente

---

## 🗂️ Estrutura de Pastas

```
Obsidian Vault/
├── _Index.md                          # Hub central
├── PRD.md                             # Visão de produto
├── .obsidian/                         # Config + plugins + templates
│   ├── templates/
│   │   ├── doc-guide-template.md      # Template pra guias em Docs/Guides
│   │   ├── doc-app-overview.md        # Template pra Docs/Apps/*/Overview
│   │   ├── doc-decision.md            # Template pra Docs/Decisions
│   │   ├── rule-template.md           # Template pra Rules
│   │   └── plan-template.md           # Template pra Plans
│   └── [plugins existentes]           # Templater, Templates, etc.
│
├── Docs/
│   ├── _Index.md                      # MOC — mapa de toda documentação
│   ├── Guides/                        # Guias atemporais (convenções, fluxos técnicos)
│   │   ├── Naming Convention.md
│   │   ├── API Development.md
│   │   ├── API Response Standardization.md
│   │   ├── Git Flow.md
│   │   └── LGPD Implementation.md
│   │
│   ├── Apps/                          # Documentação por app/package
│   │   ├── API/
│   │   │   ├── _Overview.md           # Arquitetura, estrutura, serviços principais
│   │   │   ├── Services.md            # Detalhes de serviços, fluxos internos
│   │   │   └── Database.md            # Schemas, migrações, camada DB
│   │   ├── Client/
│   │   │   ├── _Overview.md
│   │   │   ├── Components.md          # Estrutura de componentes
│   │   │   └── State Management.md    # Context, hooks, fluxos de estado
│   │   ├── Landing Page/
│   │   │   └── _Overview.md
│   │   └── Packages/
│   │       └── Logger/
│   │           └── _Overview.md
│   │
│   └── Decisions/                     # ADRs e decisões técnicas permanentes
│       ├── Journey Feed - Progress Confirmation.md
│       ├── [future ADRs]
│       └── _Index.md                  # Índice de decisões
│
├── Rules/
│   ├── _Index.md
│   ├── 01 Security.md
│   ├── 02 Scalability.md
│   ├── 03 Modularization.md
│   ├── 04 General Practices.md
│   ├── 05 Tooling.md
│   └── 06 Frontend Animations.md
│
└── Plans/
    ├── _Index.md
    ├── Vault Refactoring/
    │   ├── Design.md                  # Este arquivo
    │   └── Implementation Plan.md      # Tasks task-by-task
    ├── Feature Plans/
    │   ├── Profile Edit System/
    │   │   ├── Design.md
    │   │   └── Implementation Plan.md
    │   ├── Journey Feed Enhancements/
    │   │   └── [future specs]
    │   └── _Index.md
    ├── Compliance/
    │   ├── LGPD Compliance/
    │   │   ├── Roadmap.md
    │   │   └── Next Phases.md
    │   └── _Index.md
    └── Incident Response/
        └── Plan.md
```

---

## 🎨 Template Pattern (Frontmatter + Body)

### Frontmatter Padrão

```yaml
---
title: "Nome do Documento"
section: "Docs|Rules|Plans"
subsection: "Guides|Apps|Decisions|Feature Plans|Compliance"
tags: [versum, tag-especifica]
up: "[[_Index]]"                       # Pai na hierarquia
related: ["[[link1]]", "[[link2]]"]    # Relacionamentos semânticos (máx 5)
depth: 2                                # Nível de detalhamento (1=intro, 2=intermediate, 3=deep)
---
```

### Estrutura de Body

```markdown
# 📚 Título

> [!quote] Contexto
> Resumo 1-2 frases do que é esse documento.

---

## Seção 1
[conteúdo]

## Seção 2
[conteúdo]

---

## 🔗 Relacionamentos Semânticos

- **Pré-requisito:** [[Naming Convention]]
- **Complementar:** [[API Response Standardization]]
- **Implementação:** [[Profile Edit System - Implementation Plan]]

---

## 📍 Referências Codebase

Quando marcar código/estrutura:
- `apps/api/src/services/journey.v1.service.ts` (veja [[Apps/API/Services]])
- Estrutura em [[Apps/Client/Components]]

---

◀ [[prev-document]] · [[up-document|🏠 Home]] · [[next-document]] ▶
```

---

## 🔗 Estratégia de Relacionamentos (Graph Cleanliness)

**Abordagem B: Semântica + Relevância**

- `related:` no frontmatter lista apenas conexões *necessárias* pra entender o contexto
- Máximo 5 relacionamentos por documento (evita poluição)
- Hierarquia clara (up/prev/next) cria "trilhas temáticas" navegáveis
- Wikilinks no body são "conexões leves" — não constroem demais do graph

**Exemplo:**
```
API Development.md
  ↓ related to
  Naming Convention.md, API Response Standardization.md, Git Flow.md
  
Apps/API/_Overview.md
  ↓ related to
  Guides/API Development.md, Rules/Modularization.md, Apps/API/Services.md
```

Graph fica denso mas navegável, não poluído.

---

## 📱 Navegação Linear (Paginação)

Cada seção tem uma **trilha temática** (prev/next):

1. **Onboarding Trail** (novo dev)
   - PRD → Naming Convention → API Development → Git Flow → Rules overview
   
2. **API Developer Trail**
   - API Development → Naming Convention → API Response Standardization → Apps/API/Overview → Services

3. **Frontend Developer Trail**
   - Client overview → Components → State Management → Rules/Modularization

4. **Rules Trail**
   - Rules/_Index → 01 Security → 02 Scalability → ... → 06 Frontend Animations

---

## 🛠️ Limpeza Inicial

**Arquivos a mover/refatorar:**
- `Docs/Profile Edit System - Design.md` → `Plans/Feature Plans/Profile Edit System/Design.md`
- `Docs/Profile Edit System - Implementation Plan.md` → `Plans/Feature Plans/Profile Edit System/Implementation Plan.md`
- `Docs/Journey Feed - Progress Confirmation.md` → `Docs/Decisions/Journey Feed - Progress Confirmation.md`
- `Docs/Journey Feed - Client Implementation.html` → `Docs/Apps/Client/Implementation Notes.md` (converter HTML → MD)

**Novos arquivos a criar:**
- Docs/Decisions/_Index.md
- Docs/Apps/*/estrutura conforme mapeada
- Plans/Feature Plans/_Index.md
- Plans/Compliance/_Index.md
- Templates em `.obsidian/templates/`

---

## ✨ UX Improvements

1. **Visual Consistency** — todos os documentos seguem template padrão
2. **Graph Navigation** — 3D graph mostra clusters claros (Docs, Rules, Plans)
3. **Quick Reference** — cada MOC (_Index) tem tabela com descrição breve
4. **Contextual Breadcrumbs** — `🏠 Home › Section › Subsection`
5. **Plugin Automation** — novos docs gerados com template automático via Templater

---

## 📊 Success Criteria

✅ Nenhum arquivo `.html` em Docs/  
✅ Docs/ contém apenas arquitetura/fluxos/convenções  
✅ Plans/ contém designs + roadmaps de features  
✅ Rules/ intocado (já bem estruturado)  
✅ Cada _Index.md tem tabela clara de conteúdo  
✅ Graph 3D é navegável sem poluição  
✅ Novo dev consegue encontrar contexto em 2-3 cliques  

---

## 📝 Próximas Fases

1. **Design Review** ← você está aqui
2. **Implementação** (criar estrutura, mover arquivos, escrever templates)
3. **Commit** com mensagem: `docs(vault): reorganize structure, add templates, improve navigation`

