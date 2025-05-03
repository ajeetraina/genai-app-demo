# Changes for llama.cpp Integration

This document summarizes the changes made to integrate llama.cpp into the GenAI App Demo.

## Files Added

1. **llama.cpp/README.md**: Overview of the llama.cpp integration
2. **llama.cpp/Dockerfile**: Docker configuration for building and running llama.cpp
3. **llama.cpp/server.sh**: Script to run the llama.cpp server with configurable parameters
4. **llama-compose.yaml**: Docker Compose configuration file for running the stack with llama.cpp
5. **llama.cpp/backend-llama.env**: Environment configuration for the backend when using llama.cpp
6. **llama.cpp/USAGE.md**: Detailed usage guide for the llama.cpp integration
7. **README-llama.md**: Updated README with information about the llama.cpp integration
8. **llama.cpp/test.sh**: Testing script for the llama.cpp integration

## Implementation Details

### llama.cpp Setup

The llama.cpp integration is implemented as a separate container service that:

1. Builds llama.cpp from source with optimizations
2. Provides a server interface compatible with the OpenAI API format
3. Automatically downloads a small Llama 3.2 model for testing
4. Exposes the server on port 12434

### Environment Configuration

The backend environment has been updated to connect to the llama.cpp server instead of the Docker Model Runner:

```
BASE_URL=http://llama-cpp:8080/v1/
MODEL=ai/llama3.2:1B-Q8_0
API_KEY=${API_KEY:-llamacpp}
```

### Docker Compose

A new Docker Compose file (`llama-compose.yaml`) has been created to run the stack with llama.cpp:

```yaml
services:
  # Original services (frontend, backend, prometheus, grafana, jaeger)
  
  # New llama.cpp service 
  llama-cpp:
    build:
      context: ./llama.cpp
      dockerfile: Dockerfile
    environment:
      - MODEL_PATH=/app/models/llama-model.gguf
      - MODEL_URL=${LLAMA_MODEL_URL:-"..."}
      - CONTEXT_SIZE=4096
      - THREADS=4
    volumes:
      - llama-models:/app/models
    # Additional configuration
```

## How to Use

Users can start the application with llama.cpp by running:

```bash
docker compose -f llama-compose.yaml up -d --build
```

For more details, refer to the [llama.cpp/USAGE.md](llama.cpp/USAGE.md) file.

## Benefits

The llama.cpp integration provides:

1. Direct access to llama.cpp capabilities without external dependencies
2. Support for additional model formats and architectures
3. Fine-grained control over inference parameters
4. Reduced resource requirements

## Next Steps

Potential improvements for the llama.cpp integration:

1. Add GPU support configuration
2. Implement quantization options for models
3. Support for additional model architectures
4. Fine-tuning capabilities
5. Specific optimizations for different hardware (ARM, Intel, AMD)
