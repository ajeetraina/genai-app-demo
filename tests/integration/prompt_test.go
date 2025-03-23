package integration

import (
	"strings"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

// TestPromptHandling tests how the model handles different types of prompts
func TestPromptHandling(t *testing.T) {
	baseURL, cleanup := setupTestContainers(t)
	defer cleanup()
	
	// Set the LLM API endpoint
	llmEndpoint := baseURL + "/engines/llama.cpp/v1"
	
	// Test different prompt types
	testCases := []struct {
		name          string
		prompt        string
		expectedError bool
	}{
		{"Basic prompt", "What is the capital of France?", false},
		{"Question with context", "The Eiffel Tower is in what city?", false},
		// We don't test for empty prompts or too long prompts as those might have different
		// behaviors depending on the model implementation
		{"Special characters", "!@#$%^&*() - Can you understand special characters?", false},
		{"Code analysis", "What does this function do: function add(a,b) { return a+b; }", false},
	}
	
	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			// Skip some tests in short mode to save time
			if testing.Short() && tc.name != "Basic prompt" {
				t.Skip("Skipping in short mode")
			}
			
			resp, err := sendCompletionRequest(llmEndpoint, tc.prompt)
			
			if tc.expectedError {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
				assert.NotNil(t, resp)
				assert.NotEmpty(t, resp.Choices)
				assert.NotEmpty(t, resp.Choices[0].Text)
				
				// Log the response for debugging
				t.Logf("Response for '%s': %s", tc.prompt, resp.Choices[0].Text[:min(50, len(resp.Choices[0].Text))])
			}
		})
	}
}

// TestResponseValidation tests that responses have the expected structure and content
func TestResponseValidation(t *testing.T) {
	baseURL, cleanup := setupTestContainers(t)
	defer cleanup()
	
	// Set the LLM API endpoint
	llmEndpoint := baseURL + "/engines/llama.cpp/v1"
	
	// Simple prompt that should generate a predictable response
	prompt := "Count from 1 to 5."
	
	resp, err := sendCompletionRequest(llmEndpoint, prompt)
	
	// Basic validation
	assert.NoError(t, err)
	assert.NotNil(t, resp)
	assert.Equal(t, "text_completion", resp.Object)
	assert.NotEmpty(t, resp.ID)
	assert.Greater(t, resp.Created, int64(0))
	assert.NotEmpty(t, resp.Model)
	
	// Validate choices
	assert.NotEmpty(t, resp.Choices)
	assert.NotEmpty(t, resp.Choices[0].Text)
	assert.Equal(t, 0, resp.Choices[0].Index) // First choice index should be 0
	
	// Check that response contains numbers 1-5 in some form
	responseText := resp.Choices[0].Text
	for i := 1; i <= 5; i++ {
		assert.Contains(t, responseText, string(rune('0'+i)),
			"Response should contain the number %d", i)
	}
	
	// Usage stats should be populated
	assert.Greater(t, resp.Usage.PromptTokens, 0)
	assert.Greater(t, resp.Usage.CompletionTokens, 0)
	assert.Equal(t, resp.Usage.PromptTokens+resp.Usage.CompletionTokens, resp.Usage.TotalTokens)
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
