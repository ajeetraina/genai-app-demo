package llamacpp

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"time"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/rs/zerolog/log"
)

// ModelRunnerConfig holds configuration for connecting to Docker Model Runner
type ModelRunnerConfig struct {
	BaseURL            string
	StatsEndpoint      string
	CollectionInterval time.Duration
	MetricsRegistry    prometheus.Registerer
}

// NewDefaultModelRunnerConfig creates a ModelRunnerConfig with default values
func NewDefaultModelRunnerConfig() ModelRunnerConfig {
	baseURL := os.Getenv("MODEL_RUNNER_URL")
	if baseURL == "" {
		baseURL = "http://model-runner.docker.internal/engines/llama.cpp/v1"
	}

	return ModelRunnerConfig{
		BaseURL:            baseURL,
		StatsEndpoint:      "/stats",
		CollectionInterval: 15 * time.Second,
		MetricsRegistry:    prometheus.DefaultRegisterer,
	}
}

// MonitoringHandler provides an HTTP handler with llama.cpp monitoring
type MonitoringHandler struct {
	monitor    *LlamaCppMonitor
	cleanup    func()
	nextHandler http.Handler
}

// NewMonitoringHandler creates a new HTTP handler with llama.cpp monitoring
func NewMonitoringHandler(config ModelRunnerConfig, next http.Handler) (*MonitoringHandler, error) {
	// Create the monitor
	monitor, cleanup, err := NewLlamaCppMonitor(
		config.MetricsRegistry,
		config.BaseURL,
		config.CollectionInterval,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create llama.cpp monitor: %w", err)
	}

	// Start the monitor
	if err := monitor.Start(); err != nil {
		cleanup()
		return nil, fmt.Errorf("failed to start llama.cpp monitor: %w", err)
	}

	// Create the handler
	return &MonitoringHandler{
		monitor:    monitor,
		cleanup:    cleanup,
		nextHandler: next,
	}, nil
}

// ServeHTTP implements the http.Handler interface
func (h *MonitoringHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	// Add the monitor to the request context
	ctx := context.WithValue(r.Context(), "llama_monitor", h.monitor)
	
	// Call the next handler
	h.nextHandler.ServeHTTP(w, r.WithContext(ctx))
}

// Close cleans up resources
func (h *MonitoringHandler) Close() {
	if h.cleanup != nil {
		h.cleanup()
	}
}

// GetMonitorFromContext retrieves the LlamaCppMonitor from the context
func GetMonitorFromContext(ctx context.Context) (*LlamaCppMonitor, bool) {
	monitor, ok := ctx.Value("llama_monitor").(*LlamaCppMonitor)
	return monitor, ok
}

// TraceChat adds tracing to a chat request using the llama.cpp monitor
func TraceChat(ctx context.Context, inputTokens int) (context.Context, func(outputTokens int, err error)) {
	// Get the monitor from context
	monitor, ok := GetMonitorFromContext(ctx)
	if !ok {
		// No monitor available, return a no-op function
		return ctx, func(outputTokens int, err error) {}
	}

	// Start the trace
	startTime := time.Now()
	ctx, span := monitor.TraceInference(ctx, inputTokens)
	
	// Return a function to be called when the chat is complete
	return ctx, func(outputTokens int, err error) {
		// If there was an error, record it
		if err != nil {
			monitor.RecordError("inference_error")
			if span != nil {
				span.RecordError(err)
				span.SetStatus(codes.Error, err.Error())
			}
		} else {
			// Record metrics for successful inference
			var firstTokenTime time.Time
			if span != nil {
				// The span might contain first token timing information
				spanCtx := span.SpanContext()
				if spanCtx.HasTraceID() {
					firstTokenTime = startTime.Add(100 * time.Millisecond) // Simplified example
				}
			}
			
			monitor.RecordInferenceMetrics(
				startTime,
				inputTokens,
				outputTokens,
				firstTokenTime,
			)
		}
		
		// End the span
		if span != nil {
			span.End()
		}
	}
}

// WrapWithLlamaCppMonitoring adds llama.cpp monitoring to an HTTP handler
func WrapWithLlamaCppMonitoring(next http.Handler) (http.Handler, func(), error) {
	// Create a default config
	config := NewDefaultModelRunnerConfig()
	
	// Create the monitoring handler
	handler, err := NewMonitoringHandler(config, next)
	if err != nil {
		return nil, nil, err
	}
	
	// Return the handler and a cleanup function
	return handler, handler.Close, nil
}