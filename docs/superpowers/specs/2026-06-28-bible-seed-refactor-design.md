# Spec: Refatoração do Seed da Bíblia via GitHub Raw API

**Data:** 2026-06-28  
**Branch:** `refator/bible-json-in-cli`  
**Escopo:** `apps/api/src/cli/modules/bible/`

---

## Problema

O seed atual exige que o usuário forneça um path de arquivo JSON local gerado previamente pela própria CLI. Isso cria fricção: é preciso ter rodado um passo de geração antes de poder semear o banco. O objetivo é eliminar essa dependência e buscar os dados diretamente do repositório [biblia-db](https://github.com/Dancrf/biblia-db).

---

## Fonte de dados

Repositório público: `https://github.com/Dancrf/biblia-db`  
Base das URLs raw: `https://raw.githubusercontent.com/Dancrf/biblia-db/refs/heads/main/`

Estrutura:
- `antigotestamento/<slug>.json` — 46 livros
- `novotestamento/<slug>.json` — 27 livros
- Total: **73 livros**

Formato de cada arquivo:
```ts
type LivroBibliaDB = {
  livro: string                  // nome completo, ex: "Gênesis"
  capitulos: {
    capitulo: number
    versiculos: {
      numero: number
      texto: string
    }[]
  }[]
}
```

---

## Arquitetura

### Arquivos removidos
- `seed/helpers/find-cli-output-files.ts` — não tem mais uso

### Arquivos modificados

**`seed/bible-books.constants.ts`** (novo)  
Lista canônica hardcoded dos 73 livros com slug do arquivo e testamento. Usada tanto pelo fetcher quanto pelo integrity check.

```ts
type BibleBookEntry = {
  slug: string       // nome do arquivo sem extensão, ex: "gn"
  testament: "OLD" | "NEW"
}
```

**`bible-json-normalize.ts`**  
Adiciona suporte ao novo formato `LivroBibliaDB`. Mantém compatibilidade com o formato gerado existente para não quebrar nada. A função principal `normalizeBibleJsonForSeed` continua a mesma assinatura; internamente detecta o formato pelo campo `livro` (string) vs `books` (array).

**`seed/seed.action.ts`**  
Remove toda a lógica de leitura de arquivo local (`Bun.file`). Adiciona:
1. Fetch paralelo de todos os 73 JSONs via `Promise.allSettled`
2. Integrity check antes de qualquer operação no banco
3. Construção da `NormalizedBible` diretamente dos dados fetchados

**`seed/seed.menus.ts`**  
Remove `seedBibleJsonPathPrompt` (e a validação de path). Mantém `confirmSeedPromptMenu` e `seedOptionsPromptMenu`.

**`bible.action.ts`**  
Remove o passo de prompt de path de arquivo. Novo fluxo:
1. Menu bible → "Seed"
2. Confirmar
3. Selecionar opções (livros/capítulos/versículos)
4. `seedBibleFromRemote(options)`

---

## Integrity check

Executado antes de qualquer escrita no banco. Falha se:
- Qualquer fetch retornar status HTTP != 200
- O JSON não tiver campo `livro` (string não-vazia)
- O JSON não tiver campo `capitulos` (array com length > 0)
- Total de livros recebidos != 73

Em caso de falha, a CLI imprime quais slugs falharam e aborta sem tocar no banco.

---

## Fluxo completo da CLI (novo)

```
Menu principal → Bíblia → Seed
  → confirmSeedPromptMenu()         // "Confirmar seed da bíblia?"
  → seedOptionsPromptMenu()         // [livros, capítulos, versículos]
  → [fetching] fetch paralelo 73 JSONs
  → [integrity] valida todos
    → falha → imprime erros, aborta
  → [seed] processBook() para cada livro (lógica existente mantida)
  → summary + Discord webhook
```

---

## Derivação de metadados por livro

| Campo DB | Fonte |
|---|---|
| `name` | `livro` do JSON (ex: `"Gênesis"`) |
| `niceName` | mesmo que `name` |
| `slug` | slug do arquivo (ex: `gn` de `gn.json`) |
| `testament` | derivado da constante (`"OLD"` ou `"NEW"`) |
| `order` | índice posicional na lista canônica (1-based) |

---

## O que não muda

- Lógica de `processBook` (inserção de livros/capítulos/versículos)
- Discord webhook
- Opções de seed (livros/capítulos/versículos independentes)
- Schema do banco
