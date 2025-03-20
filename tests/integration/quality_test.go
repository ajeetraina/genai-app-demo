package integration

import (
	"testing"
)

func TestChatQuality(t *testing.T) {
	// Setup test environment
	baseURL, err := setupTestEnvironment()
	if err != nil {
		t.Fatalf("Failed to setup test environment: %v", err)
	}

	// Test various chat scenarios
	testCases := []struct {
		name     string
		messages []Message
		validate func(t *testing.T, resp string)
	}{
		{
			name: "Simple Question",
			messages: []Message{
				{
					Role:    "user",
					Content: "What is 2 + 2?",
				},
			},
			validate: func(t *testing.T, resp string) {
				// Check that we got a non-empty response
				if resp == "" {
					t.Error("Response should not be empty")
				}
				// We could add more specific checks here
			},
		},
		// Add more test cases as needed
	}

	// Run test cases
	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			// Prepare chat request
			chatReq := ChatRequest{
				Messages: tc.messages,
			}

			// Perform chat request
			resp := performChatRequest(t, baseURL, chatReq)

			// Validate response
			tc.validate(t, resp)
		})
	}
}

// Helper function to perform chat request
func performChatRequest(t *testing.T, baseURL string, req ChatRequest) string {
	// Use sendChatRequest to perform the actual request
	return sendChatRequest(t, baseURL, req)
}