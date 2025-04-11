# Multi-Language GenAI Example with Model Runner

This directory contains a simplified example of how to integrate Model Runner with different programming languages (Go, Python, and Node.js) in a single Docker Compose setup.

## Project Structure

Each language implementation should follow a similar pattern:

```
├── go-genai/         # Go implementation
│   ├── Dockerfile    # Container definition for Go service
│   ├── main.go       # Main application code
│   └── ...
├── py-genai/         # Python implementation
│   ├── Dockerfile    # Container definition for Python service
│   ├── app.py        # Main application code 
│   └── ...
├── node-genai/       # Node.js implementation
│   ├── Dockerfile    # Container definition for Node.js service
│   ├── index.js      # Main application code
│   └── ...
├── compose.yaml      # Docker Compose configuration
└── .env              # Environment variables (copied from .env.example)
```

## Getting Started

1. Copy the `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Make sure you have pulled the desired model:
   ```bash
   docker model pull ai/gemma3:4B-F16
   ```

3. Start the services:
   ```bash
   docker compose up -d
   ```

4. Access the different services:
   - Go service: http://localhost:8080
   - Python service: http://localhost:8081
   - Node.js service: http://localhost:8082

## Configuration

The `.env` file contains settings for the Model Runner:

- `LLM_MODEL_NAME`: The model to use (default: `ai/gemma3:4B-F16`)
- `LLM_ENDPOINT`: The endpoint for the model runner service

## Example Service Implementation

Each service should include:

1. **Simple UI or API endpoint** for sending prompts
2. **Integration code** for connecting to Model Runner
3. **Response handling** for the LLM output

## Switching Models

To use a different model, simply update the `LLM_MODEL_NAME` in your `.env` file or override it when starting:

```bash
LLM_MODEL_NAME=ai/llama3.2:1B-Q8_0 docker compose up -d
```

Available models depend on what you have pulled. Check with:

```bash
docker model ls
```
