# Using Docker Model Runner with genai-app-demo

This branch adds support for Docker Compose's built-in model runner functionality, introduced in Docker Compose v2.35.0.

## Prerequisites

- Docker Desktop with Compose v2.35.0 or later
- Docker Desktop extension for Model Runner installed

## How it Works

The updated `compose.yaml` file includes a new `llm` service that uses the model provider:

```yaml
llm:
  provider:
    type: model
    options:
      model: ${LLM_MODEL_NAME:-ai/llama3.2:1B-Q8_0}
```

This allows the backend service to connect to the LLM service using the hostname `llm` on port 11434.

## Configuration

You can configure the model to use by setting the `LLM_MODEL_NAME` environment variable in the `.env` file. 

Supported models are those available in your Docker Model Runner. You can check available models with:

```bash
docker model ls
```

Currently available models include:
- `ai/llama3.2:1B-Q8_0` (default)
- `ai/gemma3:4B-F16`
- `ai/mxbai-embed-large`

## Running the Application

```bash
# Start all services
docker compose up -d

# Check the logs
docker compose logs -f backend
```

## Accessing the Model Service Directly

The model service is accessible to containers at hostname `llm` on port 11434.

The API follows the Ollama API format, so you can make requests to:
- `http://llm:11434/api/generate` - For text generation
- `http://llm:11434/api/chat` - For chat completions
- `http://llm:11434/api/embeddings` - For generating embeddings
