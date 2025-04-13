package middleware

import (
	"net/http"
	"strconv"
	"time"

	"github.com/prometheus/client_golang/prometheus"
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

// MetricsMiddleware adds Prometheus metrics to HTTP requests
func MetricsMiddleware(requestCounter *prometheus.CounterVec, requestDuration *prometheus.HistogramVec, activeRequests prometheus.Gauge) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			start := time.Now()
			activeRequests.Inc()
			defer activeRequests.Dec()

			// Wrap the response writer to capture status code
			rww := &responseWriterWrapper{w: w, statusCode: http.StatusOK}

			// Call the next handler
			next.ServeHTTP(rww, r)

			// Record metrics
			duration := time.Since(start).Seconds()
			requestDuration.WithLabelValues(r.Method, r.URL.Path).Observe(duration)
			requestCounter.WithLabelValues(r.Method, r.URL.Path, strconv.Itoa(rww.statusCode)).Inc()
		})
	}
}
