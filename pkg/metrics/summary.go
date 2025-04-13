package metrics

import (
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
	"time"

	// Import prometheus through the promauto package instead
	"github.com/prometheus/client_golang/prometheus/promauto"
	"github.com/rs/zerolog/log"
)

// MetricsSummary holds summarized metrics for frontend display
type MetricsSummary struct {
	TotalRequests      int     `json:"totalRequests"`
	AverageResponseTime float64 `json:"averageResponseTime"`
	TokensGenerated    int     `json:"tokensGenerated"`
	ActiveUsers        int     `json:"activeUsers"`
	ErrorRate          float64 `json:"errorRate"`
}

// MessageMetrics contains metrics for a single message
type MessageMetrics struct {
	MessageID        string  `json:"message_id"`
	TokensIn         int     `json:"tokens_in"`
	TokensOut        int     `json:"tokens_out"`
	ResponseTimeMs   float64 `json:"response_time_ms"`
	FirstTokenTimeMs float64 `json:"time_to_first_token_ms"`
	Timestamp        time.Time
}

// ErrorLogEntry contains data about an error
type ErrorLogEntry struct {
	ErrorType   string `json:"error_type"`
	StatusCode  int    `json:"status_code"`
	InputLength int    `json:"input_length"`
	Timestamp   string `json:"timestamp"`
}

// Storage for metrics and active users
var (
	messageMetrics     []MessageMetrics
	errorLogs          []ErrorLogEntry
	activeUserSessions map[string]time.Time
	lastCleanup        time.Time
	metricsMutex       sync.RWMutex
)

func init() {
	messageMetrics = make([]MessageMetrics, 0)
	errorLogs = make([]ErrorLogEntry, 0)
	activeUserSessions = make(map[string]time.Time)
	lastCleanup = time.Now()
}

// CleanupOldMetrics removes metrics older than the retention period
func CleanupOldMetrics() {
	metricsMutex.Lock()
	defer metricsMutex.Unlock()

	// Only clean up every hour
	if time.Since(lastCleanup) < time.Hour {
		return
	}

	retentionCutoff := time.Now().Add(-24 * time.Hour)
	newMetrics := make([]MessageMetrics, 0)

	// Keep only recent metrics
	for _, metric := range messageMetrics {
		if metric.Timestamp.After(retentionCutoff) {
			newMetrics = append(newMetrics, metric)
		}
	}

	// Clean up old user sessions (inactive for more than 30 minutes)
	sessionTimeout := time.Now().Add(-30 * time.Minute)
	for ip, lastSeen := range activeUserSessions {
		if lastSeen.Before(sessionTimeout) {
			delete(activeUserSessions, ip)
		}
	}

	messageMetrics = newMetrics
	lastCleanup = time.Now()
	log.Info().Int("metrics_count", len(newMetrics)).Int("active_users", len(activeUserSessions)).Msg("Cleaned up old metrics")
}

// HandleMetricsSummary returns a summary of metrics for the frontend
func HandleMetricsSummary() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Access-Control-Allow-Origin", "*")

		CleanupOldMetrics()

		metricsMutex.RLock()
		defer metricsMutex.RUnlock()

		// Calculate summary metrics
		totalRequests := len(messageMetrics)
		var totalResponseTime float64
		var totalTokens int
		var totalErrors int

		for _, metric := range messageMetrics {
			totalResponseTime += metric.ResponseTimeMs / 1000 // Convert to seconds
			totalTokens += metric.TokensOut
		}

		totalErrors = len(errorLogs)

		avgResponseTime := 0.0
		if totalRequests > 0 {
			avgResponseTime = totalResponseTime / float64(totalRequests)
		}

		errorRate := 0.0
		if totalRequests+totalErrors > 0 {
			errorRate = float64(totalErrors) / float64(totalRequests+totalErrors)
		}

		summary := MetricsSummary{
			TotalRequests:      totalRequests,
			AverageResponseTime: avgResponseTime,
			TokensGenerated:    totalTokens,
			ActiveUsers:        len(activeUserSessions),
			ErrorRate:          errorRate,
		}

		if err := json.NewEncoder(w).Encode(summary); err != nil {
			log.Error().Err(err).Msg("Failed to encode metrics summary")
			http.Error(w, "Internal server error", http.StatusInternalServerError)
		}
	}
}

// HandleLogMetrics handles metric logging from the frontend
func HandleLogMetrics() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodOptions {
			w.Header().Set("Access-Control-Allow-Origin", "*")
			w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
			w.WriteHeader(http.StatusOK)
			return
		}

		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		w.Header().Set("Access-Control-Allow-Origin", "*")

		var metric MessageMetrics
		if err := json.NewDecoder(r.Body).Decode(&metric); err != nil {
			log.Error().Err(err).Msg("Failed to decode metrics payload")
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		metric.Timestamp = time.Now()

		// Update Prometheus metrics
		ChatTokensCounter.WithLabelValues("input", "client").Add(float64(metric.TokensIn))
		ChatTokensCounter.WithLabelValues("output", "client").Add(float64(metric.TokensOut))
		ModelLatency.WithLabelValues("client", "inference").Observe(metric.ResponseTimeMs / 1000)
		FirstTokenLatency.WithLabelValues("client").Observe(metric.FirstTokenTimeMs / 1000)

		metricsMutex.Lock()
		messageMetrics = append(messageMetrics, metric)
		
		// Record user activity
		activeUserSessions[r.RemoteAddr] = time.Now()
		metricsMutex.Unlock()

		w.WriteHeader(http.StatusOK)
		fmt.Fprintf(w, "{\"success\": true}")
	}
}

// HandleLogError handles error logging from the frontend
func HandleLogError() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodOptions {
			w.Header().Set("Access-Control-Allow-Origin", "*")
			w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
			w.WriteHeader(http.StatusOK)
			return
		}

		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		w.Header().Set("Access-Control-Allow-Origin", "*")

		var errorEntry ErrorLogEntry
		if err := json.NewDecoder(r.Body).Decode(&errorEntry); err != nil {
			log.Error().Err(err).Msg("Failed to decode error payload")
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		// Update Prometheus metrics
		ErrorCounter.WithLabelValues(errorEntry.ErrorType, "frontend").Inc()

		metricsMutex.Lock()
		errorLogs = append(errorLogs, errorEntry)
		metricsMutex.Unlock()

		w.WriteHeader(http.StatusOK)
		fmt.Fprintf(w, "{\"success\": true}")
	}
}
