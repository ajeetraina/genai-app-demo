package integration

import (
	"testing"
	"time"
)

func TestChatPerformance(t *testing.T) {
	// Skip this test if short mode is enabled
	if testing.Short() {
		t.Skip("skipping performance test in short mode")
	}

	// Setup test environment
	baseURL, err := setupTestEnvironment()
	if err != nil {
		t.Fatalf("Failed to setup test environment: %v", err)
	}

	// Performance test for chat endpoint
	t.Run("ChatResponseTime", func(t *testing.T) {
		start := time.Now()

		// Perform the chat request
		testChatEndpoint(t, baseURL)

		// Check response time
		duration := time.Since(start)
		maxAllowedTime := 2 * time.Second

		if duration > maxAllowedTime {
			t.Errorf("Chat endpoint response time too slow: %v (max: %v)", duration, maxAllowedTime)
		}
	})
}