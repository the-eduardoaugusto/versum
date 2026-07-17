package ratelimit

import (
	"net/http"
	"strconv"

	"github.com/eduardoaugustolb/versum/apps/api-go/internal/httputil"
)

func Middleware(limiter *Limiter) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			result, err := limiter.Allow(r.Context(), r)
			if err != nil {
				httputil.WriteError(w, httputil.ServiceUnavailable("temporarily unavailable"))
				return
			}

			w.Header().Set("X-RateLimit-Limit", strconv.FormatInt(result.Limit, 10))
			w.Header().Set("X-RateLimit-Remaining", strconv.FormatInt(result.Remaining, 10))

			if !result.Allowed {
				w.Header().Set(
					"Retry-After",
					strconv.Itoa(int(result.RetryAfter.Seconds())),
				)
				httputil.WriteError(w, httputil.TooManyRequests("too many requests"))
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}
