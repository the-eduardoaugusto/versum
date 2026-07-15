package postgres

import (
	"context"
	"log"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Database struct {
	Pool *pgxpool.Pool
}

// New creates a Database, opening a connection pool and verifying it is reachable.
func New(ctx context.Context, dbURL string) *Database {
	pool, err := pgxpool.New(ctx, dbURL)
	if err != nil {
		log.Fatalf("creating postgres pool connection: %v", err)
	}

	if err := pool.Ping(ctx); err != nil {
		log.Fatalf("sending postgres ping request: %v", err)
	}

	return &Database{Pool: pool}
}

// Close closes the Database's connection pool
func (db *Database) Close() {
	db.Pool.Close()
}
