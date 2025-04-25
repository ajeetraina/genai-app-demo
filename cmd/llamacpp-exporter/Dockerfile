# syntax=docker/dockerfile:1

# Build stage
ARG GO_VERSION=1.23.4
FROM --platform=$BUILDPLATFORM golang:${GO_VERSION} AS builder

WORKDIR /src

# Copy go module files first for better caching
COPY go.mod go.sum ./
RUN --mount=type=cache,target=/go/pkg/mod/ \
    go mod download -x

# Create a minimal version of the monitor file with the fix
RUN mkdir -p /src/pkg/llamacpp
RUN echo 'package llamacpp

import (
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
	BaseURL         string
	ModelName       string
	ExporterAddr    string
	ScrapeInterval  time.Duration
	ClientTimeout   time.Duration
}

// Monitor handles monitoring of a llama.cpp instance
type Monitor struct {
	config  Config
	client  *http.Client
	exporter *Exporter
}

func DefaultConfig() Config {
	return Config{
		BaseURL:         getEnvOrDefault("LLAMACPP_BASE_URL", "http://model-runner.docker.internal/engines/llama.cpp/v1"),
		ModelName:       getEnvOrDefault("LLAMACPP_MODEL", "llama"),
		ExporterAddr:    getEnvOrDefault("LLAMACPP_EXPORTER_ADDR", ":9100"),
		ScrapeInterval:  getDurationEnvOrDefault("LLAMACPP_SCRAPE_INTERVAL", 5*time.Second),
		ClientTimeout:   getDurationEnvOrDefault("LLAMACPP_CLIENT_TIMEOUT", 3*time.Second),
	}
}

func NewMonitor(config Config) *Monitor {
	return &Monitor{
		config: config,
		client: &http.Client{
			Timeout: config.ClientTimeout,
		},
		exporter: NewExporter(config.ExporterAddr),
	}
}

func (m *Monitor) Start() error {
	log.Printf("Starting llama.cpp monitor for model %s at %s", m.config.ModelName, m.config.BaseURL)
	
	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt, syscall.SIGTERM)
	
	go func() {
		<-c
		log.Println("Shutting down llama.cpp monitor...")
		if err := m.exporter.Stop(); err != nil {
			log.Printf("Error stopping exporter: %v", err)
		}
	}()
	
	return m.exporter.Start(m.config.BaseURL, m.config.ModelName, m.config.ScrapeInterval, m.client)
}

func (m *Monitor) GetMetrics() *Metrics {
	return m.exporter.Metrics()
}

func getEnvOrDefault(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getDurationEnvOrDefault(key string, defaultValue time.Duration) time.Duration {
	if value := os.Getenv(key); value != "" {
		if duration, err := time.ParseDuration(value); err == nil {
			return duration
		}
		
		if seconds, err := strconv.Atoi(value); err == nil {
			return time.Duration(seconds) * time.Second
		}
	}
	return defaultValue
}' > /src/pkg/llamacpp/monitor.go

# Copy the rest of the source code, excluding the problematic monitor.go file
COPY ./cmd ./cmd
COPY ./pkg/llamacpp/metrics.go ./pkg/llamacpp/
COPY ./pkg/llamacpp/exporter.go ./pkg/llamacpp/

# Build the exporter
ARG TARGETARCH
RUN --mount=type=cache,target=/go/pkg/mod/ \
    CGO_ENABLED=0 GOARCH=$TARGETARCH go build -o /bin/llamacpp-exporter ./cmd/llamacpp-exporter

# Final stage
FROM alpine:latest

# Install necessary tools
RUN apk --no-cache add ca-certificates tzdata curl

# Create non-root user
ARG UID=10001
RUN adduser \
    --disabled-password \
    --gecos "" \
    --home "/nonexistent" \
    --shell "/sbin/nologin" \
    --no-create-home \
    --uid "${UID}" \
    appuser

# Copy binary from builder
COPY --from=builder /bin/llamacpp-exporter /bin/

# Switch to non-root user
USER appuser

# Expose the metrics port
EXPOSE 9100

# Set healthcheck
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:9100/metrics || exit 1

# Run the exporter
ENTRYPOINT ["/bin/llamacpp-exporter"]