package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"

	"github.com/eduardoaugustolb/versum/apps/api-go/internal/bible"
	"github.com/eduardoaugustolb/versum/apps/api-go/internal/config"
	"github.com/eduardoaugustolb/versum/apps/api-go/internal/postgres"
	postgres_bible "github.com/eduardoaugustolb/versum/apps/api-go/internal/postgres/bible"
	"github.com/eduardoaugustolb/versum/apps/api-go/internal/redis"
	"github.com/jackc/pgx/v5/pgxpool"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("an error ocurred on load app config: %v", err)
	}

	ctx := context.Background()
	postgresDB := postgres.New(ctx, cfg.PostgresURL)

	log.Printf(`Postgres connected on database "%v"`, postgresDB.Pool.Config().ConnConfig.Database)

	redis.New(ctx, cfg.RedisURL)
	log.Printf("Redis connected!")

	mux := http.NewServeMux()

	setupBibleModule(mux, postgresDB.Pool)
	mux.HandleFunc("GET /", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode("Pong!")
	})

	port := cfg.Port
	log.Printf("Server is running on %v", port)
	if err := http.ListenAndServe(":"+port, mux); err != nil {
		log.Fatalf("error on server start: %v", err)
	}
}

func setupBibleModule(s *http.ServeMux, p *pgxpool.Pool) {
	bookRepo := postgres_bible.NewBookRepository(p)
	chapterRepo := postgres_bible.NewChapterRepository(p, bookRepo)
	verseRepo := postgres_bible.NewVerseRepository(p, chapterRepo)
	service := bible.NewBibleService(bookRepo, chapterRepo, verseRepo)
	handler := bible.NewHandler(service)
	bible.RegisterRoutes(s, handler, "/api/v1/bible")
}
