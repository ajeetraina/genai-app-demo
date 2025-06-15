package metrics

import (
	"net/http"
	"time"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

var (
	// RequestCounter counts total HTTP requests
	RequestCounter = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Name: "genai_app_http_requests_total",
			Help: "Total number of HTTP requests",
		},
		[]string{"method", "endpoint", "status"},
	)

	// RequestDuration measures HTTP request durations
	RequestDuration = promauto.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "genai_app_http_request_duration_seconds",
			Help:    "HTTP request duration in seconds",
			Buckets: prometheus.DefBuckets,
		},
		[]string{"method", "endpoint"},
	)

	// ChatTokensCounter counts tokens in chat requests and responses
	ChatTokensCounter = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Name: "genai_app_chat_tokens_total",
			Help: "Total number of tokens processed in chat",
		},
		[]string{"direction", "model"},
	)

	// ModelLatency measures model response time
	ModelLatency = promauto.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "genai_app_model_latency_seconds",
			Help:    "Model response time in seconds",
			Buckets: []float64{0.1, 0.5, 1, 2, 5, 10, 20, 30, 60},
		},
		[]string{"model", "operation"},
	)

	// FirstTokenLatency measures time to first token
	FirstTokenLatency = promauto.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "genai_app_first_token_latency_seconds",
			Help:    "Time to first token in seconds",
			Buckets: []float64{0.1, 0.25, 0.5, 1, 2, 5},
		},
		[]string{"model"},
	)

	// ErrorCounter counts errors by type
	ErrorCounter = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Name: "genai_app_errors_total",
			Help: "Total number of errors",
		},
		[]string{"type", "operation"},
	)

	// ActiveRequests tracks currently active requests
	ActiveRequests = promauto.NewGauge(
		prometheus.GaugeOpts{
			Name: "genai_app_active_requests",
			Help: "Number of currently active requests",
		},
	)

	// ModelMemoryUsage tracks model memory usage
	ModelMemoryUsage = promauto.NewGaugeVec(
		prometheus.GaugeOpts{
			Name: "genai_app_model_memory_bytes",
			Help: "Model memory usage in bytes",
		},
		[]string{"model"},
	)

	// LlamaCppContextSize measures the context window size
	LlamaCppContextSize = promauto.NewGaugeVec(
		prometheus.GaugeOpts{
			Name: "genai_app_llamacpp_context_size",
			Help: "Context window size in tokens for llama.cpp models",
		},
		[]string{"model"},
	)

	// LlamaCppPromptEvalTime measures the time spent evaluating the prompt
	LlamaCppPromptEvalTime = promauto.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "genai_app_llamacpp_prompt_eval_seconds",
			Help:    "Time spent evaluating the prompt in seconds",
			Buckets: []float64{0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10},
		},
		[]string{"model"},
	)

	// LlamaCppTokensPerSecond measures generation speed
	LlamaCppTokensPerSecond = promauto.NewGaugeVec(
		prometheus.GaugeOpts{
			Name: "genai_app_llamacpp_tokens_per_second",
			Help: "Tokens generated per second",
		},
		[]string{"model"},
	)

	// LlamaCppMemoryPerToken tracks memory usage per token
	LlamaCppMemoryPerToken = promauto.NewGaugeVec(
		prometheus.GaugeOpts{
			Name: "genai_app_llamacpp_memory_per_token_bytes",
			Help: "Memory usage per token in bytes",
		},
		[]string{"model"},
	)

	// LlamaCppThreadsUsed tracks the number of threads used for inference
	LlamaCppThreadsUsed = promauto.NewGaugeVec(
		prometheus.GaugeOpts{
			Name: "genai_app_llamacpp_threads_used",
			Help: "Number of threads used for inference",
		},
		[]string{"model"},
	)

	// LlamaCppBatchSize tracks the batch size used for inference
	LlamaCppBatchSize = promauto.NewGaugeVec(
		prometheus.GaugeOpts{
			Name: "genai_app_llamacpp_batch_size",
			Help: "Batch size used for inference",
		},
		[]string{"model"},
	)
)

// SetupMetricsServer initializes and returns an HTTP server for metrics
func SetupMetricsServer(addr string) *http.Server {
	mux := http.NewServeMux()
	mux.Handle("/metrics", promhttp.Handler())

	return &http.Server{
		Addr:         addr,
		Handler:      mux,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
	}
}

// RecordModelInference records metrics for a model inference
func RecordModelInference(model string, startTime time.Time, tokensIn, tokensOut int, firstTokenTime time.Time) {
	// Record total tokens
	ChatTokensCounter.WithLabelValues("input", model).Add(float64(tokensIn))
	ChatTokensCounter.WithLabelValues("output", model).Add(float64(tokensOut))

	// Record model latency
	ModelLatency.WithLabelValues(model, "inference").Observe(time.Since(startTime).Seconds())

	// Record time to first token
	if !firstTokenTime.IsZero() {
		FirstTokenLatency.WithLabelValues(model).Observe(firstTokenTime.Sub(startTime).Seconds())
	}
}

// RecordLlamaCppMetrics records metrics specific to llama.cpp
func RecordLlamaCppMetrics(model string, contextSize int, promptEvalTime time.Duration, 
	tokensPerSecond float64, memoryPerToken float64, threadsUsed int, batchSize int) {
	
	// Record context size
	LlamaCppContextSize.WithLabelValues(model).Set(float64(contextSize))
	
	// Record prompt evaluation time
	LlamaCppPromptEvalTime.WithLabelValues(model).Observe(promptEvalTime.Seconds())
	
	// Record tokens per second
	LlamaCppTokensPerSecond.WithLabelValues(model).Set(tokensPerSecond)
	
	// Record memory per token
	LlamaCppMemoryPerToken.WithLabelValues(model).Set(memoryPerToken)
	
	// Record threads used
	LlamaCppThreadsUsed.WithLabelValues(model).Set(float64(threadsUsed))
	
	// Record batch size
	LlamaCppBatchSize.WithLabelValues(model).Set(float64(batchSize))
}
