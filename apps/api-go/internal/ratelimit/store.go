package ratelimit

import (
	"context"
	"time"
)

type Store interface {
	Increment(ctx context.Context, key string, window time.Duration) (count int64, ttl time.Duration, err error)
}
