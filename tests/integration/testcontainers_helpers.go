package integration

import (
	"context"
	"testing"
)

// This file acts as a bridge between the existing test files and the new testcontainers setup

// Adapts the testcontainers setup to work with existing tests
func SetupTestEnvironment(t *testing.T) (*TestEnvironment, error) {
	return setupTestcontainersEnvironment(t)
}

// The actual testcontainers setup implementation - renamed to avoid conflict
func setupTestcontainersEnvironment(t *testing.T) (*TestEnvironment, error) {
	// Skip if short mode is enabled
	if testing.Short() {
		t.Skip("skipping integration test in short mode")
	}

	ctx := context.Background()
	env := &TestEnvironment{
		ctx: ctx,
	}

	// For now, just return a simplified environment pointing to localhost
	// This is a temporary solution to make the tests compile
	env.BaseURL = "http://localhost:8080"
	
	// In a real implementation, we would start containers here
	// The full implementation is in testcontainers_setup.go
	
	return env, nil
}