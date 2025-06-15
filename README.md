# A GenAI Chatbot Demo with Docker Model Runner and Observability Metrics

<img width="679" alt="image" src="https://github.com/user-attachments/assets/9b3931c2-aab3-421e-a3ca-990117ee545b" />


A modern, full-stack chat application demonstrating how to integrate React frontend with a Go backend and run local Large Language Models (LLMs) using Docker's Model Runner.
This repo also integrates the GenAI app with the Observability stack that includes Prometheus, Grafana and Jaeger.

## Overview

This project showcases a complete Generative AI interface that includes:
- React/TypeScript frontend with a responsive chat UI
- Go backend server for API handling
- Integration with Docker's Model Runner to run Llama 3.2 locally
- Comprehensive observability with metrics, logging, and tracing
- **NEW: llama.cpp metrics integration directly in the UI**

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
- 🚀 Advanced llama.cpp performance metrics

<img width="1126" alt="image" src="https://github.com/user-attachments/assets/bccb9f93-1f6e-4397-a3ce-8a15370490d9" />


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

- Docker Desktop 4.41.0 or later
- Docker Compose 2.35 or later
- Git
- Go 1.19 or higher (for local development)
- Node.js and npm (for frontend development)

Before starting, pull the required model:

```bash
docker model pull ai/llama3.2:1B-Q8_0
```

## Quick Start

1. Clone this repository:
   ```bash
   git clone https://github.com/ajeetraina/genai-model-runner-metrics.git
   cd genai-model-runner-metrics
   ```

2. Start the application using Docker Compose:
   ```bash
   docker compose up -d --build
   ```

3. Access the frontend at [http://localhost:3000](http://localhost:3000)

4. Access observability dashboards:
   - Grafana: [http://localhost:3001](http://localhost:3001) (admin/admin)
  
Ensure that you provide `http://prometheus:9090` instead of `localhost:9090` to see the metrics on the Grafana dashboard.

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

## llama.cpp Metrics Features

The application includes detailed llama.cpp metrics displayed directly in the UI:

- **Tokens per Second**: Real-time generation speed
- **Context Window Size**: Maximum tokens the model can process
- **Prompt Evaluation Time**: Time spent processing the input prompt
- **Memory per Token**: Memory usage efficiency
- **Thread Utilization**: Number of threads used for inference
- **Batch Size**: Inference batch size

These metrics help in understanding the performance characteristics of llama.cpp models and can be used to optimize configurations.

## Observability Features

The project includes comprehensive observability features:

### Metrics

- Model performance (latency, time to first token)
- Token usage (input and output counts)
- Request rates and error rates
- Active request monitoring
- llama.cpp specific performance metrics

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

## llama.cpp Metrics Integration

The application has been enhanced with specific metrics for llama.cpp models:

1. **Backend Integration**: The Go backend collects and exposes llama.cpp-specific metrics:
   - Context window size tracking
   - Memory per token measurement
   - Token generation speed calculations
   - Thread utilization monitoring
   - Prompt evaluation timing
   - Batch size tracking

2. **Frontend Dashboard**: A dedicated metrics panel in the UI shows:
   - Real-time token generation speed
   - Memory efficiency
   - Thread utilization with recommendations
   - Context window size visualization
   - Expandable detailed metrics view
   - Integration with model info panel

3. **Prometheus Integration**: All llama.cpp metrics are exposed to Prometheus for long-term storage and analysis:
   - Custom histograms for timing metrics
   - Gauges for resource utilization
   - Counters for token throughput

## Customization

You can customize the application by:
1. Changing the model in `backend.env` to use a different LLM
2. Modifying the frontend components for a different UI experience
3. Extending the backend API with additional functionality
4. Customizing the Grafana dashboards for different metrics
5. Adjusting llama.cpp parameters for performance optimization

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
- **llama.cpp metrics missing**: Confirm that your model is indeed a llama.cpp model

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
