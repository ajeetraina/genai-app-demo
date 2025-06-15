package integration

import (
	"testing"
)

func TestDockerIntegration(t *testing.T) {
	// Setup test environment
	baseURL, err := setupTestEnvironment()
	if err != nil {
		t.Fatalf("Failed to setup test environment: %v", err)
	}

	// Run Docker-specific tests
	t.Run("HealthCheck", func(t *testing.T) {
		testHealthEndpoint(t, baseURL)
	})

	t.Run("ChatEndpoint", func(t *testing.T) {
		testChatEndpoint(t, baseURL)
	})
}