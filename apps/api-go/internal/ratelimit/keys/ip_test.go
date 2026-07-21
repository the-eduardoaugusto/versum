package keys_test

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/eduardoaugustolb/versum/apps/api-go/internal/ratelimit/keys"
)

func TestKeysByIp(t *testing.T) {
	tests := []struct {
		name  string
		setup func(r *http.Request)
		want  string
	}{
		{
			name: "real public ip, returns X-Real-Ip",
			setup: func(r *http.Request) {
				r.Header.Set("X-Real-Ip", "8.8.8.8")
			},
			want: "8.8.8.8",
		},
		{
			name: "real private ip, falls back to remote addr without port",
			want: "1.2.3.4",
			setup: func(r *http.Request) {
				r.Header.Set("X-Real-Ip", "192.168.1.1")
			},
		},
		{
			name: "multiples ips in forwarded for, falls back to secure ip",
			setup: func(r *http.Request) {
				r.Header.Set("X-Forwarded-For", "203.0.113.5, 10.0.0.1")
			},
			want: "203.0.113.5",
		},
		{
			name: "no header in request, falls back to remote addr without port",
			setup: func(r *http.Request) {
				r.RemoteAddr = "1.2.3.4:4321"
			},
			want: "1.2.3.4",
		},
		{
			name: "poorly formed X-Real-Ip, falls back remote addr",
			setup: func(r *http.Request) {
				r.Header.Set("X-Real-Ip", "256.256.256.256")
			},
			want: "1.2.3.4",
		},
		{
			name: "poorly formed X-Forwarded-For, falls back remote addr",
			setup: func(r *http.Request) {
				r.Header.Set("X-Forwarded-For", "192.168.1.1,, 10.0.0.1")
			},
			want: "1.2.3.4",
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			r := httptest.NewRequest(http.MethodGet, "/", nil)
			r.RemoteAddr = httptest.DefaultRemoteAddr
			tc.setup(r)

			key := keys.ClientIP(r)
			if key != tc.want {
				t.Errorf("%s - expected %v, received %v", t.Name(), tc.want, key)
			}
		})
	}
}
