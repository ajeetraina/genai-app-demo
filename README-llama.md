# GenAI App Demo with llama.cpp

<img width="679" alt="image" src="https://github.com/user-attachments/assets/9b3931c2-aab3-421e-a3ca-990117ee545b" />

A modern, full-stack chat application demonstrating how to integrate React frontend with a Go backend and run local Large Language Models (LLMs) using llama.cpp.

## Overview

This project showcases a complete Generative AI interface that includes:
- React/TypeScript frontend with a responsive chat UI
- Go backend server for API handling
- Integration with llama.cpp for direct LLM inference
- Comprehensive observability with metrics, logging, and tracing

## New Feature: llama.cpp Integration

The project now includes a direct integration with llama.cpp, offering an alternative to Docker Model Runner. This gives you:

- Direct access to llama.cpp capabilities
- Support for a wide range of model formats and architectures
- Fine-grained control over inference parameters
- Lower resource requirements

## Getting Started with llama.cpp

1. Use the dedicated compose file for llama.cpp setup:
   ```bash
   docker compose -f llama-compose.yaml up -d --build
   ```

2. The setup will automatically download a small Llama 3.2 model (1B parameters) for you to test with.

3. For more details on configuration and usage, see [llama.cpp/USAGE.md](llama.cpp/USAGE.md).

## Why Use llama.cpp?

- **Efficiency**: Optimized for running on consumer hardware
- **Flexibility**: Run a wide variety of models in different formats
- **Customization**: Control inference parameters like context size and precision
- **Compatibility**: Maintains the same API format as OpenAI for easy integration

## Architecture with llama.cpp

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │ >>> │   Backend   │ >>> │  llama.cpp  │
│  (React/TS) │     │    (Go)     │     │   Server    │
└─────────────┘     └─────────────┘     └─────────────┘
      :3000              :8080               :12434
                          │  │
┌─────────────┐     ┌─────┘  └─────┐     ┌─────────────┐
│   Grafana   │ <<< │ Prometheus  │     │   Jaeger    │
│ Dashboards  │     │  Metrics    │     │   Tracing   │
└─────────────┘     └─────────────┘     └─────────────┘
      :3001              :9091              :16686
```

## Switching Between llama.cpp and Docker Model Runner

You can easily switch between using llama.cpp and Docker Model Runner:

- For llama.cpp: `docker compose -f llama-compose.yaml up -d --build`
- For Docker Model Runner: `docker compose up -d --build`

Both configurations maintain the same API format, making them interchangeable from the frontend's perspective.

## For More Information

For detailed information about the project features, requirements, and original setup, please refer to the [original README.md](README.md).

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
