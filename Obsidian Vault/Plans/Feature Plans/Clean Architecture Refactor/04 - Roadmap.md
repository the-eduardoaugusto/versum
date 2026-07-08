---
title: "Roadmap — Ordem de Execução"
section: "Plans"
subsection: "Feature Plans"
tags: [versum, plans, refactor, roadmap]
up: "[[Plans/Feature Plans/Clean Architecture Refactor/_Index]]"
prev: "[[Plans/Feature Plans/Clean Architecture Refactor/03 - Fundacao/_Index]]"
related: []
depth: 2
---

# 🗺️ Roadmap — Ordem de Execução

🏠 [[_Index|Home]] › 🗺️ [[Plans/_Index|Plans]] › 🚀 [[Plans/Feature Plans/_Index|Feature Plans]] › 🏗️ [[Plans/Feature Plans/Clean Architecture Refactor/_Index|Clean Architecture Refactor]] › **Roadmap**

---

## Ordem recomendada

As 5 tarefas concretas deste plano têm poucas dependências entre si. A ordem abaixo prioriza **ganho rápido com risco baixo primeiro**, deixando por último o que tem mais superfície de código tocada.

| Ordem | Tarefa | Por quê nessa posição |
|:--|:--|:--|
| 1 | [[Plans/Feature Plans/Clean Architecture Refactor/02 - Users/02 - Extrair UserDataExportMapper\|Extrair UserDataExportMapper]] | Menor risco de todo o plano — é transformação pura de dado, sem I/O, sem tocar em fluxo HTTP. Bom ponto de partida pra validar o padrão de organização (`mappers/`, `use-cases/`) que as próximas tarefas vão seguir. |
| 2 | [[Plans/Feature Plans/Clean Architecture Refactor/02 - Users/01 - Extrair AvatarUploadUseCase\|Extrair AvatarUploadUseCase]] | Maior ganho de testabilidade do plano — hoje esse fluxo não tem nenhum teste isolado. Depende só do padrão definido na tarefa 1 já estar validado. |
| 3 | [[Plans/Feature Plans/Clean Architecture Refactor/01 - Auth/01 - Separar AuthServiceV1\|Separar AuthServiceV1]] | Maior superfície tocada (fluxo de autenticação inteiro) — fazer só depois de já ter rodado o padrão de refatoração duas vezes nas tarefas 1 e 2, com mais confiança no processo. Exige teste manual do fluxo de login, então reservar tempo maior. |
| 4 | [[Plans/Feature Plans/Clean Architecture Refactor/03 - Fundacao/02 - Interfaces de Repository\|Interfaces de Repository]] | Baixo risco (é troca de tipo, o compilador pega qualquer erro), mas só faz sentido depois das tarefas 1-3, porque essas tarefas criam/movem services — melhor ajustar os tipos de repository uma vez só, depois que a estrutura de services já estiver estável. |
| 5 | [[Plans/Feature Plans/Clean Architecture Refactor/03 - Fundacao/01 - Value Objects\|Value Objects para tipos de domínio]] | Adoção incremental, sem prazo — começar pelo `Email`, que já tem regra de validação pronta esperando ser movida. Pode rodar em paralelo com qualquer outra tarefa, a qualquer momento. |

[[Plans/Feature Plans/Clean Architecture Refactor/03 - Fundacao/03 - Domain Events|Domain Events]] não entra nessa lista — é só documentação de referência, sem tarefa de implementação associada (ver a própria página pra entender quando reconsiderar isso).

## Regras que valem pra qualquer tarefa deste plano

- **Uma tarefa por PR/branch.** Não misturar duas tarefas no mesmo PR, mesmo que pareçam relacionadas — cada uma tem um raio de impacto e um risco diferentes, e revisar junto dificulta apontar o que quebrou se algo der errado.
- **Seguir o fluxo de git do projeto.** Base `development`, branch `refactor/<descrição>`, ver `AGENTS.md` na raiz do projeto pra regras completas de commit e PR.
- **Não fazer nada que este plano não pediu.** Se durante a execução de uma tarefa aparecer a vontade de "já que estou aqui, vou melhorar isso também" — anotar como tarefa nova nesta pasta em vez de fazer no mesmo PR.
- **`biome check` e `tsc --noEmit` antes de todo commit** — regra já existente no projeto (`AGENTS.md`), vale também pra essas refatorações.

## Status

Nenhuma tarefa foi iniciada ainda. Atualizar esta tabela conforme o trabalho avançar.

| Tarefa | Status |
|:--|:--|
| Extrair UserDataExportMapper | Não iniciado |
| Extrair AvatarUploadUseCase | Não iniciado |
| Separar AuthServiceV1 | Não iniciado |
| Interfaces de Repository | Não iniciado |
| Value Objects | Não iniciado |

---

◀ [[Plans/Feature Plans/Clean Architecture Refactor/03 - Fundacao/_Index|Fundação]] · 🏠 [[Plans/Feature Plans/Clean Architecture Refactor/_Index|Clean Architecture Refactor]]
