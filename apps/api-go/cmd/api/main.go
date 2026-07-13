package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"

	"github.com/eduardoaugustolb/versum/apps/api-go/internal/bible"
	"github.com/eduardoaugustolb/versum/apps/api-go/internal/config"
	postgres_bible "github.com/eduardoaugustolb/versum/apps/api-go/internal/postgres/bible"
	"github.com/jackc/pgx/v5/pgxpool"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("an error ocurred on load app config: %v", err)
	}

	ctx := context.Background()
	pool, err := pgxpool.New(ctx, cfg.PostgresURL)
	if err != nil {
		log.Fatalf("error on create pg pool: %v", err)
	}
	mux := http.NewServeMux()

	setupBibleModule(mux, pool)
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
	bible.RegisterRoutes(s, handler)
}
