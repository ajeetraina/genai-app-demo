package integration

import (
	"net/http"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
)

// TestErrorHandling tests how the API handles various error scenarios
func TestErrorHandling(t *testing.T) {
	baseURL, cleanup := setupTestContainers(t)
	defer cleanup()
	
	// Set the LLM API endpoint
	llmEndpoint := baseURL + "/engines/llama.cpp/v1"
	
	// Test 1: Malformed JSON request
	t.Run("Malformed JSON", func(t *testing.T) {
		resp, err := http.Post(
			llmEndpoint+"/completions",
			"application/json",
			strings.NewReader("{malformed json}"),
		)
		
		// We expect no transport error, but a bad request response
		assert.NoError(t, err)
		assert.NotNil(t, resp)
		defer resp.Body.Close()
		
		// API should return a 400 Bad Request for malformed JSON
		assert.Equal(t, http.StatusBadRequest, resp.StatusCode)
	})
	
	// Test 2: Invalid endpoint
	t.Run("Invalid Endpoint", func(t *testing.T) {
		resp, err := http.Get(llmEndpoint + "/nonexistent_endpoint")
		
		assert.NoError(t, err)
		assert.NotNil(t, resp)
		defer resp.Body.Close()
		
		// API should return a 404 Not Found for invalid endpoints
		assert.Equal(t, http.StatusNotFound, resp.StatusCode)
	})
	
	// Test 3: Missing required fields in request
	t.Run("Missing Required Fields", func(t *testing.T) {
		// Create a request with empty body - missing the required 'prompt' field
		resp, err := http.Post(
			llmEndpoint+"/completions",
			"application/json",
			strings.NewReader("{}"),
		)
		
		assert.NoError(t, err)
		assert.NotNil(t, resp)
		defer resp.Body.Close()
		
		// API should return an error status code for missing required fields
		// This could be 400 Bad Request or 422 Unprocessable Entity depending on implementation
		assert.True(t, resp.StatusCode >= 400 && resp.StatusCode < 500,
			"Expected client error status code, got: %d", resp.StatusCode)
	})
}

// TestContextWindowLimits tests how the model handles inputs approaching context window limits
func TestContextWindowLimits(t *testing.T) {
	// Skip this test in short mode as it's resource-intensive
	if testing.Short() {
		t.Skip("Skipping context window test in short mode")
	}
	
	baseURL, cleanup := setupTestContainers(t)
	defer cleanup()
	
	// Set the LLM API endpoint
	llmEndpoint := baseURL + "/engines/llama.cpp/v1"
	
	// Test with different sizes of context
	testCases := []struct {
		name             string
		repeatedText     string
		repetitionCount  int
		expectError      bool
	}{
		{"Small context", "The quick brown fox jumps over the lazy dog. ", 10, false},
		{"Medium context", "The quick brown fox jumps over the lazy dog. ", 100, false},
		// Large context might approach model's limit
		{"Large context", "The quick brown fox jumps over the lazy dog. ", 500, false},
	}
	
	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			// Generate a prompt by repeating the text
			prompt := strings.Repeat(tc.repeatedText, tc.repetitionCount) + "Based on the above text, how many times does the fox jump?"
			
			// Send the request
			resp, err := sendCompletionRequest(llmEndpoint, prompt)
			
			if tc.expectError {
				// If we expect error (e.g., context too large), check for appropriate error
				assert.Error(t, err)
				assert.Contains(t, err.Error(), "context", "Error should mention context window")
			} else {
				// Otherwise expect successful response
				assert.NoError(t, err)
				assert.NotNil(t, resp)
				assert.NotEmpty(t, resp.Choices[0].Text)
				
				// Log token usage
				t.Logf("%s - Tokens used: Prompt=%d, Completion=%d, Total=%d",
					tc.name, resp.Usage.PromptTokens, resp.Usage.CompletionTokens, resp.Usage.TotalTokens)
			}
		})
	}
}
