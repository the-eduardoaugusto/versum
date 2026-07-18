package cachereq

import (
	"bytes"
	"net/http"
)

type recorder struct {
	http.ResponseWriter
	status int
	body   bytes.Buffer
}

func newRecorder(w http.ResponseWriter) *recorder {
	return &recorder{
		ResponseWriter: w,
		status:         http.StatusOK,
	}
}

func (r *recorder) WriteHeader(status int) {
	r.status = status
	r.ResponseWriter.WriteHeader(status)
}

func (r *recorder) Write(b []byte) (int, error) {
	r.body.Write(b)
	return r.ResponseWriter.Write(b)
}
