package cachereq

import (
	"log"
	"net/http"

	"github.com/eduardoaugustolb/versum/apps/api-go/internal/httputil"
)

type CacheMiddleware struct {
	cache *Cache
}

func NewCacheMiddleware(c *Cache) *CacheMiddleware {
	return &CacheMiddleware{
		cache: c,
	}
}
func (mw *CacheMiddleware) Wrap(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		k := mw.cache.buildKey(r)
		body, ttl, ok, err := mw.cache.store.Get(r.Context(), k)
		if err != nil {
			httputil.WriteError(w, httputil.ServiceUnavailable("temporarily unavaible"))
			return
		}

		if ok {
			if err := mw.cache.writeHit(w, body, ttl); err != nil {
				httputil.WriteError(w, httputil.ServiceUnavailable("temporarily unavailable"))
				return
			}

			return
		}

		rec := newRecorder(w)
		next.ServeHTTP(rec, r)

		if rec.status == http.StatusOK {
			if err := mw.cache.store.Set(r.Context(), rec.body.Bytes(), mw.cache.config.TTL, k); err != nil {
				log.Printf("caching endpoint response %v key: %v", k, err)
			}
		}
	})
}
