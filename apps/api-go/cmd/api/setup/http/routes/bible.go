package routes

import (
	"net/http"

	"github.com/eduardoaugustolb/versum/apps/api-go/internal/bible"
	pgbible "github.com/eduardoaugustolb/versum/apps/api-go/internal/postgres/bible"
	"github.com/jackc/pgx/v5/pgxpool"
)

func SetupBibleModule(mux *http.ServeMux, p *pgxpool.Pool) {
	bookRepo := pgbible.NewBookRepository(p)
	chapterRepo := pgbible.NewChapterRepository(p, bookRepo)
	verseRepo := pgbible.NewVerseRepository(p, chapterRepo)
	service := bible.NewBibleService(bookRepo, chapterRepo, verseRepo)
	handler := bible.NewHandler(service)
	bible.RegisterRoutes(mux, handler, "/api/v1/bible")
}
