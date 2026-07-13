---
title: "Módulo Seed — Log no Discord"
section: "Plans"
subsection: "Feature Plans"
tags: [versum, plans, go, aprendizado, bible, seed]
up: "[[Plans/Feature Plans/Port para Go/03 - Módulo Seed/_Index]]"
prev: "[[Plans/Feature Plans/Port para Go/03 - Módulo Seed/03 - Geração de ID e Persistência]]"
next: "[[Plans/Feature Plans/Port para Go/03 - Módulo Seed/05 - Montagem Final (main.go)]]"
related: []
depth: 3
---

# 💬 Módulo Seed — Log no Discord

🏠 [[_Index|Home]] › 🗺️ [[Plans/_Index|Plans]] › 🚀 [[Plans/Feature Plans/_Index|Feature Plans]] › 🐹 [[Plans/Feature Plans/Port para Go/_Index|Port para Go]] › [[Plans/Feature Plans/Port para Go/03 - Módulo Seed/_Index|Módulo Seed]] › **Log no Discord**

---

## Mesmo comportamento do TS

`seed.action.ts` mantém estado em variáveis de módulo (`messageId`, `logs`, `startTime`, `endTime`, `hasError`) e duas funções, `addLog` (empilha uma linha e reenvia) e `updateDiscordMessage` (`POST` se ainda não existe mensagem, `PATCH` se já existe, editando o mesmo embed). Em Go isso vira um struct `discordLogger` — o mesmo papel, só que como valor explícito passado adiante em vez de estado de módulo implícito (mais fácil de testar e não corre risco de dois seeds concorrentes pisarem no mesmo estado global).

```go
package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"
)

type discordLogger struct {
	webhookURL string
	client     *http.Client
	messageID  string
	logs       []string
	startTime  time.Time
	endTime    *time.Time
	hasError   bool
}

func newDiscordLogger(webhookURL string) *discordLogger {
	return &discordLogger{webhookURL: webhookURL, client: &http.Client{}}
}

func (d *discordLogger) start(ctx context.Context) {
	d.startTime = time.Now()
	d.logs = nil
	d.endTime = nil
	d.hasError = false
	d.messageID = ""

	fmt.Println("🔥 SEED INICIADO")
	d.addLog(ctx, "🔥 SEED INICIADO")
}

func (d *discordLogger) addLog(ctx context.Context, message string) {
	d.logs = append(d.logs, message)
	d.update(ctx)
}

// finish fecha o log: marca hasError/endTime e manda a última mensagem.
func (d *discordLogger) finish(ctx context.Context, hasError bool, lastMessage string) {
	d.hasError = hasError
	now := time.Now()
	d.endTime = &now
	if hasError {
		fmt.Println("💀 ERRO:", lastMessage)
	}
	d.addLog(ctx, lastMessage)
}

func formatDate(t time.Time) string {
	return fmt.Sprintf("%02d/%02d/%04d - %02dh%02d", t.Day(), t.Month(), t.Year(), t.Hour(), t.Minute())
}

type discordEmbedField struct {
	Name   string `json:"name"`
	Value  string `json:"value"`
	Inline bool   `json:"inline"`
}

type discordEmbed struct {
	Title       string              `json:"title"`
	Description string              `json:"description"`
	Fields      []discordEmbedField `json:"fields"`
	Color       int                 `json:"color"`
	Timestamp   string              `json:"timestamp"`
}

func (d *discordLogger) update(ctx context.Context) {
	logsText := strings.Join(d.logs, "\n")
	if len(logsText) > 3800 {
		logsText = "...\n" + logsText[len(logsText)-3800:]
	}

	endValue := "Em andamento"
	if d.endTime != nil {
		endValue = formatDate(*d.endTime)
	}

	errValue := "Não"
	if d.hasError {
		errValue = "Sim"
	}

	color := 0xffaa00
	switch {
	case d.hasError:
		color = 0xe74c3c
	case d.endTime != nil:
		color = 0x2ecc71
	}

	embed := discordEmbed{
		Title:       fmt.Sprintf("Logs do seed %s", d.startTime.Format(time.RFC3339)),
		Description: fmt.Sprintf("**Logs:**\n```\n%s\n```", logsText),
		Fields: []discordEmbedField{
			{Name: "Começou em:", Value: formatDate(d.startTime), Inline: true},
			{Name: "Terminou em:", Value: endValue, Inline: true},
			{Name: "Houve erros?:", Value: errValue, Inline: true},
		},
		Color:     color,
		Timestamp: time.Now().Format(time.RFC3339),
	}

	body, err := json.Marshal(map[string]any{"embeds": []discordEmbed{embed}})
	if err != nil {
		fmt.Println("Erro ao serializar embed do Discord:", err)
		return
	}

	if d.messageID == "" {
		d.post(ctx, body)
		return
	}
	d.patch(ctx, body)
}

func (d *discordLogger) post(ctx context.Context, body []byte) {
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, d.webhookURL+"?wait=true", bytes.NewReader(body))
	if err != nil {
		fmt.Println("Erro ao atualizar Discord:", err)
		return
	}
	req.Header.Set("Content-Type", "application/json")

	res, err := d.client.Do(req)
	if err != nil {
		fmt.Println("Erro ao atualizar Discord:", err)
		return
	}
	defer res.Body.Close()

	var data struct {
		ID string `json:"id"`
	}
	if err := json.NewDecoder(res.Body).Decode(&data); err != nil {
		fmt.Println("Erro ao atualizar Discord:", err)
		return
	}
	d.messageID = data.ID
}

func (d *discordLogger) patch(ctx context.Context, body []byte) {
	url := fmt.Sprintf("%s/messages/%s", d.webhookURL, d.messageID)
	req, err := http.NewRequestWithContext(ctx, http.MethodPatch, url, bytes.NewReader(body))
	if err != nil {
		fmt.Println("Erro ao atualizar Discord:", err)
		return
	}
	req.Header.Set("Content-Type", "application/json")

	res, err := d.client.Do(req)
	if err != nil {
		fmt.Println("Erro ao atualizar Discord:", err)
		return
	}
	defer res.Body.Close()
}
```

## Onde a env var é lida

`DISCORD_WEBHOOK_URL` é lida direto em `cmd/seed/bible/main.go` (ver [[Plans/Feature Plans/Port para Go/03 - Módulo Seed/05 - Montagem Final (main.go)|próxima página]]), não em `internal/config`. Motivo já registrado no [[Plans/Feature Plans/Port para Go/03 - Módulo Seed/_Index|índice do módulo]]: `internal/config.Config` também serve o `cmd/api`, que não deve exigir uma env var que só o seed usa.

---

◀ [[Plans/Feature Plans/Port para Go/03 - Módulo Seed/03 - Geração de ID e Persistência|Geração de ID e Persistência]] · [[Plans/Feature Plans/Port para Go/03 - Módulo Seed/05 - Montagem Final (main.go)|Montagem Final]] ▶
