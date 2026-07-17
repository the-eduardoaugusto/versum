package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/eduardoaugustolb/versum/apps/api-go/cmd/api/setup"
	"github.com/eduardoaugustolb/versum/apps/api-go/internal/config"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("an error ocurred on load app config: %v", err)
	}

	mux := http.NewServeMux()

	mux.HandleFunc("GET /", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode("Pong!")
	})

	chain := setup.Setup(context.Background(), mux, cfg)

	port := cfg.Port
	log.Printf("Server is running on %v", port)

	srv := &http.Server{
		Addr:         ":" + port,
		Handler:      chain.Handler,
		ReadTimeout:  5 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  time.Minute,
	}

	if err := srv.ListenAndServe(); err != nil {
		log.Fatalf("error on server start: %v", err)
	}
}
