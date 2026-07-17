package keys

import (
	"net"
	"net/http"
	"strings"
)

var privateCIDRs = []string{
	"10.0.0.0/8",
	"172.16.0.0/12",
	"192.168.0.0/16",
	"127.0.0.0/8",
	"169.254.0.0/16", // link-local
	"::1/128",
	"fc00::/7",  // unique local (IPv6)
	"fe80::/10", // link-local (IPv6)
}

var privateNets []*net.IPNet

func init() {
	for _, cidr := range privateCIDRs {
		if _, ipNet, err := net.ParseCIDR(cidr); err == nil {
			privateNets = append(privateNets, ipNet)
		}
	}
}

func isPrivateIp(ipStr string) bool {
	ip := net.ParseIP(ipStr)
	if ip == nil {
		return true
	}

	for _, ipNet := range privateNets {
		if ipNet.Contains(ip) {
			return true
		}
	}

	return false
}

func ClientIP(r *http.Request) string {
	if realIP := r.Header.Get("X-Real-Ip"); realIP != "" && !isPrivateIp(realIP) {
		return realIP
	}

	if fowardedForRaw := r.Header.Get("X-Forwarded-For"); fowardedForRaw != "" {
		parts := strings.Split(fowardedForRaw, ",")
		for i := len(parts) - 1; i >= 0; i-- {
			candidate := strings.TrimSpace(parts[i])
			if candidate != "" && !isPrivateIp(candidate) {
				return candidate
			}
		}
	}

	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}

	return host
}
