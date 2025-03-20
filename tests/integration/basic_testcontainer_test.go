package integration

import (
	"testing"
)

// TestBasicTestcontainer demonstrates using testcontainers in a simplified way
func TestBasicTestcontainer(t *testing.T) {
	// Skip this test in short mode
	if testing.Short() {
		t.Skip("skipping testcontainer test in short mode")
	}

	// Use the simplified TestEnvironment which doesn't actually create containers yet
	env, err := SetupTestEnvironment(t)
	if err != nil {
		t.Fatalf("Failed to setup test environment: %v", err)
	}
	defer func() {
		if err := env.Cleanup(); err != nil {
			t.Logf("Warning: cleanup failed: %v", err)
		}
	}()

	// Test that we can at least get a base URL
	if env.BaseURL == "" {
		t.Fatal("BaseURL should not be empty")
	}

	t.Logf("Successfully created test environment with BaseURL: %s", env.BaseURL)
}