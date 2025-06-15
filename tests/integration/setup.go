package integration

import (
	"context"
	"testing"
)

// TestEnvironment represents the test environment
type TestEnvironment struct {
	BaseURL string
	ctx     context.Context
}

// Cleanup cleans up any resources
func (env *TestEnvironment) Cleanup() error {
	return nil
}

// SetupTestEnvironment creates a test environment
func SetupTestEnvironment(t *testing.T) (*TestEnvironment, error) {
	ctx := context.Background()
	env := &TestEnvironment{
		ctx:     ctx,
		BaseURL: "http://localhost:8080",
	}
	return env, nil
}