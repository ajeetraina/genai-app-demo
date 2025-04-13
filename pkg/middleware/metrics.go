package middleware

import (
	"net/http"
	"strconv"
	"time"

	"github.com/prometheus/client_golang/prometheus"
)

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
