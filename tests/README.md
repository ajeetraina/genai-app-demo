# Integration Tests for GenAI Application

This directory contains integration tests for the GenAI application with Testcontainers support.

## Running the Tests

First, make sure you have the necessary dependencies:

```bash
go get github.com/stretchr/testify/assert github.com/stretchr/testify/require
go mod tidy
```

Then run the tests with:

```bash
# Basic test to verify compilation
go test -v ./integration -run TestSimple

# Run all tests (requires backend service running)
go test -v ./integration

# Run tests in short mode (skips tests that require external services)
go test -v ./integration -short
```

## Test Structure

- `setup.go`: Contains the test environment setup code
- `test_helpers.go`: Helper functions for testing API endpoints
- `chat_request.go`: Functions for sending chat requests
- `quality_test.go`: Tests for chat response quality
- `performance_test.go`: Tests for API performance
- `llm_quality_test.go`: Tests for LLM response quality
- `basic_testcontainer_test.go`: Basic test for Testcontainers functionality
- `simple_test.go`: Minimal test to verify package compilation

## Prerequisites

- Go 1.19 or higher
- Docker (for Testcontainers functionality)
- Running GenAI application (for API tests)

## Note

The Testcontainers functionality is currently simplified. For full container-based testing, additional implementation will be needed in the `SetupTestEnvironment` function.