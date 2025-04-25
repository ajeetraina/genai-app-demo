package llamacpp

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"syscall"
	"time"
)

// Config holds configuration for the llama.cpp monitor
type Config struct {
	// Base URL for the llama.cpp API
	BaseURL string
	
	// Model name for labeling metrics
	ModelName string
	
	// Exporter address for Prometheus metrics
	ExporterAddr string
	
	// Interval between metrics scrapes
	ScrapeInterval time.Duration
	
	// HTTP client timeout
	ClientTimeout time.Duration
}

// Monitor handles monitoring of a llama.cpp instance
type Monitor struct {
	config  Config
	client  *http.Client
	exporter *Exporter
}

// DefaultConfig returns the default configuration
func DefaultConfig() Config {
	return Config{
		BaseURL:         getEnvOrDefault("LLAMACPP_BASE_URL", "http://model-runner.docker.internal/engines/llama.cpp/v1"),
		ModelName:       getEnvOrDefault("LLAMACPP_MODEL", "llama"),
		ExporterAddr:    getEnvOrDefault("LLAMACPP_EXPORTER_ADDR", ":9100"),
		ScrapeInterval:  getDurationEnvOrDefault("LLAMACPP_SCRAPE_INTERVAL", 5*time.Second),
		ClientTimeout:   getDurationEnvOrDefault("LLAMACPP_CLIENT_TIMEOUT", 3*time.Second),
	}
}

// NewMonitor creates a new llama.cpp monitor
func NewMonitor(config Config) *Monitor {
	return &Monitor{
		config: config,
		client: &http.Client{
			Timeout: config.ClientTimeout,
		},
		exporter: NewExporter(config.ExporterAddr),
	}
}

// Start starts the monitor
func (m *Monitor) Start() error {
	log.Printf("Starting llama.cpp monitor for model %s at %s", m.config.ModelName, m.config.BaseURL)
	
	// Set up graceful shutdown
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	
	// Handle signals for graceful shutdown
	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt, syscall.SIGTERM)
	
	go func() {
		<-c
		log.Println("Shutting down llama.cpp monitor...")
		cancel()
		if err := m.exporter.Stop(); err != nil {
			log.Printf("Error stopping exporter: %v", err)
		}
	}()
	
	// Start the exporter
	return m.exporter.Start(m.config.BaseURL, m.config.ModelName, m.config.ScrapeInterval, m.client)
}

// GetMetrics returns the metrics collector
func (m *Monitor) GetMetrics() *Metrics {
	return m.exporter.Metrics()
}

// Helper function to get environment variables with defaults
func getEnvOrDefault(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// Helper function to get durations from environment variables with defaults
func getDurationEnvOrDefault(key string, defaultValue time.Duration) time.Duration {
	if value := os.Getenv(key); value != "" {
		if duration, err := time.ParseDuration(value); err == nil {
			return duration
		}
		
		// If not a duration, try to parse as seconds
		if seconds, err := strconv.Atoi(value); err == nil {
			return time.Duration(seconds) * time.Second
		}
	}
	return defaultValue
}