package middleware

import "net/http"

// responseWriterWrapper wraps an http.ResponseWriter to capture the status code
type responseWriterWrapper struct {
	w          http.ResponseWriter
	statusCode int
}

// Header returns the header map from the wrapped response writer
func (rww *responseWriterWrapper) Header() http.Header {
	return rww.w.Header()
}

// Write writes the data to the wrapped response writer
func (rww *responseWriterWrapper) Write(bytes []byte) (int, error) {
	return rww.w.Write(bytes)
}

// WriteHeader captures the status code and writes the header to the wrapped response writer
func (rww *responseWriterWrapper) WriteHeader(statusCode int) {
	rww.statusCode = statusCode
	rww.w.WriteHeader(statusCode)
}

// Flush implements the http.Flusher interface
func (rww *responseWriterWrapper) Flush() {
	if f, ok := rww.w.(http.Flusher); ok {
		f.Flush()
	}
}
