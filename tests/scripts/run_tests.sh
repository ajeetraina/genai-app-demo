#!/bin/bash

# Script to run integration tests

set -e

cd "$(dirname "$0")/../"

# Ensure dependencies are installed
go mod tidy
echo "Installing Playwright dependencies..."
go run github.com/playwright-community/playwright-go/cmd/playwright install --with-deps

# Parse arguments
RUN_MODE="all"
if [ "$1" == "short" ]; then
  RUN_MODE="short"
elif [ "$1" == "api" ]; then
  RUN_MODE="api"
elif [ "$1" == "frontend" ]; then
  RUN_MODE="frontend"
elif [ "$1" == "quality" ]; then
  RUN_MODE="quality"
elif [ "$1" == "performance" ]; then
  RUN_MODE="performance"
elif [ "$1" == "compose" ]; then
  RUN_MODE="compose"
fi

# Run tests based on mode
if [ "$RUN_MODE" == "short" ]; then
  echo "Running tests in short mode..."
  go test -v ./integration -short
elif [ "$RUN_MODE" == "api" ]; then
  echo "Running API tests..."
  go test -v ./integration -run TestGenAIAppIntegration
elif [ "$RUN_MODE" == "frontend" ]; then
  echo "Running frontend tests..."
  go test -v ./integration -run TestFrontendIntegration
elif [ "$RUN_MODE" == "quality" ]; then
  echo "Running quality tests..."
  go test -v ./integration -run TestGenAIQuality
elif [ "$RUN_MODE" == "performance" ]; then
  echo "Running performance tests..."
  go test -v ./integration -run TestGenAIPerformance
elif [ "$RUN_MODE" == "compose" ]; then
  echo "Running tests using docker-compose..."
  export USE_DOCKER_COMPOSE=true
  go test -v ./integration -run TestWithDockerCompose
else
  echo "Running all tests..."
  go test -v ./integration
fi

# Clean up
echo "Cleaning up test resources..."
docker network prune -f --filter "name=genai-*" || true
docker container prune -f --filter "name=test-*" || true

echo "Tests completed!"
