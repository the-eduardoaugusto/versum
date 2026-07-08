---
title: "Clean Architecture Refactor"
section: "Plans"
subsection: "Feature Plans"
tags: [versum, plans, refactor, clean-architecture, ddd, api]
up: "[[Plans/Feature Plans/_Index]]"
related: ["[[Plans/Feature Plans/Clean Architecture Refactor/00 - Diagnostico]]", "[[Plans/Feature Plans/Clean Architecture Refactor/04 - Roadmap]]"]
depth: 1
---

# 🏗️ Clean Architecture Refactor

Plano de refatoração da API (`apps/api/src`) pra separar melhor "regra de negócio" (o que o sistema faz) de "infraestrutura" (banco, e-mail, arquivos) e quebrar classes que acumularam responsabilidade demais. Se os termos "clean architecture", "SOLID" ou "domínio anêmico" não dizem muita coisa pra você ainda, sem problema — o [[Plans/Feature Plans/Clean Architecture Refactor/00 - Diagnostico|Diagnóstico]] explica cada um deles com exemplo antes de usar.

> Este plano é só planejamento. Nenhum código foi alterado ainda. A branch `refactor/clean-architecture-ddd` existe só pra guardar esse plano até a implementação começar.

## Por onde começar

1. Leia o **[[Plans/Feature Plans/Clean Architecture Refactor/00 - Diagnostico|Diagnóstico]]** primeiro — explica o que está errado e por quê, com exemplos reais do código.
2. Depois veja o **[[Plans/Feature Plans/Clean Architecture Refactor/04 - Roadmap|Roadmap]]** — ordem recomendada de execução e por quê.
3. Cada refatoração específica tem sua própria página, agrupada por módulo.

## Conteúdo

| Área | Descrição | Link |
|:--|:--|:--|
| 📋 Diagnóstico | Situação atual da arquitetura, explicada | [[Plans/Feature Plans/Clean Architecture Refactor/00 - Diagnostico\|Abrir]] |
| 🔐 Módulo Auth | Separar `AuthServiceV1` em dois serviços menores | [[Plans/Feature Plans/Clean Architecture Refactor/01 - Auth/_Index\|Abrir]] |
| 👤 Módulo Users | Tirar responsabilidades demais do controller e do service | [[Plans/Feature Plans/Clean Architecture Refactor/02 - Users/_Index\|Abrir]] |
| 🧱 Fundação (cross-cutting) | Mudanças estruturais que valem pra API inteira | [[Plans/Feature Plans/Clean Architecture Refactor/03 - Fundacao/_Index\|Abrir]] |
| 🗺️ Roadmap | Ordem de execução recomendada e dependências entre tarefas | [[Plans/Feature Plans/Clean Architecture Refactor/04 - Roadmap\|Abrir]] |

## Como usar essas páginas

Cada tarefa individual segue sempre a mesma estrutura, pra facilitar navegação:

- **Contexto** — o que existe hoje e qual o problema (com arquivo e linha exatos)
- **Objetivo** — o que deve existir depois da mudança
- **Passo a passo** — sequência de ações, uma de cada vez
- **Arquivos afetados** — o que cria, o que move, o que modifica
- **Como testar** — o que rodar/verificar antes de considerar a tarefa pronta
- **Riscos** — o que pode quebrar se a tarefa for malfeita

Nenhuma página tem código de exemplo solto — só assinaturas de método quando forem essenciais pra entender a interface. O objetivo é que qualquer dev (júnior incluso) consiga pegar uma tarefa e executar sem precisar adivinhar nada, mas sem o plano virar código morto que desatualiza rápido.

---

◀ [[Plans/Feature Plans/_Index|Feature Plans]]
