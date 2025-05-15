# RAG Implementation Setup Guide

This document provides step-by-step instructions for setting up the RAG-enhanced chatbot.

## Prerequisites

- Docker and Docker Compose
- Docker model pull permissions for llama3.2 model

## Setup Steps

1. **Pull the llama3.2 model**

   First, ensure you have the model downloaded:

   ```bash
   docker model pull ai/llama3.2:1B-Q8_0
   ```

2. **Start all services including model-runner**

   Start the application with one command:

   ```bash
   docker compose -f docker-compose.rag.yml up -d --build
   ```

3. **Run the model separately**

   After the containers are up, you need to start the model separately because the model-runner container doesn't execute the model by default:

   ```bash
   # First, find the container ID
   docker ps | grep model-runner

   # Then exec into the container and run the model
   docker exec -it CONTAINER_ID /bin/bash

   # Once inside the container, run:
   model run --server --port 12434
   ```

   Leave this terminal open to keep the model running.

4. **Access the application**

   Once all containers are running and the model is active, access the application at:
   
   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Grafana: [http://localhost:3001](http://localhost:3001) (admin/admin)
   - Jaeger: [http://localhost:16686](http://localhost:16686)

## Troubleshooting

- **Model runner errors**: If you have issues starting the model inside the container, you can try running it on your host system:
  ```bash
  docker model run ai/llama3.2:1B-Q8_0 --port 12434 --server
  ```
  Then update `BASE_URL` in docker-compose.rag.yml to: `http://host.docker.internal:12434/engines/llama.cpp/v1/`

- **Backend connectivity issues**: Check logs with `docker compose -f docker-compose.rag.yml logs backend`

- **Vector database errors**: Verify ChromaDB is running with `docker compose -f docker-compose.rag.yml logs vectordb`

## Architecture

The application follows this architecture:

```
Frontend (React) ? Backend (Go) ? Model Runner (llama3.2)
                       ?
                       |
                    ChromaDB
                 (Vector Database)
```

- The frontend provides document upload and chat UI
- The backend processes documents and handles RAG logic
- ChromaDB stores document embeddings
- Model Runner provides LLM capabilities

## Using the Application

1. Click "Upload Documents" on the chat interface
2. Drag and drop PDF or TXT files
3. Ask questions about the document content
4. Toggle RAG mode on/off to compare responses
