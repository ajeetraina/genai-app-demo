FROM golang:1.23.4 AS builder
WORKDIR /app

# Create directories
RUN mkdir -p /app/cmd/llamacpp-exporter

# Create Go file using heredoc
RUN cat > /app/cmd/llamacpp-exporter/main.go << 'EOF'
package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"time"
)

func main() {
	addr := ":9100"
	if port := os.Getenv("PORT"); port != "" {
		addr = ":" + port
	}

	modelName := os.Getenv("LLAMACPP_MODEL")
	if modelName == "" {
		modelName = "llama"
	}

	http.HandleFunc("/metrics", func(w http.ResponseWriter, r *http.Request) {
		// Simple metrics for testing
		metrics := []string{
			fmt.Sprintf("# HELP llamacpp_status Status of llama.cpp (1 = idle, 2 = loading, 3 = running)"),
			fmt.Sprintf("# TYPE llamacpp_status gauge"),
			fmt.Sprintf("llamacpp_status{model=\"%s\"} 3", modelName),
			fmt.Sprintf("# HELP llamacpp_tokens_per_second Tokens processed per second by llama.cpp"),
			fmt.Sprintf("# TYPE llamacpp_tokens_per_second gauge"),
			fmt.Sprintf("llamacpp_tokens_per_second{model=\"%s\"} %.2f", modelName, 25.0+5.0*float64(time.Now().Unix()%%10)),
			fmt.Sprintf("# HELP llamacpp_memory_usage_bytes Memory usage by llama.cpp in bytes"),
			fmt.Sprintf("# TYPE llamacpp_memory_usage_bytes gauge"),
			fmt.Sprintf("llamacpp_memory_usage_bytes{model=\"%s\"} %d", modelName, 1024*1024*1024),
			fmt.Sprintf("# HELP llamacpp_total_memory_bytes Total memory available to llama.cpp in bytes"),
			fmt.Sprintf("# TYPE llamacpp_total_memory_bytes gauge"),
			fmt.Sprintf("llamacpp_total_memory_bytes{model=\"%s\"} %d", modelName, 2*1024*1024*1024),
			fmt.Sprintf("# HELP llamacpp_cpu_utilization_percent CPU utilization by llama.cpp in percent"),
			fmt.Sprintf("# TYPE llamacpp_cpu_utilization_percent gauge"),
			fmt.Sprintf("llamacpp_cpu_utilization_percent{model=\"%s\"} %.2f", modelName, 50.0+20.0*float64(time.Now().Unix()%%5)/5.0),
		}

		w.Header().Set("Content-Type", "text/plain")
		for _, m := range metrics {
			fmt.Fprintf(w, "%s\n", m)
		}
	})

	log.Printf("Starting simple llama.cpp exporter on %s", addr)
	log.Printf("Exposing metrics for model: %s", modelName)
	if err := http.ListenAndServe(addr, nil); err != nil {
		log.Fatalf("Error starting server: %v", err)
	}
}
EOF

# Build the application
RUN go build -o /bin/llamacpp-exporter /app/cmd/llamacpp-exporter/main.go

# Final stage
FROM alpine:latest

# Install necessary tools
RUN apk --no-cache add ca-certificates tzdata

# Copy binary from builder
COPY --from=builder /bin/llamacpp-exporter /bin/

# Expose the metrics port
EXPOSE 9100

# Set healthcheck
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -q -O- http://localhost:9100/metrics || exit 1

# Run the exporter
ENTRYPOINT ["/bin/llamacpp-exporter"]