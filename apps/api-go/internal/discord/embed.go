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
