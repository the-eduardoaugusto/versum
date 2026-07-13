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
