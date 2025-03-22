# Using Testcontainers for Development and Testing

This branch introduces a Testcontainers-based approach for both development and testing of the GenAI App. It eliminates the need for multiple Docker Compose files by leveraging Testcontainers to manage dependencies programmatically.

## Features

- **Development Mode**: Automatically starts and configures dependencies when running the app in dev mode
- **TCP Connection Support**: Uses a socat container to forward traffic to the Docker Model Runner
- **Graceful Shutdown**: Properly cleans up resources when the application exits
- **Integrated Testing**: Tests Model Runner API directly with Testcontainers

## Development Usage

To run the application in development mode with Testcontainers managing the Model Runner connection:

```bash
# Make sure Docker Model Runner is enabled in Docker Desktop
# with "Enable host-side TCP support" checked

# Run the application in development mode
go run -tags dev .
```

This will:
1. Start a socat container that forwards traffic to model-runner.docker.internal
2. Configure the application to use this TCP connection
3. Automatically clean up containers when the application exits

## Testing

The Model Runner integration test is located at `tests/integration/model_runner_test.go`. It tests:

1. Connectivity to the Model Runner API
2. Listing available models
3. Creating a new model
4. Verifying the model was added
5. Deleting the model
6. Verifying the model was removed

To run the tests:

```bash
cd tests
go test -v ./integration -run TestModelRunnerIntegration
```

## Benefits Over Docker Compose

1. **Simplified Configuration**: No need for multiple compose files
2. **Dynamic Port Allocation**: Avoids port conflicts
3. **Programmatic Control**: Start/stop containers directly from Go code
4. **Unified Approach**: Same approach for both development and testing
5. **Automatic Cleanup**: Graceful shutdown of containers when the app exits

## Implementation Details

### Development Mode

The file `dev_dependencies.go` is built only when the `dev` build tag is used. It uses Go's `init()` function to:

- Start a socat container to forward traffic to the Docker Model Runner
- Configure environment variables for the application
- Set up signal handlers for graceful shutdown

### Integration Testing

The Model Runner test uses a similar approach to start a socat container and test the Model Runner API endpoints.

## Upgrading Testcontainers

This implementation currently uses Testcontainers v0.27.0. It's recommended to upgrade to v0.35.0 for the latest features and improvements. To upgrade:

```bash
cd tests
go get github.com/testcontainers/testcontainers-go@v0.35.0
go mod tidy
```

Then in the root module:

```bash
go get github.com/testcontainers/testcontainers-go@v0.35.0
go mod tidy
```
