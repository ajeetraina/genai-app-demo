package middleware

import (
	"net/http"
)

// responseWriterWrapper is a custom response writer that captures the status code
type responseWriterWrapper struct {
	w          http.ResponseWriter
	statusCode int
}

func (rww *responseWriterWrapper) Header() http.Header {
	return rww.w.Header()
}

func (rww *responseWriterWrapper) Write(bytes []byte) (int, error) {
	return rww.w.Write(bytes)
}

func (rww *responseWriterWrapper) WriteHeader(statusCode int) {
	rww.statusCode = statusCode
	rww.w.WriteHeader(statusCode)
}

func (rww *responseWriterWrapper) Flush() {
	if f, ok := rww.w.(http.Flusher); ok {
		f.Flush()
	}
}
