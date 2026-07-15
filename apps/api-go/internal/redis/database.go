package redis

import (
	"context"
	"log"

	"github.com/redis/go-redis/v9"
)

type Database struct {
	client *redis.Client
}

// New creates a Database, opening a connection and verifying it is reachable.
func New(ctx context.Context, dbURL string) *Database {
	opt, err := redis.ParseURL(dbURL)
	if err != nil {
		log.Fatalf("parsing redis db url: %v", err)
	}

	client := redis.NewClient(opt)

	if _, err := client.Ping(ctx).Result(); err != nil {
		log.Fatalf("sending redis ping request: %v", err)
	}

	return &Database{
		client: client,
	}
}

func (d *Database) Close() {
	d.client.Close()
}
