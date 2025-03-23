#!/bin/bash
# Script to run the GenAI integration tests with Testcontainers

# Display header
echo "=========================================================="
echo "Running GenAI Integration Tests with Testcontainers"
echo "=========================================================="

# Check if Docker is running
docker info > /dev/null 2>&1
if [ $? -ne 0 ]; then
  echo "Error: Docker is not running or not accessible."
  echo "Please start Docker and try again."
  exit 1
fi

# Check if model runner is reachable
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:12434/models)
if [ "$response" != "200" ]; then
  echo "Warning: Model runner doesn't appear to be running at localhost:12434."
  echo "The tests may fail if the service is not accessible from Docker containers."
  read -p "Do you want to continue anyway? (y/n): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# Run the tests
echo "Downloading dependencies..."
go mod download && go mod tidy

echo "\nRunning integration tests..."
cd tests/
go mod download && go mod tidy

# Determine if we should run in short mode
if [ "$1" == "--short" ]; then
  echo "Running in short mode (skipping resource-intensive tests)..."
  go test -v ./integration -short
else
  echo "Running all tests (use --short to skip resource-intensive tests)..."
  go test -v ./integration
fi

test_status=$?

echo "\n=========================================================="
if [ $test_status -eq 0 ]; then
  echo "✅ All tests completed successfully!"
else
  echo "❌ Some tests failed. See logs above for details."
fi
echo "=========================================================="
