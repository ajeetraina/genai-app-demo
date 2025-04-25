package llamacpp

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/prometheus/client_golang/prometheus"
)

// Metrics is a collection of Prometheus metrics for llama.cpp
type Metrics struct {
	// Memory metrics
	MemoryUsage *prometheus.GaugeVec
	TotalMemory *prometheus.GaugeVec
	
	// Performance metrics
	TokensPerSecond *prometheus.GaugeVec
	CPUUtilization  *prometheus.GaugeVec
	GPUUtilization  *prometheus.GaugeVec
	
	// Hardware metrics
	Temperature *prometheus.GaugeVec
	
	// Context metrics
	ContextSize    *prometheus.GaugeVec
	MaxContextSize *prometheus.GaugeVec
	
	// Model metrics
	ModelSize   *prometheus.GaugeVec
	ModelParams *prometheus.GaugeVec
	
	// Batch metrics
	BatchSize     *prometheus.GaugeVec
	OptimalBatch  *prometheus.GaugeVec
	BatchLatency  *prometheus.HistogramVec
	
	// KV cache metrics
	KVCacheUsage *prometheus.GaugeVec
	KVCacheLimit *prometheus.GaugeVec
	
	// Thread metrics
	ThreadCount *prometheus.GaugeVec
	
	// Status metrics
	Status *prometheus.GaugeVec
}

// StatsResponse represents the llama.cpp stats API response
type StatsResponse struct {
	Memory struct {
		Used      int64 `json:"used_bytes"`
		Total     int64 `json:"total_bytes"`
		KVCache   int64 `json:"kv_cache_bytes"`
		KVCacheMax int64 `json:"kv_cache_max_bytes"`
	} `json:"memory"`
	Performance struct {
		TokensPerSecond float64 `json:"tokens_per_second"`
		CPUUtilization  float64 `json:"cpu_utilization"`
		GPUUtilization  float64 `json:"gpu_utilization,omitempty"`
		Temperature     float64 `json:"temperature,omitempty"`
	} `json:"performance"`
	Model struct {
		Name       string `json:"name"`
		Size       int64  `json:"size_bytes"`
		Parameters int64  `json:"parameters"`
		ContextSize int   `json:"context_size"`
		MaxContextSize int `json:"max_context_size"`
	} `json:"model"`
	Batch struct {
		Size         int     `json:"size"`
		OptimalSize  int     `json:"optimal_size"`
		LatencyMs    float64 `json:"latency_ms"`
	} `json:"batch"`
	System struct {
		Threads      int    `json:"threads"`
		Status       string `json:"status"`
	} `json:"system"`
}

// NewMetrics creates and registers llama.cpp metrics
func NewMetrics(registry *prometheus.Registry) *Metrics {
	m := &Metrics{
		MemoryUsage: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "llamacpp_memory_usage_bytes",
			Help: "Memory usage by llama.cpp in bytes",
		}, []string{"model"}),
		
		TotalMemory: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "llamacpp_total_memory_bytes",
			Help: "Total memory available to llama.cpp in bytes",
		}, []string{"model"}),
		
		TokensPerSecond: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "llamacpp_tokens_per_second",
			Help: "Tokens processed per second by llama.cpp",
		}, []string{"model"}),
		
		CPUUtilization: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "llamacpp_cpu_utilization_percent",
			Help: "CPU utilization by llama.cpp in percent",
		}, []string{"model"}),
		
		GPUUtilization: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "llamacpp_gpu_utilization_percent",
			Help: "GPU utilization by llama.cpp in percent",
		}, []string{"model"}),
		
		Temperature: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "llamacpp_temperature_celsius",
			Help: "GPU temperature in celsius",
		}, []string{"model"}),
		
		ContextSize: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "llamacpp_context_size_tokens",
			Help: "Current context size in tokens",
		}, []string{"model"}),
		
		MaxContextSize: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "llamacpp_max_context_size_tokens",
			Help: "Maximum context size in tokens",
		}, []string{"model"}),
		
		ModelSize: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "llamacpp_model_size_bytes",
			Help: "Model size in bytes",
		}, []string{"model"}),
		
		ModelParams: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "llamacpp_model_parameters",
			Help: "Number of parameters in the model",
		}, []string{"model"}),
		
		BatchSize: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "llamacpp_batch_size",
			Help: "Current batch size in tokens",
		}, []string{"model"}),
		
		OptimalBatch: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "llamacpp_optimal_batch_size",
			Help: "Optimal batch size in tokens",
		}, []string{"model"}),
		
		BatchLatency: prometheus.NewHistogramVec(prometheus.HistogramOpts{
			Name: "llamacpp_batch_latency_seconds",
			Help: "Batch processing latency in seconds",
			Buckets: prometheus.LinearBuckets(0.001, 0.005, 10),
		}, []string{"model"}),
		
		KVCacheUsage: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "llamacpp_kv_cache_usage_bytes",
			Help: "KV cache usage in bytes",
		}, []string{"model"}),
		
		KVCacheLimit: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "llamacpp_kv_cache_limit_bytes",
			Help: "KV cache limit in bytes",
		}, []string{"model"}),
		
		ThreadCount: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "llamacpp_thread_count",
			Help: "Number of threads used by llama.cpp",
		}, []string{"model"}),
		
		Status: prometheus.NewGaugeVec(prometheus.GaugeOpts{
			Name: "llamacpp_status",
			Help: "Status of llama.cpp (1 = idle, 2 = loading, 3 = running)",
		}, []string{"model"}),
	}
	
	// Register all metrics with the provided registry
	registry.MustRegister(
		m.MemoryUsage,
		m.TotalMemory,
		m.TokensPerSecond,
		m.CPUUtilization,
		m.GPUUtilization,
		m.Temperature,
		m.ContextSize,
		m.MaxContextSize,
		m.ModelSize,
		m.ModelParams,
		m.BatchSize,
		m.OptimalBatch,
		m.BatchLatency,
		m.KVCacheUsage,
		m.KVCacheLimit,
		m.ThreadCount,
		m.Status,
	)
	
	return m
}

// StartMetricsCollection starts a background goroutine to collect metrics from llama.cpp
func (m *Metrics) StartMetricsCollection(baseURL, modelName string, interval time.Duration, client *http.Client) {
	go func() {
		ticker := time.NewTicker(interval)
		defer ticker.Stop()
		
		for range ticker.C {
			stats, err := fetchLlamaCppStats(baseURL, client)
			if err != nil {
				log.Printf("Error fetching llama.cpp stats: %v", err)
				continue
			}
			
			m.updateMetrics(stats, modelName)
		}
	}()
}

// fetchLlamaCppStats fetches statistics from the llama.cpp API
func fetchLlamaCppStats(baseURL string, client *http.Client) (*StatsResponse, error) {
	resp, err := client.Get(fmt.Sprintf("%s/stats", baseURL))
	if err != nil {
		return nil, fmt.Errorf("failed to fetch stats: %w", err)
	}
	defer resp.Body.Close()
	
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}
	
	var stats StatsResponse
	if err := json.NewDecoder(resp.Body).Decode(&stats); err != nil {
		return nil, fmt.Errorf("failed to decode stats: %w", err)
	}
	
	return &stats, nil
}

// updateMetrics updates Prometheus metrics with values from llama.cpp stats
func (m *Metrics) updateMetrics(stats *StatsResponse, modelName string) {
	// Memory metrics
	m.MemoryUsage.WithLabelValues(modelName).Set(float64(stats.Memory.Used))
	m.TotalMemory.WithLabelValues(modelName).Set(float64(stats.Memory.Total))
	m.KVCacheUsage.WithLabelValues(modelName).Set(float64(stats.Memory.KVCache))
	m.KVCacheLimit.WithLabelValues(modelName).Set(float64(stats.Memory.KVCacheMax))
	
	// Performance metrics
	m.TokensPerSecond.WithLabelValues(modelName).Set(stats.Performance.TokensPerSecond)
	m.CPUUtilization.WithLabelValues(modelName).Set(stats.Performance.CPUUtilization)
	
	// GPU metrics may not be available if running on CPU
	if stats.Performance.GPUUtilization > 0 {
		m.GPUUtilization.WithLabelValues(modelName).Set(stats.Performance.GPUUtilization)
	}
	
	if stats.Performance.Temperature > 0 {
		m.Temperature.WithLabelValues(modelName).Set(stats.Performance.Temperature)
	}
	
	// Model metrics
	m.ModelSize.WithLabelValues(modelName).Set(float64(stats.Model.Size))
	m.ModelParams.WithLabelValues(modelName).Set(float64(stats.Model.Parameters))
	m.ContextSize.WithLabelValues(modelName).Set(float64(stats.Model.ContextSize))
	m.MaxContextSize.WithLabelValues(modelName).Set(float64(stats.Model.MaxContextSize))
	
	// Batch metrics
	m.BatchSize.WithLabelValues(modelName).Set(float64(stats.Batch.Size))
	m.OptimalBatch.WithLabelValues(modelName).Set(float64(stats.Batch.OptimalSize))
	m.BatchLatency.WithLabelValues(modelName).Observe(stats.Batch.LatencyMs / 1000.0) // Convert ms to seconds
	
	// Thread metrics
	m.ThreadCount.WithLabelValues(modelName).Set(float64(stats.System.Threads))
	
	// Status metrics (convert string to numeric value)
	var statusValue float64
	switch stats.System.Status {
	case "idle":
		statusValue = 1
	case "loading":
		statusValue = 2
	case "running":
		statusValue = 3
	default:
		statusValue = 0
	}
	m.Status.WithLabelValues(modelName).Set(statusValue)
}