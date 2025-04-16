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
  
Ensure that you provide `http://prometheus:9091` instead of `localhost:9091` to seee the metrics on the Grafana dashboard.

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

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request



# GPU Metrics for Docker Model Runner Chat Interface

This feature branch adds real-time GPU metrics monitoring to the chatbot interface when using Docker Model Runner. It provides visual feedback on GPU utilization, memory usage, token generation speed, and other relevant metrics while interacting with AI models.

## Overview

The GPU metrics panel displays:
- GPU utilization percentage
- GPU memory usage
- Tokens per second processing speed
- Inference latency
- Active/idle status indicator

## Implementation Details

### Components

1. **Frontend**
   - `GPUMetricsPanel.jsx`: React component for displaying metrics
   - `GPUMetricsPanel.css`: Styling for the metrics panel
   - Integration with existing chat interface

2. **Backend**
   - `gpuMetricsService.js`: Service for gathering metrics from the system
   - `routes/gpuMetrics.js`: Express API endpoint for metrics retrieval
   - Platform-specific implementations for Apple Silicon and NVIDIA GPUs

## Setup Instructions

1. **Create a new branch**:
   ```bash
   git checkout -b feature/gpu-metrics
   ```

2. **Install required dependencies**:
   ```bash
   npm install express child_process
   ```

3. **Add the new files to your project structure**:
   - Frontend:
     - Copy `GPUMetricsPanel.jsx` to your components directory
     - Copy `GPUMetricsPanel.css` to your styles directory
   - Backend:
     - Copy `gpuMetricsService.js` to your API service directory
     - Copy `routes/gpuMetrics.js` to your routes directory

4. **Integrate with your existing application**:
   - Import and use the `GPUMetricsPanel` component in your chat interface
   - Register the `/api/gpu-metrics` endpoint in your Express app
   - Add the toggle button to show/hide the metrics panel

## Platform Support

- **macOS (Apple Silicon)**: Uses `powermetrics` to retrieve GPU information
- **Windows (NVIDIA)**: Uses `nvidia-smi` for GPU metrics (available when Docker Desktop adds Windows support)
- **Linux**: Uses `nvidia-smi` if available

## Permission Requirements

- On macOS, the `powermetrics` command requires admin privileges
- You may need to run the server with `sudo` or implement a privileged helper service

## Limitations

- GPU metrics are approximate and may vary based on system load
- Token speed calculations are estimates based on model performance
- Some metrics might not be available on all platforms

## Notes for Reviewers

This feature is designed as an optional enhancement for developer use and debugging. It can be disabled by default in production environments.

## Future Improvements

- Add support for AMD GPUs
- Implement more accurate token speed calculations
- Add historical metrics graphing
- Add configurable refresh rates
- Add performance optimization recommendations based on metrics
