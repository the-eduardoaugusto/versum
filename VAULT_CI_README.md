# Obsidian Vault CI/CD Pipeline

Pipeline automática que valida a estrutura e padrão do Obsidian Vault em tempo de PR e commit.

## 🚀 O que é validado

- ✅ **Frontmatter YAML** — Presença de `title`, `section`, `tags`, `up`
- ✅ **Tags obrigatórias** — Cada arquivo deve ter tag `versum`
- ✅ **Estrutura de arquivo** — Válido YAML, sem erros de sintaxe
- ⚠️ **Breadcrumb** — Links de navegação `[[_Index|Home]]`
- ⚠️ **Links internos** — `[[...]]` válidos e bem-formados

## 🏃 Usar Localmente

### Validar toda a vault
```bash
bun scripts/validate-vault.ts
```

**Output (sucesso):**
```
✅ Vault validation passed - all files follow the standard!
```

**Output (falha):**
```
📋 Vault Validation Results: 2 errors, 5 warnings

❌ ERRORS:
  Docs/API.md: Missing required frontmatter: title

⚠️  WARNINGS:
  Docs/Client.md: Missing breadcrumb navigation
```

### Verificar antes de fazer commit
```bash
# Antes de git commit, rode a validação
bun scripts/validate-vault.ts

# Se passou, faça o commit
git add Obsidian\ Vault/Docs/...
git commit -m "docs(vault): ..."
```

## 🔄 Pipeline GitHub Actions

**Arquivo:** `.github/workflows/vault.yml`

**Acionada quando:**
- PR com mudanças em `Obsidian Vault/**`
- Push em `main` ou `development` com mudanças na vault

**Checks executados:**
1. Validação via script TypeScript
2. Verificação de frontmatter YAML
3. Verificação de tags obrigatórias
4. Validação de links

**Resultado no PR:**
```
✅ All checks passed
or
❌ Obsidian Vault validation failed
```

## 📋 Padrão Obrigatório

Veja [[Rules/07 Vault Standard|07 Vault Standard]] para detalhes completos.

### Estrutura mínima de arquivo
```yaml
---
title: "Seu Título"
section: Docs          # ou Rules, Plans
tags: [versum, docs, tema-específico]
up: "[[Docs/_Index|Docs]]"
---

🏠 [[_Index|Home]] › 📚 [[Docs/_Index|Docs]] › **Seu Título**

---

# Seu Título

Conteúdo...
```

## ❌ Erros Comuns e Soluções

| Erro | Solução |
|:--|:--|
| `Missing required frontmatter: title` | Adicione `title: "..."` no YAML |
| `Tags must include: versum` | Adicione `versum` em tags: `[versum, docs, ...]` |
| `Invalid frontmatter format` | Certifique-se de ter `---` no início e fim |
| `Missing breadcrumb navigation` | Adicione `🏠 [[_Index\|Home]]` logo após frontmatter |
| `Link [[broken]]` might be broken | Use path completo: `[[Docs/Apps/Client/_Overview]]` |

## 🔧 Configuração da Pipeline

### Adicionar novo tipo de validação

Edite `scripts/validate-vault.ts` e procure por:

```typescript
function validateMarkdownFile(filePath: string): void {
  // Adicione sua validação aqui
  errors.push({
    file: relativePath,
    message: "Seu erro aqui",
    severity: "error" // ou "warning"
  });
}
```

### Desabilitar para um arquivo

Você não pode desabilitar a validação globalmente, mas pode:

1. Mover arquivo para fora de `Obsidian Vault/Docs/`
2. Renomear extensão (ex: `.md.bak`)
3. Contatar o time para adicionar exceção

## 📊 Status no Dashboard GitHub

- Vá para `https://github.com/seu-repo/actions`
- Procure por workflow "CI - Obsidian Vault"
- Clique no run mais recente para ver detalhes

## 🚨 Falhas em CI

Se o PR falhar:

1. **Leia a mensagem de erro** no Actions tab
2. **Rode localmente:** `bun scripts/validate-vault.ts`
3. **Corrija os erros**
4. **Faça commit** das mudanças
5. **Push novamente**

## 📝 Checklist para novo documento

- [ ] Arquivo em `Obsidian Vault/Docs/`, `Obsidian Vault/Rules/` ou `Obsidian Vault/Plans/`
- [ ] Frontmatter com `title`, `section`, `tags`, `up`
- [ ] Tag `versum` obrigatória
- [ ] Breadcrumb com `[[_Index|Home]]`
- [ ] Links usando `[[...]]` wiki-style
- [ ] Naveg no final com `◀ [...] ▶`
- [ ] Rodou `bun scripts/validate-vault.ts` ✅

## 🆘 Troubleshooting

**Pipeline lenta?**
- Primeira execução é mais lenta (setup do Bun)
- Depois fica mais rápido com cache

**Validação muito rigorosa?**
- Proposta de mudança para `scripts/validate-vault.ts`
- Discuta com o time

**Preciso desabilitar a pipeline?**
- Edite `.github/workflows/vault.yml` e faça PR
- Justifique a mudança

---

**Dúvidas?** Consulte:
- [[Rules/07 Vault Standard|Vault Standard]] — padrão completo
- [[Docs/_Index|Docs Index]] — todos os documentos
- [[AGENTS.md|AGENTS.md]] — stack e regras do projeto
