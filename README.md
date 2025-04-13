# GenAI App Demo with Docker Model Runner

A modern, full-stack chat application demonstrating how to integrate React frontend with a Go backend and run local Large Language Models (LLMs) using Docker's Model Runner.

## Overview

This project showcases a complete Generative AI interface that includes:
- React/TypeScript frontend with a responsive chat UI
- Go backend server for API handling
- Integration with Docker's Model Runner to run Llama 3.2 locally
- Comprehensive observability with metrics, logging, and tracing

## Features

- 💬 Interactive chat interface with message history
- 🔄 Real-time streaming responses (tokens appear as they're generated)
- 🌓 Light/dark mode support based on user preference
- 🐳 Dockerized deployment for easy setup and portability
- 🏠 Run AI models locally without cloud API dependencies
- 🔒 Cross-origin resource sharing (CORS) enabled
- 🧪 Integration testing using Testcontainers
- 📊 Metrics and performance monitoring
- 📝 Structured logging with zerolog
- 🔍 Distributed tracing with OpenTelemetry
- 📈 Grafana dashboards for visualization

## Architecture

The application consists of these main components:

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │ >>> │   Backend   │ >>> │ Model Runner│
│  (React/TS) │     │    (Go)     │     │ (Llama 3.2) │
└─────────────┘     └─────────────┘     └─────────────┘
      :3000              :8080               :12434
                          │  │
┌─────────────┐     ┌─────┘  └─────┐     ┌─────────────┐
│   Grafana   │ <<< │ Prometheus  │     │   Jaeger    │
│ Dashboards  │     │  Metrics    │     │   Tracing   │
└─────────────┘     └─────────────┘     └─────────────┘
      :3001              :9091              :16686
```

## Connection Methods

There are two ways to connect to Model Runner:

### 1. Using Internal DNS (Default)

This method uses Docker's internal DNS resolution to connect to the Model Runner:
- Connection URL: `http://model-runner.docker.internal/engines/llama.cpp/v1/`
- Configuration is set in `backend.env`

### 2. Using TCP

This method uses host-side TCP support:
- Connection URL: `host.docker.internal:12434`
- Requires updates to the environment configuration

## Prerequisites

- Docker and Docker Compose
- Git
- Go 1.19 or higher (for local development)
- Node.js and npm (for frontend development)

Before starting, pull the required model:

```bash
docker model pull ignaciolopezluna020/llama3.2:1B
```

## Quick Start

1. Clone this repository:
   ```bash
   git clone https://github.com/ajeetraina/genai-app-demo.git
   cd genai-app-demo
   ```

2. Start the application using Docker Compose:
   ```bash
   docker compose up -d --build
   ```

3. Access the frontend at [http://localhost:3000](http://localhost:3000)

4. Access observability dashboards:
   - Grafana: [http://localhost:3001](http://localhost:3001) (admin/admin)
   - Jaeger UI: [http://localhost:16686](http://localhost:16686)
   - Prometheus: [http://localhost:9091](http://localhost:9091)

## Development Setup

### Frontend

The frontend is built with React, TypeScript, and Vite:

```bash
cd frontend
npm install
npm run dev
```

This will start the development server at [http://localhost:3000](http://localhost:3000).

### Backend

The Go backend can be run directly:

```bash
go mod download
go run main.go
```

Make sure to set the required environment variables from `backend.env`:
- `BASE_URL`: URL for the model runner
- `MODEL`: Model identifier to use
- `API_KEY`: API key for authentication (defaults to "ollama")
- `LOG_LEVEL`: Logging level (debug, info, warn, error)
- `LOG_PRETTY`: Whether to output pretty-printed logs
- `TRACING_ENABLED`: Enable OpenTelemetry tracing
- `OTLP_ENDPOINT`: OpenTelemetry collector endpoint

## How It Works

1. The frontend sends chat messages to the backend API
2. The backend formats the messages and sends them to the Model Runner
3. The LLM processes the input and generates a response
4. The backend streams the tokens back to the frontend as they're generated
5. The frontend displays the incoming tokens in real-time
6. Observability components collect metrics, logs, and traces throughout the process

## Project Structure

```
├── compose.yaml           # Docker Compose configuration
├── backend.env            # Backend environment variables
├── main.go                # Go backend server
├── frontend/              # React frontend application
│   ├── src/               # Source code
│   │   ├── components/    # React components
│   │   ├── App.tsx        # Main application component
│   │   └── ...
├── pkg/                   # Go packages
│   ├── logger/            # Structured logging
│   ├── metrics/           # Prometheus metrics
│   ├── middleware/        # HTTP middleware
│   ├── tracing/           # OpenTelemetry tracing
│   └── health/            # Health check endpoints
├── prometheus/            # Prometheus configuration
├── grafana/               # Grafana dashboards and configuration
├── observability/         # Observability documentation
└── ...
```

## Observability Features

The project includes comprehensive observability features:

### Metrics

- Model performance (latency, time to first token)
- Token usage (input and output counts)
- Request rates and error rates
- Active request monitoring

### Logging

- Structured JSON logs with zerolog
- Log levels (debug, info, warn, error, fatal)
- Request logging middleware
- Error tracking

### Tracing

- Request flow tracing with OpenTelemetry
- Integration with Jaeger for visualization
- Span context propagation

For more information, see [Observability Documentation](./observability/README.md).

### Grafana Setup

To configure Grafana and create dashboards for monitoring your application:

1. **Configure Data Source**:
   - Go to Grafana at http://localhost:3001 (login with admin/admin)
   - Go to Configuration > Data Sources
   - Add Prometheus data source with URL `http://prometheus:9090` (not localhost)

2. **Create Dashboard**:
   - Add panels for request rates, token usage, model latency, etc.
   - Use queries like `sum(rate(genai_app_http_requests_total[5m])) by (endpoint)`

For detailed step-by-step Grafana setup instructions, see [Grafana Setup Guide](./observability/GRAFANA_SETUP.md).

## Customization

You can customize the application by:
1. Changing the model in `backend.env` to use a different LLM
2. Modifying the frontend components for a different UI experience
3. Extending the backend API with additional functionality
4. Customizing the Grafana dashboards for different metrics

## Testing

The project includes integration tests using Testcontainers:

```bash
cd tests
go test -v
```

## Troubleshooting

- **Model not loading**: Ensure you've pulled the model with `docker model pull`
- **Connection errors**: Verify Docker network settings and that Model Runner is running
- **Streaming issues**: Check CORS settings in the backend code
- **Metrics not showing**: Verify that Prometheus can reach the backend metrics endpoint
- **Grafana connection issues**: Make sure Grafana data source URL is `http://prometheus:9090` (not localhost)

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.


## Key Metrics


There are several key metrics that are particularly important to monitor for a Prometheus setup with your Llama 3.2 application:

Memory Profile - This panel shows memory usage (768 MiB, 512 MiB, 256 MiB lines). Memory usage is critical because it affects system stability and performance. The graph shows your p8s process resident memory and virtual memory, which helps you identify potential memory leaks or excessive resource usage.
Scrape Duration - This shows how long Prometheus takes to collect metrics from your application (currently showing values between 5-20ms). Longer scrape durations might indicate performance issues with your metrics collection or high load on your services.
Head Chunks - The spiking line (around 500 units) represents how Prometheus is storing data chunks in memory. An increasing trend here indicates growing data storage requirements.
Query Durations - This multi-line graph shows how long different types of queries take to execute. This is important because slow queries can affect both Grafana dashboard performance and any alerting you might set up.
Reload Count - The increasing graph line shows successful configuration reloads, which is important for tracking configuration changes and potential issues.

For your Llama 3.2 application specifically, I'd recommend also creating panels for:

Total request count and rate
Response time statistics (p50, p90, p99 latencies)
Token usage (both input and output tokens)
Error rates

These metrics would give you a comprehensive view of your application's performance, resource usage, and user experience.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
