# RAG Implementation Setup Guide

This document provides step-by-step instructions for setting up the RAG-enhanced chatbot.

## Prerequisites

- Docker and Docker Compose
- Docker Model Runner with llama3.2 model

## Setup Steps

1. **Pull the llama3.2 model**

   First, ensure you have the model downloaded:

   ```bash
   docker model pull ai/llama3.2:1B-Q8_0
   ```

2. **Start the Model Runner**

   Run the model using Docker's Model Runner functionality:

   ```bash
   docker model run ai/llama3.2:1B-Q8_0 --port 12434 --server
   ```

   This exposes the model on port 12434. Keep this terminal window open.

3. **Start the RAG application**

   In a separate terminal, start the RAG application using:

   ```bash
   docker compose -f docker-compose.rag.yml up -d --build
   ```

4. **Access the application**

   Once all containers are running, access the application at:
   
   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Grafana: [http://localhost:3001](http://localhost:3001) (admin/admin)
   - Jaeger: [http://localhost:16686](http://localhost:16686)

## Troubleshooting

- **Connection issues to Model Runner**: Verify the model is running with `docker model ls` and check for any errors in the terminal where you started the model
- **Backend connectivity issues**: Check logs with `docker compose -f docker-compose.rag.yml logs backend`
- **Vector database errors**: Verify ChromaDB is running with `docker compose -f docker-compose.rag.yml logs vectordb`
- **host.docker.internal not resolving**: For Linux users, make sure your Docker version supports the `host-gateway` feature. In older versions, you might need to use the host machine's IP instead.

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
