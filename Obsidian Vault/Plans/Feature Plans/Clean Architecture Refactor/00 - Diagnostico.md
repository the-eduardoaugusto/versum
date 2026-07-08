---
title: "Diagnóstico — Arquitetura Atual da API"
section: "Plans"
subsection: "Feature Plans"
tags: [versum, plans, refactor, clean-architecture, ddd, diagnostico]
up: "[[Plans/Feature Plans/Clean Architecture Refactor/_Index]]"
prev: "[[Plans/Feature Plans/Clean Architecture Refactor/_Index]]"
next: "[[Plans/Feature Plans/Clean Architecture Refactor/04 - Roadmap]]"
related: []
depth: 2
---

# 📋 Diagnóstico — Arquitetura Atual da API

🏠 [[_Index|Home]] › 🗺️ [[Plans/_Index|Plans]] › 🚀 [[Plans/Feature Plans/_Index|Feature Plans]] › 🏗️ [[Plans/Feature Plans/Clean Architecture Refactor/_Index|Clean Architecture Refactor]] › **Diagnóstico**

---

## Resumo

A API (`apps/api/src`) segue uma **arquitetura em camadas tradicional**: uma requisição HTTP entra no `controller`, o controller chama um `service` (onde mora a regra de negócio), o service chama um `repository` (que sabe conversar com o banco), e o repository fala com o banco de dados. É um fluxo em uma via só, sempre na mesma ordem.

Esse padrão **não é Clean Architecture nem Arquitetura Hexagonal** — dois nomes que você provavelmente vai ouvir em artigos sobre o assunto. Não precisa conhecer os dois a fundo pra seguir este plano, mas a ideia central dos dois é a mesma: a regra de negócio (o "o que o sistema faz") não deveria depender de detalhe técnico (banco, framework HTTP, biblioteca de e-mail) pra existir — deveria ser possível, em teoria, trocar o banco ou o framework sem reescrever a regra de negócio. Aqui isso não acontece: a regra de negócio está bem organizada, mas conhece demais dos detalhes técnicos por baixo (mais sobre isso no ponto 2 abaixo).

O domínio (as "coisas" que o sistema representa, tipo usuário, sessão, perfil) é **anêmico** — termo usado quando essas "coisas" são só pacotes de dados (campo + tipo, sem nenhum comportamento próprio), e toda a regra que devia estar dentro delas mora solta em outro lugar. É o oposto de um domínio "rico", onde a entidade sabe se validar e se comportar sozinha.

Isso tudo não é "código ruim" — é um padrão comum e que funciona bem até um certo tamanho de projeto. O ponto desse plano é reduzir 3 problemas concretos que já causam dor:

1. **Classes fazendo coisa demais.** Em termos técnicos, isso viola o **Princípio da Responsabilidade Única** (o "S" de **SOLID**, um conjunto de 5 boas práticas bem conhecidas de orientação a objetos). A regra prática é simples: uma classe deveria ter só **um motivo** pra precisar mudar. Se uma classe muda toda vez que a regra de e-mail muda E toda vez que a regra de sessão muda, ela tem dois motivos — e é candidata a ser dividida.
2. **Regra de negócio acoplada à infraestrutura** — os tipos que representam "usuário", "sessão" etc. são, literalmente, cópias da tabela do banco de dados. Detalhe explicado no ponto 2 abaixo.
3. **Falta de inversão de dependência real** — "inversão de dependência" (o "D" de SOLID) quer dizer: a regra de negócio depende de um contrato (uma `interface`, no sentido do TypeScript — uma lista de métodos que uma classe promete ter, sem dizer como), não de uma implementação concreta específica. Aqui já existe interface em alguns lugares, mas ninguém usa ela de verdade — detalhe no ponto 3 abaixo. Assunto aprofundado em [[Plans/Feature Plans/Clean Architecture Refactor/03 - Fundacao/02 - Interfaces de Repository|Interfaces de Repository]].

## Onde isso aparece

### 1. Classes com responsabilidade demais (o termo em inglês é "God Class" — uma classe que faz de tudo)

| Classe | Arquivo | O que ela faz que não devia |
|:--|:--|:--|
| `ProfileControllerV1` | `apps/api/src/modules/users/controllers/profile.v1.controller.ts` | Parseia HTTP, valida arquivo, redimensiona imagem, sobe/apaga do S3, chama o service — tudo no mesmo método (`uploadAvatar`, linhas 145-189) |
| `UserServiceV1` | `apps/api/src/modules/users/services/user.v1.service.ts` | O método `exportUserData` (linhas 138-228) faz o trabalho de um formatador/serializer de 6 tipos de dado diferentes dentro do service |
| `AuthServiceV1` | `apps/api/src/modules/auth/services/auth.v1.service.ts` | Gera token, faz hash de senha, lê template de e-mail do disco, envia e-mail e gerencia sessão — 4 responsabilidades numa classe só |

**Por que importa:** quando uma classe faz 4 coisas, qualquer mudança em uma delas arrisca quebrar as outras 3 sem querer, e o teste de uma responsabilidade fica difícil de isolar das demais.

### 2. Domínio acoplado à infraestrutura

Os tipos que representam entidades de negócio (`Session`, `Profile`, `User`) são gerados direto do schema do Drizzle:

```
Session = InferSelectModel<typeof sessions>
```

Isso significa que o "tipo de domínio" é literalmente a linha da tabela do banco. Se uma coluna mudar de nome no banco, a regra de negócio que usa esse tipo muda junto — mesmo que a regra de negócio em si não tenha mudado nada.

Outro sintoma do mesmo problema: `UserServiceV1.deleteUser` (linhas 117-136) recebe o objeto de transação do Drizzle direto como parâmetro, usando `as any` (um comando do TypeScript que desliga a checagem de tipo pra aquele valor, "confia em mim, sei o que é isso") pra disfarçar que aquele tipo nem devia estar ali — a ferramenta de banco vaza pra dentro da regra de negócio.

### 3. Interfaces que existem mas não desacoplam nada

Alguns repositórios (`AuthRepository`, `ConsentLogsRepository`) implementam uma interface (`iAuthRepository`, `ConsentLogsRepo`) — ou seja, existe um contrato formal dizendo quais métodos aquele repository promete ter. Isso parece inversão de dependência, mas na prática **os services nunca dependem da interface** — sempre importam a classe concreta (a implementação real) direto. A interface existe só de enfeite; não cumpre a função de permitir trocar a implementação (ex: por uma versão falsa/simplificada usada só em teste) sem tocar no service.

### 4. O que já está bom (não mexer)

- **Injeção de dependência manual funciona bem.** Todo service aceita repository via construtor opcional (`constructor({ repository }: {...} = {})`), e os testes já usam mocks desses repositórios — não batem em banco real. Isso é o ponto mais forte da arquitetura atual e **não deve ser quebrado** durante a refatoração.
- **Convenção de nomenclatura e separação de pastas é consistente** (`*.v1.service.ts`, `*.repository.ts`, módulo por domínio). Isso facilita achar código e deve ser mantido.

## O que este plano NÃO propõe

- Não propõe migrar pra Clean Architecture completa — isso envolveria criar uma camada de "casos de uso" (classes que representam uma ação de negócio inteira, tipo "fazer login" ou "trocar avatar", isoladas de qualquer detalhe de framework HTTP ou banco) e entidades ricas de verdade, com regras e validações fortes agrupadas dentro de "grupos" de objetos que sempre mudam juntos (isso é o que a literatura de DDD chama de "Aggregate" — não é um conceito que este plano usa, só citando pra explicar o que está sendo deixado de fora). Migrar pra isso seria uma reescrita, não uma refatoração — custo alto demais pro ganho no estágio atual do projeto.
- Não propõe trocar Drizzle, Hono ou qualquer peça do stack.
- Não propõe adicionar um sistema de fila/mensageria pra eventos de domínio agora — só documenta onde isso faria sentido no futuro ([[Plans/Feature Plans/Clean Architecture Refactor/03 - Fundacao/03 - Domain Events|ver página]]).

> Uma exceção pontual: a tarefa [[Plans/Feature Plans/Clean Architecture Refactor/02 - Users/01 - Extrair AvatarUploadUseCase|Extrair AvatarUploadUseCase]] cria uma única classe desse tipo "caso de uso", só porque o controller de avatar está fazendo orquestração demais (ver diagnóstico acima). Não é o início de uma camada obrigatória pra API inteira — é a ferramenta certa pra aquele problema específico.

O objetivo é **pragmático**: resolver a violação de Responsabilidade Única nos 3 pontos mais doloridos, e dar o primeiro passo real de inversão de dependência — sem reescrever a API.

---

◀ [[Plans/Feature Plans/Clean Architecture Refactor/_Index|Clean Architecture Refactor]] · [[Plans/Feature Plans/Clean Architecture Refactor/04 - Roadmap|Roadmap]] ▶
