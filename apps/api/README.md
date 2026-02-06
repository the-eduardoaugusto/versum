# 📖 Versum API

Bem-vindo à API Versum! Uma API RESTful robusta e escalável para acesso a conteúdo bíblico com suporte a cache, rate limiting e paginação.

---

## 🚀 Características

- ✅ **Cache de 300 segundos** nas rotas públicas
- ✅ **Rate Limiting** de 60 requisições por minuto
- ✅ **Paginação** em todas as listas
- ✅ **Documentação Swagger** completa
- ✅ **Tratamento de erros** robusto
- ✅ **Validação de parâmetros** em todas as rotas

---

## � Documentação

### 🌐 Rotas Públicas

As rotas públicas são endpoints abertos para acesso sem autenticação, com suporte a cache e rate limiting.

#### 🔖 Livros Bíblicos

##### `GET /v1/public/bible/books`

Retorna todos os livros bíblicos disponíveis na base de dados.

**📋 Parâmetros de Query:**

| Parâmetro   | Tipo   | Descrição                                             | Exemplo |
| ----------- | ------ | ----------------------------------------------------- | ------- |
| `page`      | string | Número da página para paginação (começa em 1)         | `1`     |
| `limit`     | string | Quantidade de livros por página                       | `10`    |
| `testament` | string | Filtro por testamento: `OLD` (Antigo) ou `NEW` (Novo) | `OLD`   |

**✅ Respostas de Sucesso:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "order": 1,
      "name": "Gênesis",
      "abbreviation": "Gn",
      "testament": "OLD"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 66
  }
}
```

**❌ Respostas de Erro:**

| Código | Descrição                | Exemplo                                                                    |
| ------ | ------------------------ | -------------------------------------------------------------------------- |
| `400`  | Parâmetros inválidos     | `{ "success": false, "error": "Página deve ser um número positivo" }`      |
| `500`  | Erro interno do servidor | `{ "success": false, "message": "Erro ao buscar livros", "error": "..." }` |

**⚡ Performance:**

- 🔄 Cache: 300 segundos
- 🚦 Rate Limit: 60 requisições/minuto
- 📊 Headers de Rate Limit: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

---

##### `GET /v1/public/bible/books/{bookOrder}`

Retorna um livro bíblico específico pelo seu número de ordem.

**📋 Parâmetros:**

| Parâmetro   | Localização | Tipo   | Obrigatório | Descrição                          | Exemplo |
| ----------- | ----------- | ------ | ----------- | ---------------------------------- | ------- |
| `bookOrder` | Path        | string | ✅ Sim      | Número de ordem do livro (1-73)    | `1`     |

**✅ Respostas de Sucesso:**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "order": 1,
    "name": "Gênesis",
    "abbreviation": "Gn",
    "testament": "OLD"
  }
}
```

**❌ Respostas de Erro:**

| Código | Descrição                | Exemplo                                                                           |
| ------ | ------------------------ | --------------------------------------------------------------------------------- |
| `400`  | Parâmetros inválidos     | `{ "success": false, "error": "Informe o livro utilizando sua posição (1-73)." }` |
| `404`  | Livro não encontrado     | `{ "success": false, "message": "Livro não encontrado" }`                         |
| `500`  | Erro interno do servidor | `{ "success": false, "message": "Erro ao buscar livro" }`                         |

**⚡ Performance:**

- 🔄 Cache: 300 segundos
- 🚦 Rate Limit: 60 requisições/minuto

---

#### 📖 Capítulos Bíblicos

##### `GET /v1/public/bible/books/{bookOrder}/chapters`

Retorna todos os capítulos de um livro bíblico específico.

**📋 Parâmetros:**

| Parâmetro   | Localização | Tipo   | Obrigatório | Descrição                          | Exemplo |
| ----------- | ----------- | ------ | ----------- | ---------------------------------- | ------- |
| `bookOrder` | Path        | string | ✅ Sim      | Número de ordem do livro (1-73)    | `1`     |
| `page`      | Query       | string | ❌ Não      | Número da página para paginação    | `1`     |
| `limit`     | Query       | string | ❌ Não      | Quantidade de capítulos por página | `10`    |

**✅ Respostas de Sucesso:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "number": 1,
      "bookOrder": 1,
      "versesCount": 31
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50
  }
}
```

**❌ Respostas de Erro:**

| Código | Descrição                | Exemplo                                                                           |
| ------ | ------------------------ | --------------------------------------------------------------------------------- |
| `400`  | Parâmetros inválidos     | `{ "success": false, "error": "Informe o livro utilizando sua posição (1-73)." }` |
| `404`  | Livro não encontrado     | `{ "success": false, "message": "Livro não encontrado" }`                         |
| `500`  | Erro interno do servidor | `{ "success": false, "message": "Erro ao buscar capítulos" }`                     |

**⚡ Performance:**

- 🔄 Cache: 300 segundos
- 🚦 Rate Limit: 60 requisições/minuto

---

##### `GET /v1/public/bible/books/{bookOrder}/chapters/{chapterNumber}`

Retorna um capítulo bíblico específico de um livro específico.

**📋 Parâmetros:**

| Parâmetro       | Localização | Tipo   | Obrigatório | Descrição                           | Exemplo |
| --------------- | ----------- | ------ | ----------- | ----------------------------------- | ------- |
| `bookOrder`     | Path        | string | ✅ Sim      | Número de ordem do livro (1-73)     | `1`     |
| `chapterNumber` | Path        | string | ✅ Sim      | Número do capítulo (mínimo 1)       | `1`     |

**✅ Respostas de Sucesso:**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "number": 1,
    "bookOrder": 1,
    "versesCount": 31
  }
}
```

**❌ Respostas de Erro:**

| Código | Descrição                | Exemplo                                                                                      |
| ------ | ------------------------ | -------------------------------------------------------------------------------------------- |
| `400`  | Parâmetros inválidos     | `{ "success": false, "error": "Informe números válidos para livro e capítulo." }`           |
| `404`  | Capítulo não encontrado  | `{ "success": false, "error": "Capítulo não encontrado nesse livro." }`                      |
| `500`  | Erro interno do servidor | `{ "success": false, "error": "Erro ao buscar capítulo!" }`                                  |

**⚡ Performance:**

- 🔄 Cache: 300 segundos
- 🚦 Rate Limit: 60 requisições/minuto

---

#### ✨ Versículos Bíblicos

##### `GET /v1/public/bible/books/{bookOrder}/chapters/{chapterNumber}/verses`

Retorna todos os versículos de um capítulo bíblico específico.

**📋 Parâmetros:**

| Parâmetro       | Localização | Tipo   | Obrigatório | Descrição                           | Exemplo |
| --------------- | ----------- | ------ | ----------- | ----------------------------------- | ------- |
| `bookOrder`     | Path        | string | ✅ Sim      | Número de ordem do livro (1-73)     | `1`     |
| `chapterNumber` | Path        | string | ✅ Sim      | Número do capítulo (mínimo 1)       | `1`     |
| `page`          | Query       | string | ❌ Não      | Número da página para paginação     | `1`     |
| `limit`         | Query       | string | ❌ Não      | Quantidade de versículos por página | `10`    |

**✅ Respostas de Sucesso:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "number": 1,
      "text": "No princípio, criou Deus os céus e a terra.",
      "bookOrder": 1,
      "chapterNumber": 1
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 31
  }
}
```

**❌ Respostas de Erro:**

| Código | Descrição                | Exemplo                                                                                      |
| ------ | ------------------------ | -------------------------------------------------------------------------------------------- |
| `400`  | Parâmetros inválidos     | `{ "success": false, "error": "Informe números válidos para livro, capítulo e versículo." }` |
| `404`  | Capítulo não encontrado  | `{ "success": false, "error": "Capítulo não encontrado nesse livro." }`                      |
| `500`  | Erro interno do servidor | `{ "success": false, "error": "Erro ao buscar versículos!" }`                                |

**⚡ Performance:**

- 🔄 Cache: 300 segundos
- 🚦 Rate Limit: 60 requisições/minuto

---

##### `GET /v1/public/bible/books/{bookOrder}/chapters/{chapterNumber}/verses/{verseNumber}`

Retorna um versículo bíblico específico de um capítulo e livro específicos.

**📋 Parâmetros:**

| Parâmetro       | Localização | Tipo   | Obrigatório | Descrição                           | Exemplo |
| --------------- | ----------- | ------ | ----------- | ----------------------------------- | ------- |
| `bookOrder`     | Path        | string | ✅ Sim      | Número de ordem do livro (1-73)     | `1`     |
| `chapterNumber` | Path        | string | ✅ Sim      | Número do capítulo (mínimo 1)       | `1`     |
| `verseNumber`   | Path        | string | ✅ Sim      | Número do versículo (mínimo 1)      | `1`     |

**✅ Respostas de Sucesso:**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "number": 1,
    "text": "No princípio, criou Deus os céus e a terra.",
    "bookOrder": 1,
    "chapterNumber": 1
  }
}
```

**❌ Respostas de Erro:**

| Código | Descrição                | Exemplo                                                                                      |
| ------ | ------------------------ | -------------------------------------------------------------------------------------------- |
| `400`  | Parâmetros inválidos     | `{ "success": false, "error": "Informe números válidos para livro, capítulo e versículo." }` |
| `404`  | Versículo não encontrado | `{ "success": false, "error": "Versículo não encontrado." }`                                 |
| `500`  | Erro interno do servidor | `{ "success": false, "error": "Erro ao buscar versículo!" }`                                 |

**⚡ Performance:**

- 🔄 Cache: 300 segundos
- 🚦 Rate Limit: 60 requisições/minuto

---

### 🔐 Rotas Autenticadas

_Documentação de rotas autenticadas (autenticação, usuários, etc.) será adicionada em breve._

---

### 🔐 Autenticação (Em desenvolvimento)

_Rotas de autenticação serão documentadas aqui em breve._

---

## 📝 Notas de Desenvolvimento

### Estrutura de Resposta

Todas as rotas seguem um padrão consistente de resposta:

```typescript
{
  success: boolean;
  data?: any;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
  }
}
```

### Rate Limiting

- 🚦 **Limite**: 60 requisições por minuto por IP
- 📊 **Headers informativos**:
  - `X-RateLimit-Limit`: Limite total de requisições
  - `X-RateLimit-Remaining`: Requisições restantes
  - `X-RateLimit-Reset`: Timestamp do reset

### Cache

- 🔄 **TTL**: 300 segundos (5 minutos)
- 💾 **Middleware**: Implementado em `/src/middlewares/cache-public-routes/`

### Paginação

Todas as rotas com listagem suportam paginação através dos parâmetros `page` e `limit`.

## 📞 Suporte

Para mais informações sobre a API, consulte a documentação Swagger em `/docs` ou verifique os arquivos de configuração em `/src/swaggers/`.

---

**Última atualização**: January 2026
