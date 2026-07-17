package infra

import (
	"context"
	"log"

	"github.com/eduardoaugustolb/versum/apps/api-go/internal/config"
	"github.com/eduardoaugustolb/versum/apps/api-go/internal/postgres"
	"github.com/eduardoaugustolb/versum/apps/api-go/internal/redis"
)

func Setup(ctx context.Context, cfg *config.Config) (*postgres.Database, *redis.Database) {
	pgdb := postgres.New(ctx, cfg.PostgresURL)

	log.Printf(`Postgres connected on database "%v"`, pgdb.Pool.Config().ConnConfig.Database)

	rdb := redis.New(ctx, cfg.RedisURL)
	log.Printf("Redis connected!")
	return pgdb, rdb
}
