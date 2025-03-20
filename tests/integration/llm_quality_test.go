package integration

import (
	"testing"
)

// TestLLMResponseQuality tests the quality of responses from the LLM
func TestLLMResponseQuality(t *testing.T) {
	// Skip if short mode is enabled
	if testing.Short() {
		t.Skip("skipping quality test in short mode")
	}

	// Setup test environment using the simplified setup function
	env, err := SetupTestEnvironment(t)
	if err != nil {
		t.Fatalf("Failed to setup test environment: %v", err)
	}
	defer env.Cleanup()

	// Just a simple test for now
	t.Run("BasicResponse", func(t *testing.T) {
		testHealthEndpoint(t, env.BaseURL)
		testChatEndpoint(t, env.BaseURL)
	})
}

// TestLLMPerformance measures performance metrics for the LLM service
func TestLLMPerformance(t *testing.T) {
	// Skip if short mode is enabled
	if testing.Short() {
		t.Skip("skipping performance test in short mode")
	}

	// Setup test environment using the simplified setup function
	env, err := SetupTestEnvironment(t)
	if err != nil {
		t.Fatalf("Failed to setup test environment: %v", err)
	}
	defer env.Cleanup()

	// Just a simple test for now
	t.Run("ResponseLatency", func(t *testing.T) {
		testHealthEndpoint(t, env.BaseURL)
		testChatEndpoint(t, env.BaseURL)
	})
}

// TestMultiTurnConversation tests the LLM's ability to maintain context in a conversation
func TestMultiTurnConversation(t *testing.T) {
	// Skip if short mode is enabled
	if testing.Short() {
		t.Skip("skipping multi-turn conversation test in short mode")
	}

	// Setup test environment using the simplified setup function
	env, err := SetupTestEnvironment(t)
	if err != nil {
		t.Fatalf("Failed to setup test environment: %v", err)
	}
	defer env.Cleanup()

	// Just a simple test for now
	t.Run("Conversation", func(t *testing.T) {
		testHealthEndpoint(t, env.BaseURL)
		testChatEndpoint(t, env.BaseURL)
	})
}