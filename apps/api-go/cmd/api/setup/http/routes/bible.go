package routes

import (
	"net/http"
	"time"

	"github.com/eduardoaugustolb/versum/apps/api-go/internal/bible"
	cachereq "github.com/eduardoaugustolb/versum/apps/api-go/internal/httputil/cache-req"
	pgbible "github.com/eduardoaugustolb/versum/apps/api-go/internal/postgres/bible"
	"github.com/eduardoaugustolb/versum/apps/api-go/internal/redis"
	redisCachereq "github.com/eduardoaugustolb/versum/apps/api-go/internal/redis/cache-req"
	"github.com/jackc/pgx/v5/pgxpool"
)

func SetupBibleModule(mux *http.ServeMux, pgdb *pgxpool.Pool, rdb *redis.Database) {
	bookRepo := pgbible.NewBookRepository(pgdb)
	chapterRepo := pgbible.NewChapterRepository(pgdb, bookRepo)
	verseRepo := pgbible.NewVerseRepository(pgdb, chapterRepo)
	service := bible.NewBibleService(bookRepo, chapterRepo, verseRepo)
	handler := bible.NewHandler(service)

	cacheStore := redisCachereq.NewStore(rdb)
	cacheCfg := cachereq.Config{
		TTL:         5 * time.Minute,
		KeyPrefix:   "bible",
		AllowBypass: false,
	}
	cacheDomain := cachereq.NewCache(
		&cacheCfg,
		cacheStore,
	)

	cacheMW := cachereq.NewCacheMiddleware(cacheDomain)

	bible.RegisterRoutes(mux, handler, "/api/v1/bible", cacheMW.Wrap)
}
