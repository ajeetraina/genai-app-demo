# RAG Implementation Setup Guide

This document provides step-by-step instructions for setting up the RAG-enhanced chatbot.

## Prerequisites

- Docker and Docker Compose version that supports model provider (requires Docker Desktop 4.27+ / Docker Engine 25.0+)

## Setup Steps

1. **Start the application**

   Simply run the following command:

   ```bash
   docker compose -f docker-compose.rag.yml up -d --build
   ```

   This will automatically:
   - Pull the llama3.2 model if not already present
   - Start the model using Docker Compose's model provider
   - Launch the backend, frontend, and vector database
   - Set up observability services (Prometheus, Grafana, Jaeger)

2. **Access the application**

   Once all containers are running, access the application at:
   
   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Grafana: [http://localhost:3001](http://localhost:3001) (admin/admin)
   - Jaeger: [http://localhost:16686](http://localhost:16686)

## Using the Application

1. Click "Upload Documents" on the chat interface
2. Drag and drop PDF or TXT files
3. Ask questions about the document content
4. Toggle RAG mode on/off to compare responses

## Architecture

The application follows this architecture:

```
Frontend (React) ? Backend (Go) ? Docker Model Provider (llama3.2)
                       ?
                       |
                    ChromaDB
                 (Vector Database)
```

- The frontend provides document upload and chat UI
- The backend processes documents and handles RAG logic
- ChromaDB stores document embeddings
- Docker Model Provider automatically manages the LLM

## Troubleshooting

- **Docker version issues**: If you encounter errors about the model provider, ensure you're using Docker Desktop 4.27+ or Docker Engine 25.0+
- **Backend connectivity issues**: Check logs with `docker compose -f docker-compose.rag.yml logs backend`
- **Vector database errors**: Verify ChromaDB is running with `docker compose -f docker-compose.rag.yml logs vectordb`
- **Model errors**: Check logs with `docker compose -f docker-compose.rag.yml logs llm`

## Environment Variables

You can customize the model used by setting the LLM_MODEL_NAME environment variable:

```bash
LLM_MODEL_NAME=ai/meta-llama/llama-2-7b-chat docker compose -f docker-compose.rag.yml up -d
```

If no model is specified, the system defaults to using llama3.2:1B-Q8_0.
