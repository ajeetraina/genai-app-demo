# Testing the GenAI Application with Testcontainers

This guide explains how to test the GenAI application using Testcontainers, a library that provides lightweight, throwaway instances of common databases, message brokers, and other services as Docker containers.

## Benefits of Using Testcontainers

1. **Isolated Testing Environment**: Each test runs in its own isolated environment
2. **No External Dependencies**: Tests don't rely on external services being available
3. **Real Components**: Tests use actual services, not mocks (unless specifically chosen)
4. **CI/CD Ready**: Works well in continuous integration environments
5. **Cleanup Included**: Automatically cleans up containers after tests finish

## Prerequisites

- Go 1.19 or higher
- Docker Engine installed and running
- [testcontainers-go](https://github.com/testcontainers/testcontainers-go) package

## Setup

Install the required Go dependencies:

```bash
cd tests
make setup
```

## Running Tests

We've implemented several test categories that you can run:

### All Tests

To run all tests:

```bash
make test
```

**Note**: This will start all containers (Ollama, backend, frontend) and run all tests. The first run might be slow as Docker images are downloaded and built.

### Specific Test Categories

Run only specific test categories:

```bash
# API endpoint tests
make test-api

# LLM quality tests
make test-quality

# Performance tests
make test-performance

# Multi-turn conversation tests
make test-conversation
```

### Short Mode

For quicker tests (useful during development):

```bash
make test-short
```

This will skip long-running tests and use mocks where appropriate.

### Mock Tests

For very fast tests using mocks instead of real LLM:

```bash
make test-mock
```

These tests are ideal for CI/CD pipelines where you want to verify basic functionality without waiting for LLMs to initialize.

## Test Structure

Our test suite includes:

1. **API Tests**: Verify backend endpoints and responses
2. **Quality Tests**: Check LLM response quality for various prompt types
3. **Performance Tests**: Measure response times and throughput
4. **Conversation Tests**: Verify multi-turn conversation capabilities
5. **Mock Tests**: Fast tests with simulated responses

## Testcontainers Setup

The tests use Testcontainers to create:

1. An Ollama container running Llama 3.2 (1B parameter model)
2. A backend container with the Go API server
3. A frontend container with the React application (optional)

All containers are connected via a Docker network to ensure proper communication.

## Cleanup

To clean up any orphaned containers:

```bash
make clean
```

## Troubleshooting

If you encounter issues:

1. Verify Docker is running with `docker info`
2. Check container logs: `docker logs <container_id>`
3. Increase timeouts for LLM initialization: `TIMEOUT=15m make test`
4. Run with verbose logging: `TESTCONTAINERS_VERBOSE=true make test`

## Alternative: Docker Compose Testing

If you prefer to use Docker Compose instead of Testcontainers:

```bash
make test-compose
```

This uses the `docker-compose.test.yml` configuration instead of programmatically creating containers.