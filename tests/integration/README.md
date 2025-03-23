# GenAI Integration Tests with Testcontainers

This directory contains integration tests for GenAI applications using Testcontainers to create isolated, reproducible test environments.

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

## How Testcontainers Is Used

These tests use Testcontainers to create isolated test environments:

1. **Creating a Test Network**: Each test creates a dedicated Docker network
2. **Starting Proxy Containers**: A socat container forwards traffic to your model runner
3. **Automatic Cleanup**: Containers and networks are automatically removed after tests
4. **Isolated Test Environments**: Each test runs in its own isolated environment

The use of Testcontainers ensures that tests are:
- Repeatable across different environments
- Isolated from each other
- Representative of real-world deployment scenarios
- Compatible with CI/CD pipelines

## Running the Tests

### Prerequisites

- Go 1.16+
- Docker running locally
- A model runner service running on the host at port 12434

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

The tests use a socat container as a proxy to communicate with your host-based model runner. This allows the tests to run in an isolated Docker environment while still accessing the model runner service.

The proxy configuration is defined in `helpers.go` in the `setupTestContainers()` function, which:

1. Creates a Docker network
2. Starts a socat container that forwards port 8080 to host.docker.internal:12434
3. Returns the proper base URL to use for tests
4. Provides a cleanup function to terminate containers and remove networks

## Adding New Tests

To add new tests:

1. Create a new test file in the `integration` package
2. Use the `setupTestContainers()` function to get the base URL and cleanup function
3. Implement test cases using standard Go testing conventions
4. Add cleanup logic with `defer cleanup()`

## Example Test Structure

```go
func TestNewFeature(t *testing.T) {
    // Set up the test environment using Testcontainers
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

## Advanced Testcontainers Configuration

For more advanced testing scenarios, you can modify the `setupTestContainers()` function to:

1. Start multiple containers that interact with each other
2. Mount volumes for persistent storage
3. Set environment variables to configure container behavior
4. Define custom wait strategies for container readiness

For example, to test with a fully containerized model runner:

```go
modelRunnerContainer, err := testcontainers.GenericContainer(ctx, testcontainers.GenericContainerRequest{
    ContainerRequest: testcontainers.ContainerRequest{
        Image: "your-model-runner-image:latest",
        ExposedPorts: []string{"80/tcp"},
        Env: map[string]string{
            "MODEL": "ignaciolopezluna020/llama3.2:1B",
        },
        Networks: []string{"genai-test-network"},
        WaitingFor: wait.ForHTTP("/engines").WithPort("80/tcp"),
    },
    Started: true,
})
```

## Troubleshooting

### Docker Connectivity Issues

If tests fail with connection errors:

- Ensure Docker is running and accessible
- Verify that the model runner is running on the host at port 12434
- Check that host.docker.internal resolves correctly in your Docker environment
  - On Linux, you may need to add `--add-host=host.docker.internal:host-gateway` to your Docker run commands
- Examine container logs with `docker logs <container_id>` for more details

### Test Failures

If individual tests fail:

- Look for detailed error messages in the test output
- Check the model runner logs for any processing errors
- Try running with `-v` flag for verbose output
- Use `-run TestSpecificTest` to isolate and debug a specific test

## Further Reading

- [Testcontainers for Go Documentation](https://golang.testcontainers.org/)
- [Go Testing Package](https://pkg.go.dev/testing)
- [Docker Networking](https://docs.docker.com/network/)
