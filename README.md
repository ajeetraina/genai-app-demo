# GenAI Application Demo

A modern chat application demonstrating integration of frontend technologies with local Large Language Models (LLMs) and Neo4j for Retrieval-Augmented Generation (RAG).

## Overview

This project is a full-stack GenAI chat application that showcases how to build a Generative AI interface with a React frontend and Go backend, connected to Llama 3.2 running on Ollama, with Neo4j providing knowledge graph capabilities for RAG.

## Architecture

The application consists of four main components:

1. **Frontend**: React TypeScript application providing a responsive chat interface
2. **Backend**: Go server that handles API requests and connects to the LLM
3. **Model Runner**: Ollama service running the Llama 3.2 (1B parameter) model
4. **Knowledge Graph**: Neo4j database for storing and retrieving contextual information

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │ >>> │   Backend   │ >>> │    Ollama   │
│  (React/TS) │     │    (Go)     │     │  (Llama 3.2)│
└─────────────┘     └─────────────┘     └─────────────┘
      :3000              :8080              :11434
                           ▲
                           │
                           ▼
                     ┌─────────────┐
                     │    Neo4j    │
                     │(Knowledge DB)│
                     └─────────────┘
                          :7687
```

## Features

- Real-time chat interface with message history
- Streaming AI responses (tokens appear as they're generated)
- Dockerized deployment for easy setup
- Local LLM integration (no cloud API dependencies)
- Retrieval-Augmented Generation (RAG) with Neo4j knowledge graph
- Document ingestion API to populate the knowledge base
- Cross-origin resource sharing (CORS) enabled
- Comprehensive integration tests using Testcontainers

## Prerequisites

- Docker and Docker Compose
- Git
- Go 1.19 or higher

```
go get github.com/google/uuid
go get github.com/neo4j/neo4j-go-driver/v5/neo4j
go mod tidy
```

## Quick Start

1. Clone this repository:
   ```bash
   git clone https://github.com/ajeetraina/genai-app-demo.git
   cd genai-app-demo
   ```

2. Start the application using Docker Compose:
   ```bash
   docker compose up -d --build
   ```

3. Access the frontend at [http://localhost:3000](http://localhost:3000)

## Development Setup

### Frontend

The frontend is a React TypeScript application using Vite:

```bash
cd frontend
npm install
npm run dev
```

### Backend

The Go backend can be run directly:

```bash
go mod download
go run main.go
```

Make sure to set the environment variables in `backend.env` or provide them directly.

## Neo4j RAG Integration

This branch adds Retrieval-Augmented Generation (RAG) capabilities using Neo4j as a knowledge graph database.

### How It Works

1. **Knowledge Ingestion**: Documents are added to the knowledge base via the `/documents` API endpoint
2. **Storage & Indexing**: Content is stored in Neo4j graph database with embedding vectors for semantic search
3. **Contextual Retrieval**: When a user asks a question, relevant documents are retrieved from Neo4j
4. **Enhanced Prompting**: The retrieved context is added to the LLM prompt
5. **Informed Response**: The LLM responds with information grounded in the retrieved documents

### Using the RAG System

#### Adding Documents to the Knowledge Base

```bash
curl -X POST http://localhost:8080/documents \
  -H "Content-Type: application/json" \
  -d '{
    "title": "About Artificial Intelligence",
    "content": "Artificial Intelligence (AI) is the simulation of human intelligence processes by machines, especially computer systems.",
    "url": "https://example.com/ai"
  }'
```

#### Configuring RAG

The RAG system can be configured through environment variables in `backend.env`:

- `NEO4J_URI`: Connection URI for Neo4j (default: `neo4j://neo4j:7687`)
- `NEO4J_USERNAME`: Neo4j username (default: `neo4j`)
- `NEO4J_PASSWORD`: Neo4j password (default: `password`)
- `RAG_ENABLED`: Enable/disable RAG functionality (default: `true`)
- `RAG_CONTEXT_LIMIT`: Maximum number of documents to retrieve (default: `5`)

## Testing

The application includes comprehensive integration tests using Testcontainers in Go.

### Running Tests

```bash
# Run all tests
cd tests
go test -v ./integration

# Run specific test categories
go test -v ./integration -run TestGenAIAppIntegration    # API tests
go test -v ./integration -run TestFrontendIntegration    # UI tests
go test -v ./integration -run TestNeo4jRagIntegration    # RAG tests
go test -v ./integration -run TestGenAIQuality           # Quality tests
go test -v ./integration -run TestGenAIPerformance       # Performance tests

# Run tests in short mode (faster)
go test -v ./integration -short

# Run tests with Docker Compose instead of Testcontainers
export USE_DOCKER_COMPOSE=true
go test -v ./integration -run TestWithDockerCompose
```

Alternatively, you can use the provided Makefile:

```bash
# Run all tests
make -C tests test

# Run specific test categories
make -C tests test-api
make -C tests test-frontend
make -C tests test-rag          # New target for RAG tests
make -C tests test-quality
make -C tests test-performance

# Clean up test resources
make -C tests clean
```

## Configuration

The backend connects to the LLM service and Neo4j using environment variables defined in `backend.env`:

- `BASE_URL`: URL for the model runner
- `MODEL`: Model identifier to use
- `API_KEY`: API key for authentication (defaults to "ollama")
- `NEO4J_URI`: Connection URI for Neo4j database
- `NEO4J_USERNAME`: Neo4j username
- `NEO4J_PASSWORD`: Neo4j password
- `RAG_ENABLED`: Enable/disable RAG functionality
- `RAG_CONTEXT_LIMIT`: Maximum context items to include

## Deployment

The application is configured for easy deployment using Docker Compose. See the `compose.yaml` and `ollama-ci.yaml` files for details.

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
