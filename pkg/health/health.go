package health

import (
	"encoding/json"
	"net/http"
	"runtime"
	"time"

	"github.com/ajeetraina/genai-app-demo/pkg/metrics"
	"github.com/rs/zerolog/log"
)

// Status represents the health status of the application
type Status struct {
	Status    string            `json:"status"`
	Uptime    string            `json:"uptime"`
	Timestamp time.Time         `json:"timestamp"`
	Version   string            `json:"version"`
	GoVersion string            `json:"go_version"`
	MemStats  runtime.MemStats  `json:"mem_stats"`
	Metrics   map[string]string `json:"metrics,omitempty"`
}

// Variables to track application state
var (
	startTime = time.Now()
	version   = "1.0.0" // Should be set during build
)

// HandleHealth returns a simple health check handler
func HandleHealth() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Create health status
		status := &Status{
			Status:    "ok",
			Uptime:    time.Since(startTime).String(),
			Timestamp: time.Now(),
			Version:   version,
			GoVersion: runtime.Version(),
			Metrics:   make(map[string]string),
		}

		// Get memory statistics
		var memStats runtime.MemStats
		runtime.ReadMemStats(&memStats)
		status.MemStats = memStats

		// Include some basic metrics
		status.Metrics["active_requests"] = fmt.Sprintf("%v", metrics.ActiveRequests)

		// Send response
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		if err := json.NewEncoder(w).Encode(status); err != nil {
			log.Error().Err(err).Msg("Failed to encode health status")
		}
	}
}

// HandleReadiness returns a readiness check handler
func HandleReadiness() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// You can add more sophisticated checks here, such as:
		// - Database connectivity
		// - Model availability
		// - External service dependencies

		// For now, just return a basic OK response
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{"status": "ready"})
	}
}
