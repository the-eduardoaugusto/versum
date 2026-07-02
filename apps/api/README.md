# Versum API

API RESTful para o projeto Versum, construída com Bun, Hono e Drizzle ORM.

## Quick Start

```bash
# Instalar dependências
bun install

# Rodar em desenvolvimento
bun run src/index.ts

# Rodar CLI
bun run cli
```

## Estrutura do Projeto

```
src/
├── cli/               # Ferramentas de linha de comando
├── modules/           # Módulos da aplicação (auth, bible, users)
├── view-models/       # Modelos de resposta da API
├── infrastructure/   # Configurações de infraestrutura
└── utils/            # Utilitários
```

## Variáveis de Ambiente

```env
DATABASE_URL=postgresql://user:password@host:5432/database
PORT=3000
```

## CLI

A CLI oferece ferramentas para gerenciamento do banco de dados e geração de documentação:

```bash
bun run cli
```

Opções disponíveis:
- **Bíblia** - Seed e gerenciamento da Bíblia
- **Database** - Operações de banco de dados
- **Gerar Docs OpenAPI** - Gera documentação da API em markdown
- **Build** - Cria um zip do projeto

## Documentação da API

A documentação completa está disponível em:
- [`versum-api.squareweb.app/docs`](https://versum-api.squareweb.app/docs)

### Visão Geral

- **Versão:** 1.0.0
- **OpenAPI:** 3.0.0
- **Formato de resposta:** JSON
- **Convenções:** camelCase para propriedades de API

### Autenticação

A API utiliza autenticação via **Magic Link**:
1. Usuário solicita link mágico via `/api/v1/auth/magic-link`
2. Link contém token enviado por email
3. Token é validado em `/api/v1/auth/magic-link?token=...`
4. Sessão criada via cookie `__Host-session`

### Endpoints Públicos

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/api/v1/public/bible/books` | Listar livros da Bíblia |
| `GET` | `/api/v1/public/bible/books/{dynamicId}` | Obter livro por slug/nome |
| `GET` | `/api/v1/public/bible/books/{dynamicId}/chapters` | Listar capítulos |
| `GET` | `/api/v1/public/bible/books/{dynamicId}/chapters/{number}` | Obter capítulo |
| `GET` | `/api/v1/public/bible/books/{dynamicId}/chapters/{number}/verses` | Listar versículos |
| `GET` | `/api/v1/public/bible/books/{dynamicId}/chapters/{number}/verses/{verse}` | Obter versículo |

### Autenticação

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `POST` | `/api/v1/auth/magic-link` | Enviar magic link |
| `GET` | `/api/v1/auth/magic-link` | Validar token e autenticar |
| `POST` | `/api/v1/auth/logout` | Encerrar sessão |

### Usuários

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/api/v1/users/@me` | Obter usuário autenticado |
| `PATCH` | `/api/v1/users/@me` | Atualizar usuário autenticado |
| `DELETE` | `/api/v1/users/@me` | Deletar conta (LGPD Art. 18, VI) |
| `GET` | `/api/v1/users/@me/export` | Exportar dados pessoais (LGPD Art. 18, II e V) |

### Perfis

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `POST` | `/api/v1/profiles/@me` | Criar perfil |
| `GET` | `/api/v1/profiles/@me` | Obter perfil autenticado |
| `PATCH` | `/api/v1/profiles/@me` | Atualizar perfil |
| `GET` | `/api/v1/profiles/{username}` | Obter perfil por username |
| `GET` | `/api/v1/profiles/check-username/{username}` | Verificar disponibilidade de username |
| `POST` | `/api/v1/profiles/@me/avatar` | Upload de foto de perfil |
| `DELETE` | `/api/v1/profiles/@me/avatar` | Remover foto de perfil |

### Jornada de Leitura

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/api/v1/readings/feed` | Feed de leitura (capítulo atual + pre-fetch) |
| `POST` | `/api/v1/readings/next` | Confirmar leitura e avançar progresso |
| `GET` | `/api/v1/readings/status` | Status atual do progresso |

### Consentimentos

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `POST` | `/api/v1/consent` | Registrar consentimentos |
| `GET` | `/api/v1/consent` | Obter histórico de consentimentos |

## Schemas Principais

### User

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `email` | `string` | E-mail do usuário |

### Profile

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | `string` (uuid) | ID único do perfil |
| `userId` | `string` (uuid) | ID do usuário |
| `username` | `string` | Nome de usuário único |
| `name` | `string` | Nome de exibição |
| `bio` | `string` | Biografia (nullable) |
| `pictureUrl` | `string` | URL da foto de perfil (nullable) |
| `createdAt` | `string` | Data de criação |
| `updatedAt` | `string` | Data de atualização |

### Book

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | `string` (uuid) | ID único do livro |
| `order` | `integer` | Ordem canônica (1–73) |
| `name` | `string` | Nome do livro |
| `slug` | `string` | Slug do livro |
| `niceName` | `string` | Nome amigável |
| `testament` | `string` | `"OLD"` ou `"NEW"` |
| `totalChapters` | `integer` | Número total de capítulos |

### Verse

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | `string` (uuid) | ID único do versículo |
| `chapterId` | `string` (uuid) | ID do capítulo |
| `number` | `integer` | Número do versículo |
| `text` | `string` | Texto do versículo |

### Paginação

Endpoints que retornam listas aceitam os parâmetros:

| Parâmetro | Tipo | Padrão | Mínimo | Máximo |
|-----------|------|--------|--------|--------|
| `page` | `integer` | `1` | `1` | — |
| `limit` | `integer` | `10` | `1` | `50` |

A resposta inclui o objeto `pagination`:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `currentPage` | `integer` | Página atual |
| `totalPages` | `integer` | Número total de páginas |
| `totalItems` | `integer` | Número total de itens |
| `itemsPerPage` | `integer` | Itens por página |
| `hasNextPage` | `boolean` | Existe próxima página |
| `hasPrevPage` | `boolean` | Existe página anterior |

### Formato padrão de resposta

Todos os endpoints retornam:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `success` | `boolean` | `true` em caso de sucesso |
| `message` | `string` | Mensagem de contexto |
| `code` | `string` | Código legível da resposta |
| `data` | `any` | Payload (quando aplicável) |
| `pagination` | `object` | Metadados de paginação (quando aplicável) |

## Scripts

```bash
bun run src/index.ts       # Iniciar servidor
bun run cli                # Abrir CLI
bun run lint              # Verificar código
bun run typecheck         # Verificar tipos TypeScript
```
