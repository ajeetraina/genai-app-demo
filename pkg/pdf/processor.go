package pdf

import (
	"context"
        "bytes"
  	"fmt"
	"io"
	"mime/multipart"
	"strings"

	"github.com/ledongthuc/pdf"
	"github.com/rs/zerolog/log"
)

// Processor handles PDF parsing and text extraction
type Processor struct {
	context context.Context
}

// NewProcessor creates a new PDF processor
func NewProcessor(ctx context.Context) *Processor {
	return &Processor{
		context: ctx,
	}
}

// ExtractText extracts text from a PDF file
func (p *Processor) ExtractText(file *multipart.FileHeader) (string, int, error) {
	log.Info().Str("filename", file.Filename).Msg("Extracting text from PDF")

	// Open the uploaded file
	src, err := file.Open()
	if err != nil {
		return "", 0, fmt.Errorf("failed to open PDF file: %w", err)
	}
	defer src.Close()

	// Create a temporary file for PDF processing
	tempFile, err := io.ReadAll(src)
	if err != nil {
		return "", 0, fmt.Errorf("failed to read PDF file: %w", err)
	}

	// Open PDF for reading
	r, err := pdf.NewReader(bytes.NewReader(tempFile), int64(len(tempFile)))
        if err != nil {
		return "", 0, fmt.Errorf("failed to parse PDF: %w", err)
	}

	totalPages := r.NumPage()
	var content strings.Builder

	// Extract text from each page
	for pageNum := 1; pageNum <= totalPages; pageNum++ {
		page := r.Page(pageNum)
		if page.V.IsNull() {
			continue
		}

		text, err := page.GetPlainText(nil)
		if err != nil {
			log.Warn().Int("page", pageNum).Err(err).Msg("Failed to extract text from page")
			continue
		}

		content.WriteString(fmt.Sprintf("\n--- Page %d ---\n", pageNum))
		content.WriteString(text)
	}

	extractedText := content.String()
	if extractedText == "" {
		return "", totalPages, fmt.Errorf("no text content found in PDF")
	}

	log.Info().Int("pages", totalPages).Int("length", len(extractedText)).Msg("Text extraction completed")
	return extractedText, totalPages, nil
}

// ValidateFile checks if the uploaded file is a valid PDF
func (p *Processor) ValidateFile(file *multipart.FileHeader) error {
	if file == nil {
		return fmt.Errorf("no file provided")
	}

	// Check file extension
	if !strings.HasSuffix(strings.ToLower(file.Filename), ".pdf") {
		return fmt.Errorf("invalid file extension: expected .pdf")
	}

	// Check content type
	contentType := file.Header.Get("Content-Type")
	if contentType != "application/pdf" && contentType != "application/x-pdf" {
		return fmt.Errorf("invalid file type: expected application/pdf, got %s", contentType)
	}

	// Check file size (max 10MB)
	if file.Size > 10*1024*1024 {
		return fmt.Errorf("file too large: maximum size is 10MB")
	}

	return nil
}
