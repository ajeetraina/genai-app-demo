# GenAI App Observability

This directory contains documentation and configuration for the observability features added to the GenAI App Demo.

## Observability Features

The following observability features have been implemented:

### 1. Structured Logging

- Uses `zerolog` for JSON-structured logging
- Log levels: debug, info, warn, error, fatal
- Includes contextual information such as request IDs, durations, and component names
- Can be configured to output pretty-printed logs for development

### 2. Metrics Collection

- Uses Prometheus for metrics collection and storage
- Key metrics captured:
  - Request counts and latencies
  - Token usage (input and output)
  - Model performance (total latency, time to first token)
  - Error rates by type
  - Active request count
  - Memory usage

### 3. Tracing

- OpenTelemetry integration for distributed tracing
- Traces request flow from frontend to backend to model
- Captures spans for key operations

### 4. Visualization

- Grafana dashboard for metrics visualization
- Frontend metrics panel for quick insights
- Jaeger UI for trace exploration

### 5. Health Checks

- `/health` endpoint for basic health status
- `/readiness` endpoint for readiness checks
- Memory stats and uptime information

## Architecture

The observability stack consists of:

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │ >>> │   Backend   │ >>> │ Model Runner│
│  (React/TS) │     │    (Go)     │     │ (Llama 3.2) │
└─────────────┘     └─────────────┘     └─────────────┘
                          v  v
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Grafana   │ <<< │ Prometheus  │     │   Jaeger    │
│ Dashboards  │     │  Metrics    │     │   Tracing   │
└─────────────┘     └─────────────┘     └─────────────┘
```

## Getting Started

### Environment Variables

The following environment variables can be set in `backend.env`:

```
# Observability configuration
LOG_LEVEL: info      # debug, info, warn, error
LOG_PRETTY: true     # Whether to output pretty-printed logs
TRACING_ENABLED: true  # Enable OpenTelemetry tracing
OTLP_ENDPOINT: jaeger:4318  # OpenTelemetry collector endpoint
```

### Accessing Dashboards

- **Metrics Dashboard**: http://localhost:3001 (Grafana)
- **Tracing UI**: http://localhost:16686 (Jaeger UI)
- **Prometheus**: http://localhost:9091

### Default Credentials

- **Grafana**: admin/admin

## Key Metrics

### LLM Performance Metrics

- **Model Latency**: Total time to generate a response
- **Time to First Token**: Time until the first token is generated
- **Token Usage**: Number of tokens processed (input and output)

### Application Metrics

- **Request Rate**: Number of requests per second
- **Error Rate**: Percentage of failed requests
- **Active Requests**: Number of currently processing requests

## Custom Metric Endpoints

In addition to standard Prometheus metrics, the application exposes:

- `/metrics/summary` - High-level metrics summary for the frontend
- `/metrics/log` - Endpoint to log metrics from the frontend
- `/metrics/error` - Endpoint to log errors from the frontend

## FAQs

### How do I add a new metric?

Add new metrics to the `pkg/metrics/metrics.go` file following the existing patterns.

### How do I add distributed tracing to a new endpoint?

Use the `tracing.StartSpan()` function to create a new span, and call the cleanup function when done:

```go
ctx, endSpan := tracing.StartSpan(r.Context(), "operation_name")
defer endSpan()

// Your code here
```

### How do I customize the Grafana dashboard?

The dashboard is defined in `grafana/provisioning/dashboards/llm-dashboard.json`. You can edit it directly or export a new version from the Grafana UI.
