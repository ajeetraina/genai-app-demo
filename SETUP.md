# RAG Implementation Setup Guide

This document provides step-by-step instructions for setting up the RAG-enhanced chatbot.

## Prerequisites

- Docker and Docker Compose
- Docker Model Runner capability

## API Compatibility Notes

The original backend is designed to work with the OpenAI API format, but Docker Model Runner has a slightly different API structure:

- OpenAI API uses: `/v1/chat/completions`
- Docker Model Runner uses: `/v1/completions` 

We've added an `ENDPOINT_TYPE=completions` environment variable to help the backend adapt to this difference.

## Setup Steps

1. **Pull the llama3.2 model**

   First, ensure you have the model downloaded:

   ```bash
   docker model pull ai/llama3.2:1B-Q8_0
   ```

2. **Run the model separately**

   Start the model using Docker's Model Runner:

   ```bash
   docker model run ai/llama3.2:1B-Q8_0 --port 12434 --server
   ```

   This exposes the model on port 12434. Keep this terminal window open.

3. **Check the API endpoints**

   To verify the model is running and understand its API structure, run:

   ```bash
   curl http://localhost:12434/v1/health
   curl http://localhost:12434/v1/
   ```

   The first command should return a health status, and the second will list available endpoints.

4. **Start the RAG application**

   In a separate terminal, start the RAG application using:

   ```bash
   docker compose -f docker-compose.rag.yml up -d --build
   ```

5. **Access the application**

   Once all containers are running, access the application at:
   
   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Grafana: [http://localhost:3001](http://localhost:3001) (admin/admin)

## Troubleshooting

### Common Issues

- **404 Errors**: If you see 404 errors, it usually means the API endpoint structure doesn't match:
   ```
   # Try these commands to test the API directly:
   curl http://localhost:12434/v1/completions -X POST -H "Content-Type: application/json" -d '{"prompt": "Hello", "max_tokens": 50}'
   curl http://localhost:12434/v1/chat/completions -X POST -H "Content-Type: application/json" -d '{"messages": [{"role": "user", "content": "Hello"}], "max_tokens": 50}'
   ```

- **Network connectivity**: For Linux users, ensure `host.docker.internal` resolves correctly with the `extra_hosts` setting.

- **Docker Model Runner API differences**: If problems persist, the model may expose a different API than expected. Check Docker's documentation for the specific model you're using.

### Checking Status

- **Model status**: Verify the model is running with `docker model ls --running`
- **Container status**: Check all services with `docker compose -f docker-compose.rag.yml ps`
- **Service logs**: View detailed logs with `docker compose -f docker-compose.rag.yml logs backend`

## Architecture

The application follows this architecture:

```
Frontend (React) ? Backend (Go) ? Docker Model Runner (llama3.2)
                       ?
                       |
                    ChromaDB
                 (Vector Database)
```

- The frontend provides document upload and chat UI
- The backend processes documents and handles RAG logic
- ChromaDB stores document embeddings
- Docker Model Runner provides LLM capabilities

## Using the Application

1. Click "Upload Documents" on the chat interface
2. Drag and drop PDF or TXT files
3. Ask questions about the document content
4. Toggle RAG mode on/off to compare responses
