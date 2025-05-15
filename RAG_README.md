# RAG Enhancement for GenAI Chatbot

This branch adds Retrieval Augmented Generation (RAG) capabilities to the existing GenAI chatbot. This enhancement allows the chatbot to access and utilize information from documents that weren't part of the model's training data.

## Overview

RAG combines the power of retrieval systems with generative AI models:

1. **Document Processing**: Extract content from documents like PDFs
2. **Embedding Creation**: Convert document chunks into vector embeddings
3. **Vector Storage**: Store embeddings in a vector database for efficient retrieval
4. **Semantic Search**: Find relevant document sections based on user queries
5. **Context Augmentation**: Include retrieved content in the prompt to the LLM
6. **Enhanced Response**: Generate responses with knowledge from the documents

## Implementation Components

This implementation adds:

- **Document Processing Pipeline**: Upload, parse, and chunk documents
- **Vector Database Integration**: Store and query document embeddings
- **RAG API Endpoints**: Backend services for document management and retrieval
- **UI Components**: Document upload, source visibility, and RAG status indicators

## Getting Started

1. Build and run the RAG-enabled application:
   ```bash
   docker compose -f docker-compose.rag.yml up -d --build
   ```

2. Access the frontend at [http://localhost:3000](http://localhost:3000)

3. Upload documents through the interface and ask questions about their contents

## Architecture

The RAG implementation extends the existing architecture:

```
????????????????     ????????????????     ????????????????
?   Frontend   ? >>> ?    Backend   ? >>> ? Model Runner ?
?  (React/TS)  ?     ?     (Go)     ?     ? (Llama 3.2)  ?
????????????????     ????????????????     ????????????????
                            ?
                            ?
                     ????????????????
                     ? RAG Pipeline ?
                     ????????????????
                            ?
                            ?
                     ????????????????
                     ?    Vector    ?
                     ?   Database   ?
                     ????????????????
```

## Example Use Cases

- **Document Q&A**: "What does the quarterly report say about revenue growth?"
- **Technical Support**: "How do I configure the API according to the documentation?"
- **Research Analysis**: "Summarize the key findings from these research papers."

## Development Roadmap

- [x] Basic PDF processing
- [x] Vector database integration
- [x] RAG query pipeline
- [ ] Multi-document support
- [ ] Document metadata indexing
- [ ] Custom retriever strategies
- [ ] Citation and source tracking

## Contributing

Contributions to improve the RAG implementation are welcome! See the main repository README for contribution guidelines.
