package integration

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"testing"
)

// ChatRequest represents the structure for sending a chat request
type ChatRequest struct {
	Messages []Message `json:"messages"`
}

// Message represents a single message in the chat request
type Message struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// setupTestEnvironment prepares the test environment
func setupTestEnvironment() (string, error) {
	// Get the base URL from environment variable, default to localhost
	baseURL := os.Getenv("BASE_URL")
	if baseURL == "" {
		baseURL = "http://localhost:8080"
	}
	return baseURL, nil
}

// testHealthEndpoint checks the health endpoint of the application
func testHealthEndpoint(t *testing.T, baseURL string) {
	resp, err := http.Get(fmt.Sprintf("%s/health", baseURL))
	if err != nil {
		t.Fatalf("Failed to reach health endpoint: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		t.Errorf("Health endpoint returned non-200 status: %d", resp.StatusCode)
	}
}

// testChatEndpoint tests the chat functionality
func testChatEndpoint(t *testing.T, baseURL string) {
	// Prepare a sample chat request
	chatReq := ChatRequest{
		Messages: []Message{
			{
				Role:    "user",
				Content: "Hello, can you help me?",
			},
		},
	}

	// Convert the request to JSON
	jsonReq, err := json.Marshal(chatReq)
	if err != nil {
		t.Fatalf("Failed to marshal chat request: %v", err)
	}

	// Send the request
	resp, err := http.Post(
		fmt.Sprintf("%s/chat", baseURL), 
		"application/json", 
		bytes.NewBuffer(jsonReq),
	)
	if err != nil {
		t.Fatalf("Failed to send chat request: %v", err)
	}
	defer resp.Body.Close()

	// Check response status
	if resp.StatusCode != http.StatusOK {
		t.Errorf("Chat endpoint returned non-200 status: %d", resp.StatusCode)
	}

	// Read the response as text instead of trying to parse as JSON
	// This is because the API returns a text stream, not JSON
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		t.Fatalf("Failed to read response body: %v", err)
	}

	// Log a portion of the response for debugging
	responseText := string(body)
	if len(responseText) > 0 {
		displayLen := min(len(responseText), 100) // First 100 chars
		t.Logf("Response preview: %s...", responseText[:displayLen])
	} else {
		t.Error("Empty response from chat endpoint")
	}
}

// min returns the smaller of x or y
func min(x, y int) int {
	if x < y {
		return x
	}
	return y
}