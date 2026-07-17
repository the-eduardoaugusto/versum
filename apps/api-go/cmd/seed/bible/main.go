package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/eduardoaugustolb/versum/apps/api-go/internal/bible"
	"github.com/eduardoaugustolb/versum/apps/api-go/internal/discord/webhook"
	"github.com/eduardoaugustolb/versum/apps/api-go/internal/postgres"
	pgbible "github.com/eduardoaugustolb/versum/apps/api-go/internal/postgres/bible"
	remotelog "github.com/eduardoaugustolb/versum/apps/api-go/internal/remote-log"
	"github.com/eduardoaugustolb/versum/apps/api-go/internal/taskrun"
	"github.com/joho/godotenv"
)

func loadSeedEnv() (postgresURL, discordWebhookURL string, err error) {
	if loadErr := godotenv.Load(); loadErr != nil {
		return "", "", fmt.Errorf("carregando .env: %w", loadErr)
	}

	var missing []string
	postgresURL, ok := os.LookupEnv("POSTGRES_URL")
	if !ok {
		missing = append(missing, "POSTGRES_URL")
	}
	discordWebhookURL, ok = os.LookupEnv("DISCORD_WEBHOOK_URL")
	if !ok {
		missing = append(missing, "DISCORD_WEBHOOK_URL")
	}
	if len(missing) > 0 {
		return "", "", fmt.Errorf("faltando env vars: %v", missing)
	}

	return postgresURL, discordWebhookURL, nil
}

func main() {
	postgresURL, discordWebhookURL, err := loadSeedEnv()
	if err != nil {
		log.Fatalf("erro ao carregar configuração: %v", err)
	}

	ctx := context.Background()
	db := postgres.New(ctx, postgresURL)
	defer db.Close()

	// --- bible module: domain + repository (Postgres) + service ---
	bookRepo := pgbible.NewBookRepository(db.Pool)
	chapterRepo := pgbible.NewChapterRepository(db.Pool, bookRepo)
	verseRepo := pgbible.NewVerseRepository(db.Pool, chapterRepo)
	bibleService := bible.NewBibleService(bookRepo, chapterRepo, verseRepo)

	// --- discord/webhook: raw client + adapter for remote-log ---
	webhookClient := webhook.NewClient(discordWebhookURL, &http.Client{})
	discordLogs := webhook.NewRemoteLogRepository(webhookClient)

	// --- remote-log module: domain + service, built on top of the adapter above ---
	logService := remotelog.NewService(discordLogs)

	// --- taskrun: the "long task reporting progress" pattern, decoupled
	// from remote-log itself — logService satisfies taskrun.Notifier
	// implicitly, no adapter code needed ---
	run := taskrun.New(logService, "seed-bible")

	if err := runSeed(ctx, bibleService, run); err != nil {
		log.Fatalf("seed falhou: %v", err)
	}
}
