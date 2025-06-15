package middleware

import (
	"net/http"
	"strconv"
	"time"

	"github.com/google/uuid"
	"github.com/rs/zerolog/log"

	"github.com/ajeetraina/genai-app-demo/pkg/metrics"
)

// RequestLogger adds request logging middleware
func RequestLogger(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		requestID := uuid.New().String()

		// Add request ID to context
		ctx := r.Context()
		r = r.WithContext(ctx)

		// Create a custom response writer to capture the status code
		writer := &responseWriter{w, http.StatusOK}

		// Log the request
		log.Info().Str("method", r.Method).Str("path", r.URL.Path).Str("request_id", requestID).Msg("Request started")

		// Increment active requests counter
		metrics.ActiveRequests.Inc()

		// Call the next handler
		next.ServeHTTP(writer, r)

		// Decrement active requests counter
		metrics.ActiveRequests.Dec()

		// Calculate request duration
		duration := time.Since(start)

		// Log the response
		log.Info().Str("method", r.Method).Str("path", r.URL.Path).Int("status", writer.status).Dur("duration", duration).Str("request_id", requestID).Msg("Request completed")

		// Record metrics
		metrics.RequestCounter.WithLabelValues(r.Method, r.URL.Path, strconv.Itoa(writer.status)).Inc()
		metrics.RequestDuration.WithLabelValues(r.Method, r.URL.Path).Observe(duration.Seconds())
	})
}

// RateLimiter implements a simple rate limiting middleware
func RateLimiter(ratePerMinute int) func(http.Handler) http.Handler {
	// Create a map to track requests by IP
	requestTracker := make(map[string][]time.Time)

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Get the client's IP address
			ipAddress := r.RemoteAddr

			now := time.Now()
			minute := now.Add(-1 * time.Minute)

			// Clean up old entries
			requestTimes := []time.Time{}
			for _, timestamp := range requestTracker[ipAddress] {
				if timestamp.After(minute) {
					requestTimes = append(requestTimes, timestamp)
				}
			}

			// Check if the client has exceeded the rate limit
			if len(requestTimes) >= ratePerMinute {
				metrics.ErrorCounter.WithLabelValues("rate_limit", "api").Inc()
				log.Warn().Str("ip", ipAddress).Int("rate_limit", ratePerMinute).Msg("Rate limit exceeded")
				http.Error(w, "Rate limit exceeded. Please try again later.", http.StatusTooManyRequests)
				return
			}

			// Add the current request to the tracker
			requestTracker[ipAddress] = append(requestTimes, now)

			// Call the next handler
			next.ServeHTTP(w, r)
		})
	}
}

// responseWriter is a custom response writer that captures the status code
type responseWriter struct {
	http.ResponseWriter
	status int
}

// WriteHeader captures the status code before calling the underlying ResponseWriter
func (rw *responseWriter) WriteHeader(code int) {
	rw.status = code
	rw.ResponseWriter.WriteHeader(code)
}
