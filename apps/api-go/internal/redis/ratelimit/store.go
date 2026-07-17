package ratelimit

import (
	"context"
	"fmt"
	"time"

	"github.com/eduardoaugustolb/versum/apps/api-go/internal/redis"
)

type Store struct {
	rdb *redis.Database
}

func NewStore(client *redis.Database) *Store {
	return &Store{
		rdb: client,
	}
}

func (s *Store) Increment(ctx context.Context, key string, window time.Duration) (count int64, ttl time.Duration, err error) {
	pipe := s.rdb.Pipeline()
	icr := pipe.Incr(ctx, key)
	pipe.Expire(ctx, key, window)
	ttlCmd := pipe.TTL(ctx, key)

	if _, err = pipe.Exec(ctx); err != nil {
		return 0, 0, fmt.Errorf("excuting pipeline: %w", err)
	}

	count, err = icr.Result()
	if err != nil {
		return 0, 0, fmt.Errorf("incrementing %v key: %w", key, err)
	}

	ttl, err = ttlCmd.Result()
	if err != nil {
		return 0, 0, fmt.Errorf("set ttl %v key and %v window: %w", key, window, err)
	}

	return count, ttl, nil

}
