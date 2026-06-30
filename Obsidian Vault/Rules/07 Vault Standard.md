---
title: "07 - Obsidian Vault Standard"
section: Rules
tags: [versum, rules, docs, vault, standards]
up: "[[Rules/_Index]]"
prev: "[[Rules/06 Frontend Animations]]"
next: null
related: ["[[Docs/_Index]]", "[[AGENTS.md]]"]
---

🏠 [[_Index|Home]] › 📋 [[Rules/_Index|Rules]] › **Vault Standard**

---

# 07 - Obsidian Vault Standard

Padrão obrigatório para toda documentação no Obsidian Vault. Validado automaticamente em CI/CD.

## Estrutura de Arquivo

Cada arquivo `.md` **deve** seguir esta estrutura exata:

```markdown
---
title: "Título do Documento"
section: Docs                      # ou Rules, Plans
tags: [versum, docs, tema1, tema2]
up: "[[Docs/_Index|Docs]]"         # Referência para página acima
prev: "[[Arquivo Anterior]]"       # Opcional: navegação anterior
next: "[[Próximo Arquivo]]"        # Opcional: navegação próxima
related: ["[[Link1]]", "[[Link2]]"]# Opcional: documentação relacionada
depth: 1                           # Opcional: profundidade na hierarquia (1 ou 2)
---

🏠 [[_Index|Home]] › 📚 [[Docs/_Index|Docs]] › **Título**

---

> [!info] Sobre este documento
> **Data:** YYYY-MM-DD · **Tipo:** Guia/Decisão/Exemplo  
> **Relacionado:** [[Link1]] · [[Link2]]

---

# Título Principal

Conteúdo do documento...

---

◀ [[Arquivo Anterior|Anterior]] · [[Próximo Arquivo|Próximo]] ▶
```

---

## Frontmatter (Metadados YAML)

### ✅ Obrigatório

| Campo | Tipo | Exemplo | Notas |
|:--|:--|:--|:--|
| `title` | string | `"API Development"` | Entre aspas, máx 60 caracteres |
| `section` | string | `Docs`, `Rules`, `Plans` | Exato, sem aspas |
| `tags` | array | `[versum, docs, api]` | **Mínimo:** `versum` + `docs` |
| `up` | string | `"[[Docs/_Index\|Docs]]"` | Link para nível superior |

### ⚠️ Altamente Recomendado

| Campo | Tipo | Exemplo |
|:--|:--|:--|
| `prev` | string | `"[[Arquivo Anterior]]"` |
| `next` | string | `"[[Próximo Arquivo]]"` |
| `related` | array | `["[[Link1]]", "[[Link2]]"]` |
| `depth` | number | `1` ou `2` |

### ❌ Proibido

- Sem frontmatter
- Frontmatter sem `---` delimitadores
- Campos sem aspas em strings
- Tags sem `versum` ou `docs`

---

## Tags Obrigatórias

Todos os arquivos **devem** ter:

```yaml
tags: [versum, docs, ...]
```

Adicione tags específicas:

| Área | Tags | Exemplo |
|:--|:--|:--|
| **Feature** | tema específico | `[versum, docs, journey-feed, client]` |
| **API** | módulo | `[versum, docs, api, auth]` |
| **Decisão Arquitetural** | `adr` | `[versum, rules, adr, performance]` |
| **Padrão de Código** | `pattern` | `[versum, rules, pattern, hooks]` |

---

## Links Obsidian

### ✅ Links Corretos

```markdown
[[Docs/_Index]]               # Link absoluto
[[Docs/_Index|Docs]]          # Link com label customizado
[[../Guides/Git Flow]]        # Referência relativa
[[#Seção 1]]                  # Link para seção
```

### ❌ Links Incorretos

```markdown
[[api development]]           # Minúscula (inconsistente)
[[my-file.md]]               # Não use extensão
[Texto](./arquivo.md)        # Use wiki-style, não markdown
```

---

## Breadcrumb (Navegação no Início)

Todo arquivo **deve** ter breadcrumb no início após frontmatter:

```markdown
🏠 [[_Index|Home]] › 📚 [[Docs/_Index|Docs]] › 💻 [[Docs/Apps/Client/_Overview|Client]] › **Seu Título**
```

**Padrões de ícones:**
- `🏠` — Home (_Index.md)
- `📚` — Docs
- `📋` — Rules
- `🎯` — Plans
- `💻` — Client / Frontend
- `🔧` — API / Backend
- `📱` — Apps
- `🔗` — Features
- `📐` — Architecture

---

## Info Box (Metadados Visuais)

Recomendado em documentos longos ou técnicos:

```markdown
> [!info] Sobre este documento
> **Data:** 2026-06-27 · **Tipo:** Architecture Guide  
> **Escopo:** Client-side  
> **Áreas:** `apps/client/src/features/feed/`  
> **Relacionado:** [[Link1]] · [[Link2]]
```

---

## Navegação no Final

Todo arquivo **deve** terminar com links de navegação:

```markdown
---

◀ [[Anterior|Anterior]] · [[Próximo|Próximo]] ▶
```

Ou com opções de navegação:

```markdown
---

◀ [[Home|Home]] · [[Guides/_Index|Guides]] · [[Docs/_Index|Docs]] ▶
```

---

## Estrutura de Pastas

```
Obsidian Vault/
├── _Index.md                    # Home
├── PRD.md                       # Product Requirements
├── Docs/
│   ├── _Index.md                # Índice geral de docs
│   ├── Naming Convention.md     # Convenções de nomenclatura
│   ├── API Development.md       # Padrões de API
│   ├── API Response Standardization.md  # Envelope de resposta
│   ├── Git Flow.md              # Fluxo de trabalho git
│   ├── LGPD Implementation.md   # Implementação LGPD
│   ├── Journey Feed Client Architecture.md  # Arquitetura do feed
│   ├── Journey Feed Data Flow Examples.md   # Exemplos de fluxo
│   ├── Guides/                  # Índice de guias (links)
│   │   └── _Index.md
│   ├── Apps/                    # Documentação por app
│   │   ├── _Index.md
│   │   ├── API/
│   │   │   ├── _Overview.md
│   │   │   ├── CLI.md
│   │   │   ├── Database.md
│   │   │   └── Services.md
│   │   ├── Client/
│   │   │   ├── _Overview.md
│   │   │   ├── Components.md
│   │   │   ├── Implementation Notes.md
│   │   │   ├── Journey Feed Features.md
│   │   │   └── State Management.md
│   │   ├── Landing Page/
│   │   │   └── _Overview.md
│   │   └── Packages/
│   │       └── Logger/
│   │           └── _Overview.md
│   └── Decisions/               # ADRs (Architecture Decision Records)
│       ├── _Index.md
│       ├── Incident Response Plan.md
│       └── Journey Feed - Progress Confirmation.md
├── Plans/
│   ├── _Index.md
│   ├── Feature Plans/
│   │   └── Profile Edit System/
│   │       ├── Design.md
│   │       └── Implementation Plan.md
│   ├── Compliance/
│   │   ├── _Index.md
│   │   ├── LGPD Compliance.md
│   │   └── LGPD Compliance - Next Phases.md
│   ├── Vault Refactoring - Design.md
│   └── Vault Refactoring - Implementation Plan.md
└── Rules/
    ├── _Index.md
    ├── 01 Security.md
    ├── 02 Scalability.md
    ├── 03 Modularization.md
    ├── 04 General Practices.md
    ├── 05 Tooling.md
    ├── 06 Frontend Animations.md
    └── 07 Vault Standard.md
```

**Regras:**
- Máximo 3 níveis de profundidade
- Use PascalCase para nomes
- Evite espaços extras em nomes
- Use números de prefixo para sequências (`01`, `02`, etc)

---

## Validação em CI/CD

Pipeline automática valida:

### ✅ Sucesso
```
✅ Vault validation passed - all files follow the standard!
```

### ❌ Falha
```
❌ Errors found:
  - Missing required frontmatter: title
  - Tags must include: versum, docs
  - Invalid Obsidian link [[broken-link]]
```

**Comando local:**
```bash
bun scripts/validate-vault.ts
```

---

## Checklist para Novo Documento

- [ ] Arquivo em pasta correta (`Docs/`, `Rules/`, `Plans/`)
- [ ] Frontmatter com `title`, `section`, `tags`, `up`
- [ ] Tags incluem `versum` e `docs` (ou `rules`/`plans`)
- [ ] Breadcrumb no início
- [ ] Links usando `[[...]]` (wiki-style)
- [ ] Info box (se relevante)
- [ ] Navegação no final
- [ ] Sem erros de formatação
- [ ] Links internos apontam para arquivos existentes

---

## Troubleshooting

| Erro | Solução |
|:--|:--|
| `Missing frontmatter` | Adicione `---` no topo e fim |
| `Missing required tags` | Adicione `tags: [versum, docs, ...]` |
| `Invalid link [[...]]` | Use path completo: `[[Docs/Apps/Client/_Overview]]` |
| `Missing breadcrumb` | Adicione `🏠 [[_Index\|Home]] › ...` após frontmatter |

---

## Exemplo Completo

```markdown
---
title: "Exemplo de Documento"
section: Docs
tags: [versum, docs, example, tutorial]
up: "[[Docs/_Index|Docs]]"
prev: "[[Docs/Git Flow]]"
next: "[[Docs/API Development]]"
related: ["[[AGENTS.md]]", "[[Rules/_Index]]"]
depth: 1
---

🏠 [[_Index|Home]] › 📚 [[Docs/_Index|Docs]] › **Exemplo**

---

> [!info] Sobre este documento
> **Data:** 2026-06-27 · **Tipo:** Tutorial  
> **Relacionado:** [[Git Flow]] · [[API Development]]

---

# Exemplo de Documento

Conteúdo aqui...

---

◀ [[Docs/Git Flow|Git Flow]] · [[Docs/API Development|API Development]] ▶
```

---

◀ [[Rules/06 Frontend Animations|Frontend Animations]] · [[Rules/_Index|Rules]] ▶
