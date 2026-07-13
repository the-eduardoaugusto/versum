package postgres

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Database struct {
	Pool *pgxpool.Pool
}

// New creates a Database, opening a connection pool and verifying it is reachable.
func New(ctx context.Context, dbURL string) (*Database, error) {
	pool, err := pgxpool.New(ctx, dbURL)
	if err != nil {
		return nil, err
	}

	if err := pool.Ping(ctx); err != nil {
		return nil, err
	}

	return &Database{Pool: pool}, nil
}

// Close closes the Database's connection pool
func (db *Database) Close() {
	db.Pool.Close()
}
