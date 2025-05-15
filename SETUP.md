# RAG Implementation Setup Guide

This document provides step-by-step instructions for setting up the RAG-enhanced chatbot.

## Prerequisites

- Docker and Docker Compose
- Docker Model Runner capability

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

   Important: Docker Model Runner provides a different API structure than the original API. This has been accounted for in the configuration.

3. **Start the RAG application**

   In a separate terminal, start the RAG application using:

   ```bash
   docker compose -f docker-compose.rag.yml up -d --build
   ```

4. **Access the application**

   Once all containers are running, access the application at:
   
   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Grafana: [http://localhost:3001](http://localhost:3001) (admin/admin)

## Troubleshooting

### Common Issues

- **Backend can't connect to model**: Make sure you've run the model separately with `docker model run` and it's accessible on port 12434. Try visiting http://localhost:12434/v1/health in your browser to check if the model is available.

- **404 Not Found errors**: If you're seeing 404 errors in the backend logs, the endpoint path might not match what the model provides. You can check the available endpoints with:
  ```bash
  curl http://localhost:12434/v1/
  ```

- **Network connectivity**: For Linux users, ensure `host.docker.internal` resolves correctly with the `extra_hosts` setting.

### Checking Status

- **Model status**: Verify the model is running with `docker model ls --running`
- **Container status**: Check all services with `docker compose -f docker-compose.rag.yml ps`
- **Service logs**: View logs with `docker compose -f docker-compose.rag.yml logs backend`

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
