package rag

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"strings"
)

// RagService handles the integration between document retrieval and the LLM
type RagService struct {
	processor *DocumentProcessor
	llmClient LLMClient
}

// LLMClient defines the interface for interacting with the language model
type LLMClient interface {
	GenerateCompletion(ctx context.Context, prompt string) (string, error)
	GenerateStream(ctx context.Context, prompt string, callback func(text string, done bool) error) error
}

// NewRagService creates a new RAG service instance
func NewRagService(processor *DocumentProcessor, llmClient LLMClient) *RagService {
	return &RagService{
		processor: processor,
		llmClient: llmClient,
	}
}

// QueryWithRAG performs a RAG-enhanced query to the LLM
func (s *RagService) QueryWithRAG(ctx context.Context, query string) (string, error) {
	// Retrieve relevant document chunks
	chunks, err := s.processor.QueryVectorDB(ctx, query, 3) // Get top 3 relevant chunks
	if err != nil {
		return "", fmt.Errorf("failed to query vector database: %w", err)
	}

	// Format context from retrieved chunks
	context := s.formatContext(chunks)

	// Create the augmented prompt
	ragPrompt := s.createRagPrompt(query, context)

	// Generate completion from LLM
	response, err := s.llmClient.GenerateCompletion(ctx, ragPrompt)
	if err != nil {
		return "", fmt.Errorf("failed to generate completion: %w", err)
	}

	return response, nil
}

// QueryWithRAGStream performs a streaming RAG-enhanced query to the LLM
func (s *RagService) QueryWithRAGStream(ctx context.Context, query string, callback func(text string, done bool) error) error {
	// Retrieve relevant document chunks
	chunks, err := s.processor.QueryVectorDB(ctx, query, 3) // Get top 3 relevant chunks
	if err != nil {
		return fmt.Errorf("failed to query vector database: %w", err)
	}

	// Format context from retrieved chunks
	context := s.formatContext(chunks)

	// Create the augmented prompt
	ragPrompt := s.createRagPrompt(query, context)

	// Stream completion from LLM
	return s.llmClient.GenerateStream(ctx, ragPrompt, callback)
}

// formatContext creates a formatted string from retrieved chunks
func (s *RagService) formatContext(chunks []Chunk) string {
	if len(chunks) == 0 {
		return ""
	}

	var contextBuilder strings.Builder
	
	contextBuilder.WriteString("Relevant information from documents:\n\n")
	
	for i, chunk := range chunks {
		contextBuilder.WriteString(fmt.Sprintf("Document %d: %s\n", i+1, chunk.Metadata.Source))
		contextBuilder.WriteString("---\n")
		contextBuilder.WriteString(chunk.Content)
		contextBuilder.WriteString("\n---\n\n")
	}
	
	return contextBuilder.String()
}

// createRagPrompt formats the final prompt with context for the LLM
func (s *RagService) createRagPrompt(query string, context string) string {
	if context == "" {
		// If no context, just use the regular prompt
		return fmt.Sprintf(`You are a helpful AI assistant. Please answer the following question:

Question: %s

Answer:`, query)
	}

	// Create a RAG-enhanced prompt
	return fmt.Sprintf(`You are a helpful AI assistant. Please answer the following question based only on the provided context information. If the context doesn't contain the answer, say that you don't have enough information to answer and avoid making up a response.

Context Information:
%s

Question: %s

Answer based on the context:`, context, query)
}

// GetSourcesForResponse extracts and returns the document sources used in a response
func (s *RagService) GetSourcesForResponse(chunks []Chunk) []string {
	if len(chunks) == 0 {
		return nil
	}
	
	sourceMap := make(map[string]struct{})
	var sources []string
	
	for _, chunk := range chunks {
		source := chunk.Metadata.Source
		if _, exists := sourceMap[source]; !exists {
			sourceMap[source] = struct{}{}
			sources = append(sources, source)
		}
	}
	
	return sources
}

// MockEmbeddings generates mock embedding vectors for testing
// In a real implementation, this would be replaced with an actual embedding model
func MockEmbeddings(text string) []float32 {
	// This is a simplified mock that just returns random values
	// In a real implementation, you would use a proper embedding model
	result := make([]float32, 384) // Typical embedding size
	for i := range result {
		result[i] = float32(len(text) % 100) / 100.0 // Generate deterministic but "random" values
	}
	return result
}

// LogDebug logs RAG debug information
func (s *RagService) LogDebug(query string, chunks []Chunk) {
	type logData struct {
		Query   string   `json:"query"`
		ChunkIDs []string `json:"chunk_ids"`
		Sources  []string `json:"sources"`
	}
	
	var chunkIDs []string
	var sources []string
	sourceMap := make(map[string]struct{})
	
	for _, chunk := range chunks {
		chunkIDs = append(chunkIDs, chunk.ID)
		
		source := chunk.Metadata.Source
		if _, exists := sourceMap[source]; !exists {
			sourceMap[source] = struct{}{}
			sources = append(sources, source)
		}
	}
	
	data := logData{
		Query:   query,
		ChunkIDs: chunkIDs,
		Sources:  sources,
	}
	
	jsonData, err := json.MarshalIndent(data, "", "  ")
	if err != nil {
		log.Printf("Error marshaling RAG debug data: %v", err)
		return
	}
	
	log.Printf("RAG Debug:\n%s", string(jsonData))
}
