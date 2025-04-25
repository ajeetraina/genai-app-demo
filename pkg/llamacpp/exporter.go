package llamacpp

import (
	"log"
	"net/http"
	"time"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

// Exporter implements a Prometheus exporter for llama.cpp metrics
type Exporter struct {
	registry *prometheus.Registry
	metrics  *Metrics
	server   *http.Server
}

// NewExporter creates a new llama.cpp metrics exporter
func NewExporter(addr string) *Exporter {
	registry := prometheus.NewRegistry()

	return &Exporter{
		registry: registry,
		metrics:  NewMetrics(registry),
		server: &http.Server{
			Addr:         addr,
			ReadTimeout:  10 * time.Second,
			WriteTimeout: 10 * time.Second,
		},
	}
}

// Start starts the exporter server and metrics collection
func (e *Exporter) Start(baseURL, modelName string, scrapeInterval time.Duration, client *http.Client) error {
	// Set up HTTP server for metrics
	mux := http.NewServeMux()
	mux.Handle("/metrics", promhttp.HandlerFor(e.registry, promhttp.HandlerOpts{}))
	e.server.Handler = mux

	// Start metrics collection
	e.metrics.StartMetricsCollection(baseURL, modelName, scrapeInterval, client)

	// Start HTTP server
	log.Printf("Starting llama.cpp exporter on %s", e.server.Addr)
	if err := e.server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		return err
	}

	return nil
}

// Stop stops the exporter server
func (e *Exporter) Stop() error {
	return e.server.Close()
}

// Registry returns the underlying Prometheus registry
func (e *Exporter) Registry() *prometheus.Registry {
	return e.registry
}

// Metrics returns the metrics collector
func (e *Exporter) Metrics() *Metrics {
	return e.metrics
}
