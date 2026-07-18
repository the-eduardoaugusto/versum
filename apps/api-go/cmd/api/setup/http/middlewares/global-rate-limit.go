package middlewares

import (
	"time"

	"github.com/eduardoaugustolb/versum/apps/api-go/internal/httputil"
	"github.com/eduardoaugustolb/versum/apps/api-go/internal/ratelimit"
	"github.com/eduardoaugustolb/versum/apps/api-go/internal/ratelimit/keys"
	"github.com/eduardoaugustolb/versum/apps/api-go/internal/redis"
	redisratelimit "github.com/eduardoaugustolb/versum/apps/api-go/internal/redis/ratelimit"
)

func SetupGlobalRateLimit(chain *httputil.HandlerChain, rdb *redis.Database) {
	s := redisratelimit.NewStore(rdb)
	c := ratelimit.Config{
		Limit:   100,
		Window:  60 * time.Second,
		KeyFunc: keys.ClientIP,
		Prefix:  "global",
	}
	limiter := ratelimit.NewLimiter(c, s)
	rateLimitMW := ratelimit.NewRateLimitMiddleware(limiter)
	chain.Use(rateLimitMW.Wrap)
}
