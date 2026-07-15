package ratelimit

import (
	"context"
	"net/http"
	"time"
)

type KeyFunc func(r *http.Request) string

type Config struct {
	Limit   int64
	Window  time.Duration
	KeyFunc KeyFunc
	Prefix  string
}

type Limiter struct {
	config Config
	store  Store
}

func NewLimiter(c Config, s Store) *Limiter {
	return &Limiter{
		config: c,
		store:  s,
	}
}

type Result struct {
	Allowed    bool
	Limit      int64
	Remaining  int64
	RetryAfter time.Duration
}

func (l *Limiter) Allow(ctx context.Context, r *http.Request) (Result, error) {
	key := l.config.Prefix + ":" + l.config.KeyFunc(r)
	count, ttl, err := l.store.Increment(ctx, key, l.config.Window)
	if err != nil {
		return Result{
			Allowed:    false,
			Limit:      l.config.Limit,
			RetryAfter: ttl,
		}, err
	}

	if count > l.config.Limit {
		return Result{
			Allowed:    false,
			Limit:      l.config.Limit,
			Remaining:  0,
			RetryAfter: ttl,
		}, nil
	}

	return Result{
		Allowed:   true,
		Limit:     l.config.Limit,
		Remaining: max(l.config.Limit-count, 0),
	}, nil
}
