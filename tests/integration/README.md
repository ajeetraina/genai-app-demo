# GenAI Integration Tests

This directory contains integration tests for testing GenAI applications using Testcontainers.

## Test Overview

These tests demonstrate comprehensive testing of a GenAI application, covering:

1. **Basic Connectivity Tests** (`model_runner_test.go`)
   - Testing connection to model runner service
   - Checking available models
   - Testing model creation

2. **Prompt Handling Tests** (`prompt_test.go`)
   - Testing different types of prompts
   - Validating response format and content

3. **Performance Tests** (`performance_test.go`)
   - Measuring response latency
   - Testing concurrent request handling

4. **Error Handling Tests** (`error_handling_test.go`)
   - Testing malformed requests
   - Testing invalid endpoints
   - Testing context window limits

## Running the Tests

### Prerequisites

- Go 1.16+
- Docker (for Testcontainers)
- A running model runner service (either local or containerized)

### Quick Run

Run all integration tests:

```bash
cd tests/
go test -v ./integration
```

Run specific test suite:

```bash
cd tests/
go test -v ./integration -run TestPromptHandling
```

Run in short mode (skips longer tests):

```bash
cd tests/
go test -v ./integration -short
```

## Test Configuration

The tests are configured to use a local model runner service at `http://localhost:12434`. This can be modified in `helpers.go` if your setup is different.

For CI/CD environments, you can uncomment the containerized setup in `helpers.go` which will create and manage test containers automatically.

## Adding New Tests

To add new tests:

1. Create a new test file in the `integration` package
2. Use the `setupTestContainers()` function to get the base URL
3. Implement test cases using standard Go testing conventions
4. Add cleanup logic with `defer cleanup()`

## Example Test Structure

```go
func TestNewFeature(t *testing.T) {
    // Set up the test environment
    baseURL, cleanup := setupTestContainers(t)
    defer cleanup()
    
    // Set the LLM API endpoint
    llmEndpoint := baseURL + "/engines/llama.cpp/v1"
    
    // Your test logic here
    resp, err := sendCompletionRequest(llmEndpoint, "Your test prompt")
    
    // Assertions
    assert.NoError(t, err)
    assert.NotNil(t, resp)
    assert.Contains(t, resp.Choices[0].Text, "expected content")
}
```

## Benefits of This Testing Approach

1. **Isolation**: Tests run in isolated containers, preventing environment-specific issues
2. **Reproducibility**: Tests produce consistent results across different environments
3. **Comprehensiveness**: Tests cover many aspects of the GenAI application
4. **CI/CD Integration**: Tests can be integrated into continuous integration pipelines
5. **Performance Monitoring**: Tests measure and track performance metrics

## Common Issues

### Connection Issues

If tests fail with connection errors:
- Ensure the model runner service is running at the expected URL
- Check network connectivity between test environment and model runner
- Verify Docker is running if using Testcontainers

### Model-Specific Issues

If tests fail due to unexpected model behavior:
- Verify the model is correctly loaded and available
- Adjust test expectations based on the specific model's capabilities
- Consider model-specific response formats

## Further Reading

- [Testcontainers Documentation](https://golang.testcontainers.org/)
- [Go Testing Package](https://pkg.go.dev/testing)
- [Effective GenAI Testing Strategies](https://docs.anthropic.com/en/docs/)
