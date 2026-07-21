package ratelimit_test

import (
	"fmt"
	"net/http"
	"testing"
	"time"

	"github.com/eduardoaugustolb/versum/apps/api-go/internal/ratelimit"
	"github.com/eduardoaugustolb/versum/apps/api-go/internal/ratelimit/keys"
)

func TestLimiter(t *testing.T) {
	tests := []struct {
		name        string
		cfg         ratelimit.Config
		store       ratelimit.Store
		wantAllowed bool
		wantError   bool
	}{
		{
			name:        "denies at limit zero",
			cfg:         ratelimit.Config{Limit: 0, Window: time.Minute, KeyFunc: keys.ClientIP, Prefix: "test"},
			store:       NewFakeStore(make(FakeDb), nil),
			wantAllowed: false,
			wantError:   false,
		},
		{
			name:        "allows within limit",
			cfg:         ratelimit.Config{Limit: 1, Window: time.Minute, KeyFunc: keys.ClientIP, Prefix: "test"},
			store:       NewFakeStore(make(FakeDb), nil),
			wantAllowed: true,
			wantError:   false,
		},
		{
			name:        "store error propagates",
			cfg:         ratelimit.Config{Limit: 1, Window: time.Minute, KeyFunc: keys.ClientIP, Prefix: "test"},
			store:       NewFakeStore(make(FakeDb), fmt.Errorf("test error")),
			wantAllowed: false,
			wantError:   true,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			l := ratelimit.NewLimiter(tc.cfg, tc.store)
			res, err := l.Allow(t.Context(), &http.Request{})

			if (tc.wantError && err == nil) || (!tc.wantError && err != nil) {
				t.Errorf("%s - expected err %v, received %v", t.Name(), tc.wantError, err)
			}

			if (tc.wantAllowed && !res.Allowed) || (!tc.wantAllowed && res.Allowed) {
				t.Errorf("%s - expected Allowed %v, received %v", t.Name(), tc.wantAllowed, res.Allowed)
			}
		})
	}
}
