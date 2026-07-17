package httputil

import "net/http"

type HandlerChain struct {
	Handler http.Handler
}

func NewChain(base http.Handler) *HandlerChain {
	return &HandlerChain{Handler: base}
}

func (c *HandlerChain) Use(mw func(http.Handler) http.Handler) {
	c.Handler = mw(c.Handler)
}
