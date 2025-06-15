package integration

import (
	"testing"
)

// TestGenAIAppIntegration tests the GenAI application with various API endpoints
func TestGenAIAppIntegration(t *testing.T) {
	// Skip if short mode is enabled
	if testing.Short() {
		t.Skip("skipping integration test in short mode")
	}

	// Setup test environment
	baseURL, err := setupTestEnvironment()
	if err != nil {
		t.Fatalf("Failed to setup test environment: %v", err)
	}

	// Test health endpoint
	t.Run("HealthEndpoint", func(t *testing.T) {
		testHealthEndpoint(t, baseURL)
	})

	// Test chat endpoint with various prompts
	testPrompts := []struct {
		name   string
		prompt string
	}{
		{
			name:   "Simple Greeting",
			prompt: "Hello, how are you today?",
		},
		{
			name:   "Technical Question",
			prompt: "What are the benefits of containerization?",
		},
		{
			name:   "Creative Prompt",
			prompt: "Write a short haiku about programming",
		},
	}

	// Run tests for each prompt
	for _, tp := range testPrompts {
		t.Run("ChatEndpoint/"+tp.name, func(t *testing.T) {
			// Create chat request with the test prompt
			chatReq := ChatRequest{
				Messages: []Message{
					{
						Role:    "user",
						Content: tp.prompt,
					},
				},
			}

			// Send request and get response
			resp := sendChatRequest(t, baseURL, chatReq)

			// Verify we got a non-empty response
			if resp == "" {
				t.Errorf("Received empty response for prompt: %s", tp.prompt)
			} else {
				// Display a preview of the response
				displayLen := min(len(resp), 100) // First 100 chars
				t.Logf("Response: %s...", resp[:displayLen])
			}
		})
	}
}
