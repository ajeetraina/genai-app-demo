# RAG Implementation for GenAI Chatbot

This branch extends the basic GenAI chatbot with Retrieval Augmented Generation (RAG) capabilities.

## Features

- ? Document upload and processing
- ? Vector database integration with ChromaDB
- ? Semantic search for relevant content
- ? Enhanced responses using retrieved context
- ? Source citations for transparency
- ? Togglable RAG mode

## How It Works

1. **Document Processing**: PDFs and text files are uploaded, parsed, and chunked
2. **Vector Embedding**: Document chunks are converted to vector embeddings
3. **Storage**: Embeddings are stored in a ChromaDB vector database
4. **Retrieval**: When a query is received, relevant chunks are retrieved
5. **Augmentation**: Retrieved content is included in the prompt to the LLM
6. **Response Generation**: The LLM generates a response based on the context

## Architecture

```
User ? Frontend ? Backend ? LLM
             ?      ? ?
             |    Vector DB
             +------+
```

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/ajeetraina/genai-app-demo.git
   cd genai-app-demo
   git checkout rag-feature
   ```

2. Start the application with RAG support:
   ```bash
   docker compose -f docker-compose.rag.yml up -d --build
   ```

3. Access the application at [http://localhost:3000](http://localhost:3000)

4. Click "Upload Documents" to add PDFs or text files

5. Ask questions about your documents

## Implementation Details

### Backend

The RAG implementation adds several new components to the backend:

- **Document Processor**: Handles file uploads, text extraction, and chunking
- **Vector Storage**: Manages interactions with the ChromaDB vector database
- **RAG Service**: Orchestrates the retrieval and LLM integration
- **API Endpoints**: New endpoints for document upload and RAG-enhanced chat

### Frontend

New React components have been added to support RAG features:

- **DocumentUploader**: Drag-and-drop file upload with progress indicators
- **SourceCitations**: Displays document sources for retrieved information
- **RagChat**: Enhanced chat interface with RAG toggle and document integration

## Configuration

Configuration options are set in `docker-compose.rag.yml`:

- **Vector Database**: ChromaDB is used for efficient similarity search
- **File Storage**: Uploaded documents are stored in a volume
- **Embedding Model**: Uses a lightweight sentence transformer model
- **Chunking Parameters**: Configurable chunk size and overlap

## Example Use Cases

- **Document Q&A**: "What are the key features mentioned in the documentation?"
- **PDF Analysis**: "Summarize the financial results from the annual report."
- **Knowledge Base**: "How do I implement the API based on the specs?"

## Future Improvements

- Multi-modal support (images, audio)
- More sophisticated chunking strategies
- Hybrid search (keywords + semantic)
- User feedback for retrieval quality
- Support for more document formats

## Credits

This implementation uses:

- ChromaDB for vector storage
- Sentence transformers for embeddings
- React/TypeScript for the frontend
- Go for the backend API
- Docker for containerization

## License

MIT

## Contributing

Contributions to improve the RAG implementation are welcome!
