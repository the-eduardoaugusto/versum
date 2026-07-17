package setup

import (
	"context"
	"net/http"

	setupHttp "github.com/eduardoaugustolb/versum/apps/api-go/cmd/api/setup/http"
	"github.com/eduardoaugustolb/versum/apps/api-go/cmd/api/setup/infra"
	"github.com/eduardoaugustolb/versum/apps/api-go/internal/config"
	"github.com/eduardoaugustolb/versum/apps/api-go/internal/httputil"
)

func Setup(ctx context.Context, mux *http.ServeMux, cfg *config.Config) *httputil.HandlerChain {
	pgdb, rdb := infra.Setup(ctx, cfg)
	return setupHttp.Setup(mux, pgdb, rdb)
}
