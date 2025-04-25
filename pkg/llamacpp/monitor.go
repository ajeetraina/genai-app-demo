package llamacpp

import (
	"context"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"sync"
	"time"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/rs/zerolog/log"
)

// ModelConfig contains configuration for the model
type ModelConfig struct {
	Name         string
	Size         string
	Quantization string
	ContextSize  int
}

// LlamaCppMonitor provides monitoring capabilities for llama.cpp
type LlamaCppMonitor struct {
	Metrics        *LlamaCppMetrics
	Tracer         *LlamaCppTracer
	StatsCollector *StatsCollector
	ModelConfig    ModelConfig
	mutex          sync.Mutex
	isEnabled      bool
}

// NewLlamaCppMonitor creates a new monitor for llama.cpp
func NewLlamaCppMonitor(registry prometheus.Registerer, modelRunnerEndpoint string, collectionInterval time.Duration) (*LlamaCppMonitor, func(), error) {
	metrics := NewLlamaCppMetrics(registry)
	
	// Initialize tracer
	tracer, tracerCleanup, err := NewLlamaCppTracer("llama-cpp-monitor")
	if err != nil {
		return nil, nil, fmt.Errorf("failed to create tracer: %w", err)
	}
	
	// Create stats collector
	statsCollector := NewStatsCollector(metrics, modelRunnerEndpoint, collectionInterval)
	
	// Fetch model configuration
	modelConfig, err := fetchModelConfig(modelRunnerEndpoint)
	if err != nil {
		log.Warn().Err(err).Msg("Failed to fetch model configuration, using defaults")
		modelConfig = ModelConfig{
			Name:         "unknown",
			Size:         "unknown",
			Quantization: "unknown",
			ContextSize:  4096,
		}
	}
	
	monitor := &LlamaCppMonitor{
		Metrics:        metrics,
		Tracer:         tracer,
		StatsCollector: statsCollector,
		ModelConfig:    modelConfig,
		isEnabled:      true,
	}
	
	// Create a cleanup function
	cleanup := func() {
		monitor.Stop()
		tracerCleanup()
	}
	
	return monitor, cleanup, nil
}

// Start begins the monitoring
func (m *LlamaCppMonitor) Start() error {
	m.mutex.Lock()
	defer m.mutex.Unlock()
	
	if !m.isEnabled {
		return fmt.Errorf("monitor is not enabled")
	}
	
	// Start stats collector
	err := m.StatsCollector.Start()
	if err != nil {
		return fmt.Errorf("failed to start stats collector: %w", err)
	}
	
	return nil
}

// Stop halts the monitoring
func (m *LlamaCppMonitor) Stop() {
	m.mutex.Lock()
	defer m.mutex.Unlock()
	
	m.StatsCollector.Stop()
}

// Enable enables the monitoring
func (m *LlamaCppMonitor) Enable() {
	m.mutex.Lock()
	defer m.mutex.Unlock()
	
	m.isEnabled = true
}

// Disable disables the monitoring
func (m *LlamaCppMonitor) Disable() {
	m.mutex.Lock()
	defer m.mutex.Unlock()
	
	m.isEnabled = false
	m.StatsCollector.Stop()
}

// TraceInference creates a trace for an inference operation
func (m *LlamaCppMonitor) TraceInference(ctx context.Context, inputTokens int) (context.Context, trace.Span) {
	m.mutex.Lock()
	defer m.mutex.Unlock()
	
	if !m.isEnabled {
		return ctx, nil
	}
	
	modelInfo := map[string]string{
		"name":         m.ModelConfig.Name,
		"size":         m.ModelConfig.Size,
		"quantization": m.ModelConfig.Quantization,
	}
	
	return m.Tracer.TraceInference(ctx, modelInfo, inputTokens)
}

// RecordInferenceMetrics records metrics for an inference operation
func (m *LlamaCppMonitor) RecordInferenceMetrics(
	startTime time.Time,
	prefillTokens int,
	decodeTokens int,
	firstTokenTime time.Time,
) {
	m.mutex.Lock()
	defer m.mutex.Unlock()
	
	if !m.isEnabled {
		return
	}
	
	m.Metrics.RecordInferenceMetrics(
		m.ModelConfig.Name,
		m.ModelConfig.Size,
		m.ModelConfig.Quantization,
		startTime,
		prefillTokens,
		decodeTokens,
		firstTokenTime,
	)
}

// RecordContextOverflow records a context overflow event
func (m *LlamaCppMonitor) RecordContextOverflow() {
	m.mutex.Lock()
	defer m.mutex.Unlock()
	
	if !m.isEnabled {
		return
	}
	
	m.Metrics.RecordContextOverflow(
		m.ModelConfig.Name,
		m.ModelConfig.Size,
		m.ModelConfig.Quantization,
	)
}

// RecordError records an error event
func (m *LlamaCppMonitor) RecordError(errorType string) {
	m.mutex.Lock()
	defer m.mutex.Unlock()
	
	if !m.isEnabled {
		return
	}
	
	m.Metrics.RecordError(
		m.ModelConfig.Name,
		m.ModelConfig.Size,
		m.ModelConfig.Quantization,
		errorType,
	)
}

// fetchModelConfig fetches model configuration from the Docker Model Runner
func fetchModelConfig(endpoint string) (ModelConfig, error) {
	// Build URL for the model info endpoint
	url := fmt.Sprintf("%s/info", endpoint)
	
	resp, err := http.Get(url)
	if err != nil {
		return ModelConfig{}, fmt.Errorf("failed to fetch model info: %w", err)
	}
	defer resp.Body.Close()
	
	if resp.StatusCode != http.StatusOK {
		return ModelConfig{}, fmt.Errorf("received non-OK status from model info endpoint: %d", resp.StatusCode)
	}
	
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return ModelConfig{}, fmt.Errorf("failed to read response body: %w", err)
	}
	
	// Parse the response as JSON
	var data struct {
		ModelInfo struct {
			Name         string `json:"name"`
			Size         string `json:"size"`
			Quantization string `json:"quantization"`
			ContextSize  int    `json:"context_size"`
		} `json:"model_info"`
	}
	
	if err := json.Unmarshal(body, &data); err != nil {
		return ModelConfig{}, fmt.Errorf("failed to parse model info: %w", err)
	}
	
	return ModelConfig{
		Name:         data.ModelInfo.Name,
		Size:         data.ModelInfo.Size,
		Quantization: data.ModelInfo.Quantization,
		ContextSize:  data.ModelInfo.ContextSize,
	}, nil
}