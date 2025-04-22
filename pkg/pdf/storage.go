package pdf

import (
	"fmt"
	"sync"
	"time"

	"github.com/google/uuid"
)

// Document represents a processed PDF document
type Document struct {
	ID        string `json:"id"`
	Filename  string `json:"filename"`
	Content   string `json:"content"`
	PageCount int    `json:"pageCount"`
	Timestamp int64  `json:"timestamp"`
}

// Storage manages the storage of processed PDF documents
type Storage struct {
	documents map[string]*Document
	mu        sync.RWMutex
}

// NewStorage creates a new PDF storage
func NewStorage() *Storage {
	return &Storage{
		documents: make(map[string]*Document),
	}
}

// Store adds a processed document to storage
func (s *Storage) Store(filename, content string, pageCount int) (*Document, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	doc := &Document{
		ID:        uuid.New().String(),
		Filename:  filename,
		Content:   content,
		PageCount: pageCount,
		Timestamp: time.Now().Unix(),
	}

	s.documents[doc.ID] = doc
	return doc, nil
}

// GetDocument retrieves a document by ID
func (s *Storage) GetDocument(id string) (*Document, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	doc, exists := s.documents[id]
	if !exists {
		return nil, fmt.Errorf("document not found: %s", id)
	}

	return doc, nil
}

// ListDocuments returns all stored documents
func (s *Storage) ListDocuments() []*Document {
	s.mu.RLock()
	defer s.mu.RUnlock()

	docs := make([]*Document, 0, len(s.documents))
	for _, doc := range s.documents {
		docs = append(docs, doc)
	}

	return docs
}

// DeleteDocument removes a document from storage
func (s *Storage) DeleteDocument(id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if _, exists := s.documents[id]; !exists {
		return fmt.Errorf("document not found: %s", id)
	}

	delete(s.documents, id)
	return nil
}