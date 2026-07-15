---
title: "Módulo Seed — Log no Discord"
section: "Plans"
subsection: "Feature Plans"
tags: [versum, plans, go, aprendizado, bible, seed, clean-architecture]
up: "[[Plans/Feature Plans/Port para Go/03 - Módulo Seed/_Index]]"
prev: "[[Plans/Feature Plans/Port para Go/03 - Módulo Seed/03 - Geração de ID e Persistência]]"
next: "[[Plans/Feature Plans/Port para Go/03 - Módulo Seed/05 - Montagem Final (main.go)]]"
related: []
depth: 3
---

# 💬 Módulo Seed — Log no Discord

🏠 [[_Index|Home]] › 🗺️ [[Plans/_Index|Plans]] › 🚀 [[Plans/Feature Plans/_Index|Feature Plans]] › 🐹 [[Plans/Feature Plans/Port para Go/_Index|Port para Go]] › [[Plans/Feature Plans/Port para Go/03 - Módulo Seed/_Index|Módulo Seed]] › **Log no Discord**

---

## Terceira rodada: três problemas concretos na versão anterior

1. **`internal/discord` se chamava "discord" mas só sabia falar webhook.** Nada no nome do pacote nem no tipo `Repository` deixava isso explícito — quem lesse `discord.NewRepository(webhookURL, client)` não tinha como saber, só pelo nome, que aquilo é especificamente a API de webhook do Discord (que é bem diferente da API de bot, por exemplo: autenticação diferente, endpoints diferentes, capacidades diferentes). Se um dia o projeto precisar de Discord via bot token, não tem pra onde crescer sem reescrever o que já existe.
2. **`Repository.Edit` assumia que toda mensagem publicada pode ser editada depois.** Isso é verdade pra Discord e Slack, mas não é uma verdade sobre "canal remoto de log" em geral — e-mail, SMS, um webhook simples de "dispara e esquece" não têm conceito de "editar mensagem por ID". A interface anterior obrigava **toda** implementação a ter `Edit`, mesmo quando não faz sentido nenhum ter.
3. **Tudo isso ficava implícito.** Nada no código avisava "esse `Repository` só serve pra canais editáveis" — só ia quebrar em runtime, de um jeito confuso, se alguém tentasse usar um canal sem suporte a edição.

A correção: separar **o que é obrigatório** (publicar um log) do **que é opcional** (editar um log já publicado) em duas interfaces — e separar **o cliente HTTP puro do Discord** (que não sabe nada sobre `remotelog`) do **adapter que traduz `remotelog` pra Discord** (que não sabe nada sobre HTTP).

## Domínio — `internal/remote-log`, com capacidade opcional explícita

`Publisher` é o mínimo que qualquer canal precisa saber fazer. `Editor` é uma capacidade **separada** — só quem realmente suporta editar mensagem implementa ela. Isso é o mesmo padrão da própria `stdlib` do Go (`io.Writer` é obrigatório, `io.ReaderAt`/`io.Seeker` são capacidades extras que só alguns tipos têm — quem consome faz *type assertion* pra descobrir se o valor concreto suporta ou não).

```go
// internal/remote-log/log.go
package remotelog

type Level string

const (
	LevelDebug   Level = "debug"
	LevelInfo    Level = "info"
	LevelSuccess Level = "success"
	LevelAlert   Level = "alert"
	LevelError   Level = "error"
)

// MetaField is an optional key/value pair attached to the log. It's a
// slice, not a map, because display order matters. The caller decides
// which fields exist and what they're called; this package never invents
// field names on its own.
type MetaField struct {
	Key   string
	Value string
}

// RawLog is what any caller builds to publish a log — without knowing
// anything about which channel will receive it.
type RawLog struct {
	Slug    string
	Level   Level
	Message string
	Meta    []MetaField
}

type Log struct {
	MessageID string
	RawLog
}
```

```go
// internal/remote-log/publisher.go
package remotelog

import "context"

// Publisher is the minimum contract for any remote-log channel: publish
// one log entry, once. Every implementation must satisfy this — including
// channels that can only fire-and-forget (email, SMS, a plain webhook
// with no edit endpoint).
type Publisher interface {
	Publish(ctx context.Context, raw *RawLog) (*Log, error)
}
```

```go
// internal/remote-log/editor.go
package remotelog

import "context"

// Editor is an optional capability on top of Publisher: only channels
// that support editing an already-sent message (Discord, Slack) implement
// it. A Publisher that doesn't implement Editor simply can't have its
// messages updated — Service.Update fails explicitly (ErrNotEditable)
// instead of assuming every channel can do this.
type Editor interface {
	Edit(ctx context.Context, messageID string, raw *RawLog) (*Log, error)
}
```

```go
// internal/remote-log/service.go
package remotelog

import (
	"context"
	"errors"
)

var ErrNotEditable = errors.New("remotelog: publisher does not support editing messages")

type Service struct {
	publisher Publisher
}

func NewService(publisher Publisher) *Service {
	return &Service{publisher: publisher}
}

func (s *Service) Notify(ctx context.Context, raw RawLog) (*Log, error) {
	return s.publisher.Publish(ctx, &raw)
}

// Update edits a previously published message. It only works if the
// concrete Publisher passed to NewService also implements Editor — the
// check is explicit, not assumed.
func (s *Service) Update(ctx context.Context, messageID string, raw RawLog) (*Log, error) {
	editor, ok := s.publisher.(Editor)
	if !ok {
		return nil, ErrNotEditable
	}
	return editor.Edit(ctx, messageID, &raw)
}
```

`internal/taskrun/run.go` não muda nada — continua chamando `notifier.Notify`/`notifier.Update` com a mesma assinatura. A diferença é que agora, se alguém injetar um canal que não implementa `Editor`, o erro é explícito (`remotelog.ErrNotEditable`) na primeira chamada de `Update`, em vez de o `Repository` antigo forçar `Edit` a existir em toda implementação mesmo quando não faz sentido. Vale deixar isso documentado no próprio `taskrun`:

```go
// internal/taskrun/run.go
package taskrun

// Notifier is the subset of remotelog.Service that Run needs. Run always
// edits the same message after the first Append/Start, so the publisher
// backing this Notifier must implement remotelog.Editor — if it doesn't,
// Update returns remotelog.ErrNotEditable on the first edit attempt.
type Notifier interface {
	Notify(ctx context.Context, raw remotelog.RawLog) (*remotelog.Log, error)
	Update(ctx context.Context, messageID string, raw remotelog.RawLog) (*remotelog.Log, error)
}

// ... resto do arquivo sem mudança (ver versão anterior desta página no histórico)
```

## `internal/discord` — só os tipos que o Discord define, nada de HTTP

Antes de qualquer transporte (webhook, bot, o que vier depois), fica o vocabulário puro da API de embeds do Discord — `Embed`, `EmbedField`, cores, os limites de tamanho que a própria Discord impõe. Esse pacote **nunca importa `net/http`, nunca importa `remotelog`** — é só o dicionário de tipos que qualquer forma de falar com o Discord vai precisar.

```go
// internal/discord/embed.go
package discord

import (
	"fmt"
	"time"
)

const (
	ColorGray    = 0x95A5A6 // low priority
	ColorDefault = 0x5865F2 // blurple, neutral
	ColorRed     = 0xED4245 // error
	ColorGreen   = 0x57F287 // success
	ColorOrange  = 0xE67E22 // alert
)

type EmbedField struct {
	Name   string `json:"name"`
	Value  string `json:"value"`
	Inline bool   `json:"inline"`
}

type Embed struct {
	Title       string       `json:"title"`
	Description string       `json:"description"`
	Fields      []EmbedField `json:"fields,omitempty"`
	Color       int          `json:"color,omitempty"`
	Timestamp   string       `json:"timestamp,omitempty"`
}

func NewEmbed(title, description, timestamp string, fields []EmbedField, color int) (Embed, error) {
	if len(title) > 256 {
		return Embed{}, fmt.Errorf("discord: embed title exceeds 256 characters")
	}
	if len(description) > 4096 {
		return Embed{}, fmt.Errorf("discord: embed description exceeds 4096 characters")
	}
	if _, err := time.Parse(time.RFC3339, timestamp); err != nil {
		return Embed{}, fmt.Errorf("discord: invalid timestamp: %w", err)
	}

	return Embed{
		Title:       title,
		Description: description,
		Fields:      fields,
		Color:       color,
		Timestamp:   timestamp,
	}, nil
}

func NewEmbedField(name, value string, inline bool) (EmbedField, error) {
	if len(name) > 256 {
		return EmbedField{}, fmt.Errorf("discord: field name exceeds 256 characters")
	}
	if len(value) > 1024 {
		return EmbedField{}, fmt.Errorf("discord: field value exceeds 1024 characters")
	}
	return EmbedField{Name: name, Value: value, Inline: inline}, nil
}
```

Repare que não tem `colorFor` aqui. Mapear `remotelog.Level` pra uma cor é uma decisão de quem está adaptando `remotelog` pro Discord — não é o vocabulário do Discord em si. Esse pacote não sabe que `remotelog` existe.

## `internal/discord/webhook` — cliente explícito da API de Webhook

Um cliente HTTP fino, específico da API de Webhook do Discord (`POST /webhooks/{id}/{token}?wait=true`, `PATCH /webhooks/{id}/{token}/messages/{message_id}`). Não sabe nada sobre logs, níveis ou `remotelog` — só sabe criar e editar uma mensagem via webhook. Reutilizável por qualquer coisa que precise mandar embeds pro Discord por webhook, não só o log do seed.

```go
// internal/discord/webhook/client.go
package webhook

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/eduardoaugustolb/versum/apps/api-go/internal/discord"
)

// Client is a thin wrapper around Discord's Webhook HTTP API. It knows
// nothing about logs, levels, or any application domain — only how to
// create and edit a message through a webhook URL.
type Client struct {
	url  string
	http *http.Client
}

func NewClient(url string, httpClient *http.Client) *Client {
	return &Client{url: url, http: httpClient}
}

func (c *Client) CreateMessage(ctx context.Context, embeds []discord.Embed) (messageID string, err error) {
	body, err := json.Marshal(map[string]any{"embeds": embeds})
	if err != nil {
		return "", fmt.Errorf("webhook: marshaling payload: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.url+"?wait=true", bytes.NewReader(body))
	if err != nil {
		return "", fmt.Errorf("webhook: building request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	res, err := c.http.Do(req)
	if err != nil {
		return "", fmt.Errorf("webhook: sending request: %w", err)
	}
	defer res.Body.Close()

	var data struct {
		ID string `json:"id"`
	}
	if err := json.NewDecoder(res.Body).Decode(&data); err != nil {
		return "", fmt.Errorf("webhook: decoding response: %w", err)
	}
	return data.ID, nil
}

func (c *Client) EditMessage(ctx context.Context, messageID string, embeds []discord.Embed) error {
	body, err := json.Marshal(map[string]any{"embeds": embeds})
	if err != nil {
		return fmt.Errorf("webhook: marshaling payload: %w", err)
	}

	url := fmt.Sprintf("%s/messages/%s", c.url, messageID)
	req, err := http.NewRequestWithContext(ctx, http.MethodPatch, url, bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("webhook: building request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	res, err := c.http.Do(req)
	if err != nil {
		return fmt.Errorf("webhook: sending request: %w", err)
	}
	defer res.Body.Close()
	return nil
}
```

E o adapter — a única peça que conhece `remotelog` **e** `webhook.Client` ao mesmo tempo. Explicitamente nomeado pelo que faz: `RemoteLogRepository`, não `Repository`.

```go
// internal/discord/webhook/remotelog_repository.go
package webhook

import (
	"context"
	"fmt"
	"time"

	"github.com/eduardoaugustolb/versum/apps/api-go/internal/discord"
	remotelog "github.com/eduardoaugustolb/versum/apps/api-go/internal/remote-log"
)

// maxDescriptionChars is Discord's hard limit for an embed description
// (4096 chars), minus room for the "**Logs:**\n```\n...\n```" wrapper
// this file adds around the raw message.
const maxDescriptionChars = 3800

// RemoteLogRepository adapts remotelog.Publisher and remotelog.Editor to
// a Discord webhook Client. This is the only place in the project that
// knows "log level maps to embed color" and "an oversized message gets
// truncated to fit Discord's embed limits" — Client itself knows neither.
type RemoteLogRepository struct {
	client *Client
}

func NewRemoteLogRepository(client *Client) *RemoteLogRepository {
	return &RemoteLogRepository{client: client}
}

func (r *RemoteLogRepository) Publish(ctx context.Context, raw *remotelog.RawLog) (*remotelog.Log, error) {
	embed, err := r.buildEmbed(raw)
	if err != nil {
		return nil, err
	}

	id, err := r.client.CreateMessage(ctx, []discord.Embed{embed})
	if err != nil {
		return nil, err
	}

	return &remotelog.Log{MessageID: id, RawLog: *raw}, nil
}

func (r *RemoteLogRepository) Edit(ctx context.Context, messageID string, raw *remotelog.RawLog) (*remotelog.Log, error) {
	embed, err := r.buildEmbed(raw)
	if err != nil {
		return nil, err
	}

	if err := r.client.EditMessage(ctx, messageID, []discord.Embed{embed}); err != nil {
		return nil, err
	}

	return &remotelog.Log{MessageID: messageID, RawLog: *raw}, nil
}

func (r *RemoteLogRepository) buildEmbed(raw *remotelog.RawLog) (discord.Embed, error) {
	fields := make([]discord.EmbedField, 0, len(raw.Meta))
	for _, m := range raw.Meta {
		field, err := discord.NewEmbedField(m.Key, m.Value, true)
		if err != nil {
			return discord.Embed{}, err
		}
		fields = append(fields, field)
	}

	description := fmt.Sprintf("**Logs:**\n```\n%s\n```", truncate(raw.Message))

	return discord.NewEmbed(raw.Slug, description, time.Now().Format(time.RFC3339), fields, colorFor(raw.Level))
}

func colorFor(level remotelog.Level) int {
	switch level {
	case remotelog.LevelError:
		return discord.ColorRed
	case remotelog.LevelAlert:
		return discord.ColorOrange
	case remotelog.LevelSuccess:
		return discord.ColorGreen
	case remotelog.LevelDebug:
		return discord.ColorGray
	default:
		return discord.ColorDefault
	}
}

// truncate keeps only the tail of msg when it doesn't fit the embed
// description limit — the most recent lines matter more than the oldest
// ones for a running log.
func truncate(msg string) string {
	if len(msg) <= maxDescriptionChars {
		return msg
	}
	return "...\n" + msg[len(msg)-maxDescriptionChars:]
}
```

Note que `RemoteLogRepository` implementa **as duas** interfaces do domínio (`Publish` satisfaz `remotelog.Publisher`, `Edit` satisfaz `remotelog.Editor`) — porque webhook do Discord de fato suporta as duas coisas. Isso é uma verdade sobre o webhook do Discord especificamente, não uma imposição da interface genérica.

## Por que isso resolve os três problemas

1. **Ainda acoplado?** Não do mesmo jeito: `taskrun` e `seed.go` continuam vendo só `remotelog.Service`/`taskrun.Run`. A diferença é que agora, se o canal por trás não suportar edição, isso falha explicitamente (`remotelog.ErrNotEditable`) em vez de ser uma pré-condição silenciosa que só uma implementação real (Discord) por acaso satisfazia.
2. **`discord` limitado a webhook, de forma implícita?** Agora é explícito na estrutura de pastas: `internal/discord` é só o vocabulário (Embed/cores/limites), `internal/discord/webhook` é o transporte específico de webhook — o nome do pacote já diz o que ele é. Adicionar bot no futuro é criar `internal/discord/bot/` do lado, reaproveitando `internal/discord.Embed`, sem tocar em `webhook/`.
3. **Implícito → explícito**, ponto a ponto: `webhook.NewClient` diz que é um cliente de webhook (não "Discord" genérico); `webhook.NewRemoteLogRepository` diz que adapta especificamente pro domínio `remotelog`; `remotelog.Editor` diz explicitamente "isso é opcional, nem todo canal tem"; `Service.Update` retorna um erro nomeado (`ErrNotEditable`) em vez de deixar a ausência de suporte aparecer como um `nil` misterioso ou um panic.

## Estrutura de pastas deste módulo

```
internal/
  remote-log/
    log.go          → Level, MetaField, RawLog, Log
    publisher.go     → interface Publisher (obrigatória)
    editor.go          → interface Editor (opcional)
    service.go           → Service (Notify sempre funciona; Update falha explícito se não editável)
  taskrun/
    run.go            → Run — usa remotelog via Notifier, sem mudança nesta rodada
  discord/
    embed.go            → Embed, EmbedField, cores, limites — vocabulário puro do Discord, sem HTTP
    webhook/
      client.go           → Client — API de Webhook do Discord, sem saber de remotelog
      remotelog_repository.go → RemoteLogRepository — adapta remotelog para o Client
```

## Checklist específico desta página

- [ ] `internal/remote-log/{log,publisher,editor,service}.go`
- [ ] `internal/taskrun/run.go` — só o comentário da interface `Notifier` muda
- [ ] `internal/discord/embed.go` — sem `colorFor`, sem import de `remotelog`
- [ ] `internal/discord/webhook/client.go` — `Client`, `CreateMessage`, `EditMessage`
- [ ] `internal/discord/webhook/remotelog_repository.go` — `RemoteLogRepository`, `colorFor`, `truncate`
- [ ] Apagar qualquer `internal/discord/repository.go` ou `internal/discord/remote-log/` de rodadas anteriores desta página

---

◀ [[Plans/Feature Plans/Port para Go/03 - Módulo Seed/03 - Geração de ID e Persistência|Geração de ID e Persistência]] · [[Plans/Feature Plans/Port para Go/03 - Módulo Seed/05 - Montagem Final (main.go)|Montagem Final]] ▶
