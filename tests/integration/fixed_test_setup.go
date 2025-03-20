package integration

import (
	"context"
	"testing"
)

// TestEnvironment is the environment for testing
type TestEnvironment struct {
	BaseURL string
	ctx     context.Context
}

// Cleanup cleans up resources
func (env *TestEnvironment) Cleanup() error {
	return nil
}

// SetupTestEnvironment sets up a test environment
// This is now defined in the same file to ensure it's visible to all tests
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