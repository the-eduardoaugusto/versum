package cachereq

import (
	"context"
	"time"
)

type Store interface {
	Set(ctx context.Context, body []byte, ttl time.Duration, key string) error
	Get(ctx context.Context, key string) (body []byte, ttl time.Duration, ok bool, err error)
}
