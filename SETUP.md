# RAG Implementation Setup Guide

This document provides step-by-step instructions for setting up the RAG-enhanced chatbot.

## Prerequisites

- Docker and Docker Compose
- Access to the llama3.2 model

## Setup Steps

1. **Run the Model Runner separately**

   First, start the Model Runner container separately:

   ```bash
   docker run -p 12434:12434 ai/llama3.2:1B-Q8_0
   ```

   This exposes the model on port 12434.

2. **Start the RAG application**

   In a separate terminal, start the RAG application using:

   ```bash
   docker compose -f docker-compose.rag.yml up -d --build
   ```

3. **Access the application**

   Once all containers are running, access the application at:
   
   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Grafana: [http://localhost:3001](http://localhost:3001) (admin/admin)
   - Jaeger: [http://localhost:16686](http://localhost:16686)

## Troubleshooting

- **Connection issues to Model Runner**: Make sure the Model Runner container is running and accessible on port 12434
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
