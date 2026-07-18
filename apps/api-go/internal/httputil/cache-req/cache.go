package cachereq

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"
)

type CachedResponse struct {
	Cached   bool      `json:"cached"`
	ExpireAt time.Time `json:"expireAt"`
}

type Cache struct {
	config *Config
	store  Store
}

type Config struct {
	TTL         time.Duration
	KeyPrefix   string
	AllowBypass bool
}

func NewCache(cfg *Config, s Store) *Cache {
	return &Cache{
		config: cfg,
		store:  s,
	}
}

func (c *Cache) buildKey(r *http.Request) string {
	p := strings.TrimSpace(r.URL.Path)
	q := strings.TrimSpace(r.URL.RawQuery)
	prefix := strings.TrimSpace(c.config.KeyPrefix)
	k := strings.ToLower(prefix + ":" + q + ":" + p)
	return k
}

func (c *Cache) writeHit(w http.ResponseWriter, body []byte, ttl time.Duration) error {
	var payload map[string]any
	if err := json.Unmarshal(body, &payload); err != nil {
		return fmt.Errorf("decoding cached body: %w", err)
	}

	payload["cache"] = CachedResponse{
		Cached:   true,
		ExpireAt: time.Now().Add(ttl).UTC(),
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	return json.NewEncoder(w).Encode(payload)
}
