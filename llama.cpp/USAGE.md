# Using llama.cpp with GenAI App Demo

This guide explains how to run the GenAI App Demo with the llama.cpp integration instead of Docker Model Runner.

## Prerequisites

- Docker and Docker Compose
- Git
- At least 4GB of available RAM (varies by model size)

## Quick Start

1. Clone the repository and navigate to the project directory:
   ```bash
   git clone https://github.com/ajeetraina/genai-app-demo.git
   cd genai-app-demo
   ```

2. Start the application using the llama-compose.yaml file:
   ```bash
   docker compose -f llama-compose.yaml up -d --build
   ```

3. Access the frontend at [http://localhost:3000](http://localhost:3000)

4. Access observability dashboards:
   - Grafana: [http://localhost:3001](http://localhost:3001) (admin/admin)
   - Jaeger UI: [http://localhost:16686](http://localhost:16686)
   - Prometheus: [http://localhost:9091](http://localhost:9091)

## Configuration

You can customize the llama.cpp integration by setting the following environment variables:

### For the llama-cpp service:

- `MODEL_PATH`: Path to the model file inside the container (default: `/app/models/llama-model.gguf`)
- `MODEL_URL`: URL to download the model from (default: Llama-3.2-1B-Q8_0 from HuggingFace)
- `CONTEXT_SIZE`: Token context size (default: 4096)
- `THREADS`: Number of CPU threads to use (default: 4)
- `CHAT_TEMPLATE`: Chat template to use (default: llama-3.2)

### For the backend service:

By default, the backend uses the configuration in `llama.cpp/backend-llama.env`, which sets:
- `BASE_URL`: URL for the llama.cpp server API (default: `http://llama-cpp:8080/v1/`)
- `MODEL`: Model identifier to use (default: ai/llama3.2:1B-Q8_0)
- `API_KEY`: API key for authentication (default: "llamacpp")

## Using Different Models

To use a different model:

1. Set the `MODEL_URL` environment variable when starting the service:
   ```bash
   MODEL_URL="https://huggingface.co/path/to/model.gguf" docker compose -f llama-compose.yaml up -d --build
   ```

2. Or modify the `llama-compose.yaml` file to specify a different model URL.

Popular models include:
- Llama-3.2 (1B, 3B, 8B, 70B) - https://huggingface.co/meta-llama
- Mistral, Mixtral - https://huggingface.co/mistralai
- Various GGUF quantized models - https://huggingface.co/TheBloke

## Comparison with Docker Model Runner

### Advantages of llama.cpp:
- Lightweight, runs with minimal resources
- Direct integration without external dependencies
- More control over inference parameters
- Supports a wider range of models and formats

### Limitations:
- May have slightly lower performance than optimized Docker Model Runner
- Requires downloading the model separately

## Troubleshooting

- **Model not loading**: Check the `MODEL_URL` and ensure it points to a valid GGUF model file
- **Out of memory errors**: Try a smaller model or reduce the `CONTEXT_SIZE`
- **Poor performance**: Increase the `THREADS` parameter or try a smaller model
- **Connection issues**: Check that the llama-cpp service is healthy and accessible from the backend
