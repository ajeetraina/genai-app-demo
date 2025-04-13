package middleware

import (
	"net/http"
	"strings"

	"github.com/ajeetraina/genai-app-demo/pkg/tracing"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/trace"
)

// TracingMiddleware adds OpenTelemetry tracing to HTTP requests
func TracingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Skip tracing for metrics endpoint to avoid noise
		if strings.HasPrefix(r.URL.Path, "/metrics") {
			next.ServeHTTP(w, r)
			return
		}

		// Start a new span for this request
		ctx, span := tracing.StartSpan(r.Context(), "http_request")
		defer span.End()

		// Add request attributes to the span
		span.SetAttributes(
			attribute.String("http.method", r.Method),
			attribute.String("http.url", r.URL.String()),
			attribute.String("http.user_agent", r.UserAgent()),
			attribute.String("http.host", r.Host),
			attribute.String("http.scheme", getScheme(r)),
			attribute.String("http.target", r.URL.Path),
		)

		// Wrap the response writer to capture status code
		responseWriter := &responseWriterWrapper{w: w, statusCode: http.StatusOK}

		// Call the next handler with the updated context
		next.ServeHTTP(responseWriter, r.WithContext(ctx))

		// Add response attributes
		span.SetAttributes(attribute.Int("http.status_code", responseWriter.statusCode))
	})
}

// Helper to determine the scheme (http vs https)
func getScheme(r *http.Request) string {
	if r.TLS != nil {
		return "https"
	}
	if proto := r.Header.Get("X-Forwarded-Proto"); proto != "" {
		return proto
	}
	if proto := r.Header.Get("X-Forwarded-Protocol"); proto != "" {
		return proto
	}
	if ssl := r.Header.Get("X-Forwarded-Ssl"); ssl == "on" {
		return "https"
	}
	if proto := r.Header.Get("X-Url-Scheme"); proto != "" {
		return proto
	}
	return "http"
}

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
