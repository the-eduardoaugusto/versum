package cachereq

import (
	"context"
	"errors"
	"fmt"
	"time"

	infraRedis "github.com/eduardoaugustolb/versum/apps/api-go/internal/redis"
	"github.com/redis/go-redis/v9"
)

type Store struct {
	rdb *infraRedis.Database
}

func NewStore(rdb *infraRedis.Database) *Store {
	return &Store{
		rdb: rdb,
	}
}

func (s *Store) Set(ctx context.Context, body []byte, ttl time.Duration, key string) error {
	if err := s.rdb.Set(ctx, key, body, ttl).Err(); err != nil {
		return fmt.Errorf("caching %v key: %w", key, err)
	}

	return nil
}

func (s *Store) Get(ctx context.Context, key string) (body []byte, ttl time.Duration, ok bool, err error) {
	pipe := s.rdb.Pipeline()
	bodyCmd := pipe.Get(ctx, key)
	ttlCmd := pipe.TTL(ctx, key)

	if _, err := pipe.Exec(ctx); err != nil {
		if errors.Is(err, redis.Nil) {
			return nil, 0, false, nil
		}
		return nil, 0, false, fmt.Errorf("running get cache pipeline %v key: %w", key, err)
	}

	b, err := bodyCmd.Bytes()
	if err != nil {
		return nil, 0, false, fmt.Errorf("fetching body of pipeline result, %v key: %w", key, err)
	}

	ttl, err = ttlCmd.Result()
	if err != nil {
		return nil, 0, false, fmt.Errorf("fetching ttl of pipeline result, %v key: %w", key, err)
	}

	return b, ttl, true, err
}
