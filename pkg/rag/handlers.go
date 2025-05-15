package rag

import (
	"encoding/json"
	"log"
	"net/http"
	"time"
)

// HandlerConfig holds the configuration for the RAG API handlers
type HandlerConfig struct {
	UploadDir    string
	VectorDBURL  string
	LLMClient    LLMClient
}

// Handler manages the RAG HTTP handlers
type Handler struct {
	processor  *DocumentProcessor
	ragService *RagService
}

// NewHandler creates a new RAG handler
func NewHandler(config HandlerConfig) *Handler {
	processor := NewDocumentProcessor(config.UploadDir, config.VectorDBURL)
	ragService := NewRagService(processor, config.LLMClient)
	
	return &Handler{
		processor:  processor,
		ragService: ragService,
	}
}

// RegisterRoutes registers the RAG endpoints
func (h *Handler) RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("/api/documents/upload", h.UploadDocument)
	mux.HandleFunc("/api/rag/query", h.QueryRAG)
	mux.HandleFunc("/api/rag/stream", h.StreamRAG)
}

// UploadDocument handles document uploads
func (h *Handler) UploadDocument(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	
	// Max upload size of 10MB
	r.ParseMultipartForm(10 << 20)
	
	file, header, err := r.FormFile("file")
	if err != nil {
		http.Error(w, "Failed to get file from request: "+err.Error(), http.StatusBadRequest)
		return
	}
	defer file.Close()
	
	log.Printf("Uploading file: %s", header.Filename)
	
	ctx := r.Context()
	doc, err := h.processor.ProcessFile(ctx, file, header)
	if err != nil {
		http.Error(w, "Failed to process file: "+err.Error(), http.StatusInternalServerError)
		return
	}
	
	// Return document info
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Document processed successfully",
		"document": map[string]interface{}{
			"id":   doc.ID,
			"name": doc.Name,
			"type": doc.Type,
			"chunks_count": len(doc.Chunks),
		},
	}); err != nil {
		log.Printf("Error encoding response: %v", err)
	}
}

// QueryRequest represents a request to query the RAG system
type QueryRequest struct {
	Query string `json:"query"`
}

// QueryResponse represents a response from the RAG system
type QueryResponse struct {
	Answer  string   `json:"answer"`
	Sources []string `json:"sources,omitempty"`
}

// QueryRAG handles RAG-enhanced queries
func (h *Handler) QueryRAG(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	
	var req QueryRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body: "+err.Error(), http.StatusBadRequest)
		return
	}
	
	if req.Query == "" {
		http.Error(w, "Query cannot be empty", http.StatusBadRequest)
		return
	}
	
	ctx := r.Context()
	
	// Get relevant chunks
	chunks, err := h.processor.QueryVectorDB(ctx, req.Query, 3)
	if err != nil {
		http.Error(w, "Failed to retrieve context: "+err.Error(), http.StatusInternalServerError)
		return
	}
	
	// Log RAG debug info
	h.ragService.LogDebug(req.Query, chunks)
	
	// Generate answer
	answer, err := h.ragService.QueryWithRAG(ctx, req.Query)
	if err != nil {
		http.Error(w, "Failed to generate answer: "+err.Error(), http.StatusInternalServerError)
		return
	}
	
	// Get sources
	sources := h.ragService.GetSourcesForResponse(chunks)
	
	// Return response
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(QueryResponse{
		Answer:  answer,
		Sources: sources,
	}); err != nil {
		log.Printf("Error encoding response: %v", err)
	}
}

// StreamRAG handles streaming RAG-enhanced responses
func (h *Handler) StreamRAG(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	
	var req QueryRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body: "+err.Error(), http.StatusBadRequest)
		return
	}
	
	if req.Query == "" {
		http.Error(w, "Query cannot be empty", http.StatusBadRequest)
		return
	}
	
	ctx := r.Context()
	
	// Get relevant chunks
	chunks, err := h.processor.QueryVectorDB(ctx, req.Query, 3)
	if err != nil {
		http.Error(w, "Failed to retrieve context: "+err.Error(), http.StatusInternalServerError)
		return
	}
	
	// Log RAG debug info
	h.ragService.LogDebug(req.Query, chunks)
	
	// Set up SSE
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	
	// Stream the response
	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "Streaming unsupported", http.StatusInternalServerError)
		return
	}
	
	// Send sources immediately as a special event
	sources := h.ragService.GetSourcesForResponse(chunks)
	sourcesEvent := map[string]interface{}{
		"type":    "sources",
		"sources": sources,
	}
	sourcesJSON, _ := json.Marshal(sourcesEvent)
	
	_, err = w.Write([]byte("data: " + string(sourcesJSON) + "\n\n"))
	if err != nil {
		log.Printf("Error writing sources event: %v", err)
		return
	}
	flusher.Flush()
	
	// Stream the response
	err = h.ragService.QueryWithRAGStream(ctx, req.Query, func(text string, done bool) error {
		event := map[string]interface{}{
			"type": "token",
			"text": text,
			"done": done,
		}
		eventJSON, _ := json.Marshal(event)
		
		_, err := w.Write([]byte("data: " + string(eventJSON) + "\n\n"))
		if err != nil {
			return err
		}
		
		flusher.Flush()
		
		// Add a small delay for smoother streaming (optional)
		time.Sleep(10 * time.Millisecond)
		
		return nil
	})
	
	if err != nil {
		log.Printf("Error streaming response: %v", err)
	}
}
