.PHONY: setup test test-short test-api test-quality test-performance test-mock clean

# Default test timeout
TIMEOUT ?= 10m

# Run all tests with testcontainers
test:
	go test -v ./integration -timeout $(TIMEOUT)

# Run tests in short mode (skips long-running tests)
test-short:
	go test -v ./integration -short -timeout 2m

# Run only API tests
test-api:
	go test -v ./integration -run TestGenAIAppIntegration -timeout $(TIMEOUT)

# Run only quality tests
test-quality:
	go test -v ./integration -run TestLLMResponseQuality -timeout $(TIMEOUT)

# Run only performance tests
test-performance:
	go test -v ./integration -run TestLLMPerformance -timeout $(TIMEOUT)

# Run only conversation tests
test-conversation:
	go test -v ./integration -run TestMultiTurnConversation -timeout $(TIMEOUT)

# Run mock tests (fast, for CI)
test-mock:
	go test -v ./integration -run TestWithMocks -short -timeout 1m

# Setup dependencies
setup:
	go get github.com/testcontainers/testcontainers-go
	go get github.com/stretchr/testify/assert
	go get github.com/stretchr/testify/require
	go get github.com/docker/go-connections/nat

# Clean up any orphaned containers
clean:
	docker ps -a | grep 'testcontainers' | awk '{print $$1}' | xargs -r docker rm -f
	docker network ls | grep 'genai-test-network' | awk '{print $$1}' | xargs -r docker network rm

# Run tests with Docker Compose instead of Testcontainers
test-compose:
	USE_DOCKER_COMPOSE=true docker-compose -f docker-compose.test.yml up --build -d
	sleep 10 # Wait for services to start
	go test -v ./integration -run TestDockerIntegration
	docker-compose -f docker-compose.test.yml down