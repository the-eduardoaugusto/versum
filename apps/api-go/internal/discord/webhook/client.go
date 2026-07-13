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
