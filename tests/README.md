# Integration Tests for GenAI Application

This directory contains integration tests for the GenAI application with Testcontainers support.

## Quick Start

```bash
# Install dependencies
go get github.com/stretchr/testify/assert github.com/stretchr/testify/require
go mod tidy

# Run a single test to verify setup
go test -v ./integration -run TestSimple

# Run a specific integration test
go test -v ./integration -run TestGenAIAppIntegration

# Test Model Runner connectivity
go test -v ./integration -run TestModelRunnerIntegration

# Run extended performance tests
go test -v ./integration -run TestExtendedPerformance

# Run all tests
go test -v ./integration
```

## Available Tests

- **TestSimple**: Basic test to verify compilation and environment setup
- **TestBasicTestcontainer**: Validates the Testcontainers environment setup
- **TestGenAIAppIntegration**: Tests various API endpoints with different prompt types
- **TestModelRunnerIntegration**: Tests connectivity to Docker Model Runner using Testcontainers
- **TestLLMResponseQuality**: Validates the quality of LLM responses
- **TestLLMPerformance**: Measures performance metrics of the LLM service
- **TestMultiTurnConversation**: Tests context maintenance in conversations
- **TestChatPerformance**: Checks chat endpoint response times
- **TestChatQuality**: Verifies chat response quality for specific prompts
- **TestDockerIntegration**: Tests Docker-based deployments
- **TestExtendedPerformance**: Runs extended load tests over a longer period

## Test Structure

- `setup.go`: Contains the test environment setup code
- `test_helpers.go`: Helper functions for testing API endpoints
- `chat_request.go`: Functions for sending chat requests
- `quality_test.go`: Tests for chat response quality
- `performance_test.go`: Tests for API performance
- `llm_quality_test.go`: Tests for LLM response quality
- `genai_integration_test.go`: Tests for API endpoints integration
- `extended_test.go`: Extended performance tests
- `basic_testcontainer_test.go`: Basic test for Testcontainers functionality
- `simple_test.go`: Minimal test to verify package compilation
- `model_runner_test.go`: Test for Docker Model Runner connectivity using Testcontainers

## Running Tests

### Basic Tests

To verify your testing environment is set up properly:

```bash
go test -v ./integration -run TestSimple
go test -v ./integration -run TestBasicTestcontainer
```

### Functional API Tests

Tests the API endpoints and response quality:

```bash
go test -v ./integration -run TestGenAIAppIntegration
go test -v ./integration -run TestChatQuality
```

### Model Runner Tests

Tests connectivity to the Docker Model Runner:

```bash
# Enable Docker Model Runner in Docker Desktop first
# Make sure to check "Enable host-side TCP support"
go test -v ./integration -run TestModelRunnerIntegration
```

### Performance Tests

Measures response times and performance characteristics:

```bash
go test -v ./integration -run TestChatPerformance
go test -v ./integration -run TestLLMPerformance
```

### Extended Performance Tests

Runs load tests for an extended period (30 seconds by default):

```bash
go test -v ./integration -run TestExtendedPerformance
```

### Short Mode Tests

Skip long-running tests:

```bash
go test -v ./integration -short
```

## Using Testcontainers for Model Runner

The `TestModelRunnerIntegration` test demonstrates how to use Testcontainers to connect to the Docker Model Runner:

1. Creates a socat container that forwards traffic to model-runner.docker.internal
2. Dynamically assigns ports to avoid conflicts
3. Tests connectivity to the Model Runner API
4. Logs available models and API endpoints
5. Optionally attempts to create a model
6. Provides the dynamically assigned URL for the application to use

This approach eliminates the need for hardcoded port values and provides a more reliable testing environment.

## Prerequisites

- Go 1.19 or higher
- Docker (for Testcontainers functionality)
- Docker Desktop with Model Runner enabled (for Model Runner tests)
- Running GenAI application at http://localhost:8080 (for API tests)

## Testcontainers vs Docker Compose

This test suite demonstrates two approaches for managing dependencies:

1. **Docker Compose**: Used in the main branch for starting the application and its dependencies
2. **Testcontainers**: Used in this branch for programmatically managing dependencies

Benefits of the Testcontainers approach:

- Dynamic port allocation to avoid conflicts
- Programmatic creation and cleanup of containers
- Simplified connection management
- Same approach can be used for both development and testing
- Eliminates the need for multiple compose files

See `TESTCONTAINERS_USAGE.md` in the project root for more details on the Testcontainers approach.