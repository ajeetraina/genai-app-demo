package rag

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/google/uuid"
)

// Document represents a processed document with its metadata
type Document struct {
	ID       string   `json:"id"`
	Name     string   `json:"name"`
	Type     string   `json:"type"`
	Chunks   []Chunk  `json:"chunks"`
	Metadata Metadata `json:"metadata"`
}

// Chunk represents a segment of a document
type Chunk struct {
	ID        string   `json:"id"`
	Content   string   `json:"content"`
	Embedding []float32 `json:"embedding,omitempty"`
	Metadata  Metadata  `json:"metadata"`
}

// Metadata contains additional information about a document or chunk
type Metadata struct {
	Source      string `json:"source"`
	PageNumber  int    `json:"page_number,omitempty"`
	ChunkNumber int    `json:"chunk_number,omitempty"`
	TotalChunks int    `json:"total_chunks,omitempty"`
}

// DocumentProcessor handles the document processing pipeline
type DocumentProcessor struct {
	uploadDir    string
	vectorDBURL  string
	chunkSize    int
	chunkOverlap int
}

// NewDocumentProcessor creates a new document processor
func NewDocumentProcessor(uploadDir, vectorDBURL string) *DocumentProcessor {
	return &DocumentProcessor{
		uploadDir:    uploadDir,
		vectorDBURL:  vectorDBURL,
		chunkSize:    1000,
		chunkOverlap: 200,
	}
}

// ProcessFile handles the entire document processing pipeline
func (p *DocumentProcessor) ProcessFile(ctx context.Context, file multipart.File, header *multipart.FileHeader) (*Document, error) {
	// Create upload directory if it doesn't exist
	if err := os.MkdirAll(p.uploadDir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create upload directory: %w", err)
	}

	// Generate unique ID for the document
	docID := uuid.New().String()
	filePath := filepath.Join(p.uploadDir, docID+filepath.Ext(header.Filename))

	// Save the uploaded file
	dst, err := os.Create(filePath)
	if err != nil {
		return nil, fmt.Errorf("failed to create destination file: %w", err)
	}
	defer dst.Close()

	if _, err = io.Copy(dst, file); err != nil {
		return nil, fmt.Errorf("failed to copy file: %w", err)
	}

	// Create document object
	doc := &Document{
		ID:   docID,
		Name: header.Filename,
		Type: filepath.Ext(header.Filename)[1:], // Remove the dot
		Metadata: Metadata{
			Source: header.Filename,
		},
	}

	// Extract text based on file type
	switch strings.ToLower(doc.Type) {
	case "pdf":
		if err := p.extractTextFromPDF(ctx, filePath, doc); err != nil {
			return nil, err
		}
	case "txt":
		if err := p.extractTextFromTXT(ctx, filePath, doc); err != nil {
			return nil, err
		}
	default:
		return nil, fmt.Errorf("unsupported file type: %s", doc.Type)
	}

	// Create embeddings and store in vector DB
	if err := p.createEmbeddings(ctx, doc); err != nil {
		return nil, err
	}

	return doc, nil
}

// extractTextFromPDF extracts text from PDF files
func (p *DocumentProcessor) extractTextFromPDF(ctx context.Context, filePath string, doc *Document) error {
	// In a real implementation, you would use a PDF library like pdfcpu
	// For this demo, we'll simulate PDF processing with a placeholder
	
	log.Printf("Extracting text from PDF: %s", filePath)
	
	// Simulated PDF content for demo purposes
	content := fmt.Sprintf("This is simulated content from the PDF document %s. "+
		"In a real implementation, you would extract the actual text content from the PDF pages. "+
		"This would be done using a PDF processing library that can parse the PDF format. "+
		"Each page would typically be extracted separately, and then chunked appropriately.", doc.Name)
	
	// Create chunks from the content
	doc.Chunks = p.createChunks(content, doc.Metadata)
	
	return nil
}

// extractTextFromTXT extracts text from plain text files
func (p *DocumentProcessor) extractTextFromTXT(ctx context.Context, filePath string, doc *Document) error {
	content, err := os.ReadFile(filePath)
	if err != nil {
		return fmt.Errorf("failed to read text file: %w", err)
	}
	
	// Create chunks from the content
	doc.Chunks = p.createChunks(string(content), doc.Metadata)
	
	return nil
}

// createChunks breaks text into smaller chunks with optional overlap
func (p *DocumentProcessor) createChunks(content string, metadata Metadata) []Chunk {
	if len(content) == 0 {
		return []Chunk{}
	}
	
	var chunks []Chunk
	
	// Simple chunking by characters for demonstration
	// In a real implementation, you would use more sophisticated text splitting
	// that respects sentence boundaries, paragraphs, etc.
	for i := 0; i < len(content); i += p.chunkSize - p.chunkOverlap {
		end := i + p.chunkSize
		if end > len(content) {
			end = len(content)
		}
		
		chunkID := uuid.New().String()
		chunkNumber := len(chunks) + 1
		
		chunk := Chunk{
			ID:      chunkID,
			Content: content[i:end],
			Metadata: Metadata{
				Source:      metadata.Source,
				ChunkNumber: chunkNumber,
				// Additional metadata could be added here
			},
		}
		
		chunks = append(chunks, chunk)
		
		if end == len(content) {
			break
		}
	}
	
	// Update chunks with total count
	totalChunks := len(chunks)
	for i := range chunks {
		chunks[i].Metadata.TotalChunks = totalChunks
	}
	
	return chunks
}

// createEmbeddings generates vector embeddings for each chunk and stores them in the vector database
func (p *DocumentProcessor) createEmbeddings(ctx context.Context, doc *Document) error {
	log.Printf("Creating embeddings for document: %s", doc.ID)
	
	for i, chunk := range doc.Chunks {
		// In a real implementation, you would use an embedding model or service
		// Here we'll simulate a call to a vector database service
		
		// Build payload for the vector DB
		payload := map[string]interface{}{
			"id":        chunk.ID,
			"text":      chunk.Content,
			"metadata":  chunk.Metadata,
			"document_id": doc.ID,
		}
		
		jsonData, err := json.Marshal(payload)
		if err != nil {
			return fmt.Errorf("failed to marshal chunk data: %w", err)
		}
		
		// Send to vector database
		resp, err := http.Post(
			p.vectorDBURL+"/api/collections/documents/points", 
			"application/json",
			bytes.NewBuffer(jsonData),
		)
		if err != nil {
			return fmt.Errorf("failed to store embedding: %w", err)
		}
		defer resp.Body.Close()
		
		if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
			body, _ := io.ReadAll(resp.Body)
			return fmt.Errorf("failed to store embedding, status: %d, body: %s", resp.StatusCode, string(body))
		}
		
		log.Printf("Stored embedding for chunk %d/%d", i+1, len(doc.Chunks))
	}
	
	return nil
}

// QueryVectorDB searches the vector database for relevant document chunks
func (p *DocumentProcessor) QueryVectorDB(ctx context.Context, query string, limit int) ([]Chunk, error) {
	if limit <= 0 {
		limit = 5 // Default to 5 results
	}
	
	// Build query payload
	payload := map[string]interface{}{
		"query_text": query,
		"n_results":  limit,
	}
	
	jsonData, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal query: %w", err)
	}
	
	// Send query to vector database
	resp, err := http.Post(
		p.vectorDBURL+"/api/collections/documents/query",
		"application/json",
		bytes.NewBuffer(jsonData),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to query vector database: %w", err)
	}
	defer resp.Body.Close()
	
	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("vector DB query failed, status: %d, body: %s", resp.StatusCode, string(body))
	}
	
	// Parse response
	var result struct {
		Results []Chunk `json:"results"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}
	
	return result.Results, nil
}
