package http

import (
	"net/http"

	"github.com/eduardoaugustolb/versum/apps/api-go/cmd/api/setup/http/middlewares"
	"github.com/eduardoaugustolb/versum/apps/api-go/cmd/api/setup/http/routes"
	"github.com/eduardoaugustolb/versum/apps/api-go/internal/httputil"
	"github.com/eduardoaugustolb/versum/apps/api-go/internal/postgres"
	"github.com/eduardoaugustolb/versum/apps/api-go/internal/redis"
)

func Setup(mux *http.ServeMux, pgdb *postgres.Database, rdb *redis.Database) *httputil.HandlerChain {
	chain := httputil.NewChain(mux)

	middlewares.SetupGlobalRateLimit(chain, rdb)
	routes.SetupBibleModule(mux, pgdb.Pool, rdb)

	return chain
}
