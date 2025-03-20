package integration

import (
	"context"
	"testing"
)

// SetupTestEnvironment creates a test environment with necessary containers
func SetupTestEnvironment(t *testing.T) (*TestEnvironment, error) {
	// Skip if short mode is enabled
	if testing.Short() {
		t.Skip("skipping integration test in short mode")
	}

	ctx := context.Background()
	env := &TestEnvironment{
		ctx: ctx,
	}

	// For now, just return a simplified environment pointing to localhost
	env.BaseURL = "http://localhost:8080"
	
	return env, nil
}