#!/bin/bash

# Script to run the Full Application Stack integration test with Docker Model Runner
# Author: Test Team
# Created: March 2025

echo "======================================================================"
echo "   Testing Full Application Stack with Docker Model Runner            "
echo "======================================================================"
echo ""
echo "This test demonstrates the complete integration from frontend to Model Runner"
echo "It will:"
echo "  1. Create a Socat container to connect to Model Runner"
echo "  2. Start the backend application configured to use Model Runner"
echo "  3. Send chat requests through the backend to the model"
echo "  4. Verify the entire flow works end-to-end"
echo ""
echo "Prerequisites:"
echo "  - Docker Desktop with Model Runner enabled"
echo "  - Host-side TCP support enabled (port 12434)"
echo "  - Llama3.2 model pulled (ignaciolopezluna020/llama3.2:1B)"
echo "  - Required Go dependencies installed"
echo ""

# Navigate to the tests directory
cd "$(dirname "$0")" || { echo "Failed to change to script directory"; exit 1; }

# Check dependencies
echo "Checking dependencies..."
dependencies=("github.com/openai/openai-go" "github.com/openai/openai-go/option" "github.com/testcontainers/testcontainers-go")
missing_deps=false

for dep in "${dependencies[@]}"; do
  if ! go list -m $dep >/dev/null 2>&1; then
    echo "⚠️  Missing dependency: $dep"
    missing_deps=true
  fi
done

if [ "$missing_deps" = true ]; then
  echo ""
  echo "Installing missing dependencies..."
  cd ..
  go get github.com/openai/openai-go
  go get github.com/openai/openai-go/option
  go get github.com/testcontainers/testcontainers-go@v0.27.0
  go mod tidy
  cd - >/dev/null
  echo "✅ Dependencies installed"
fi

# Check Docker Model Runner availability
echo "Checking Docker Model Runner availability..."
if ! docker model ls >/dev/null 2>&1; then
  echo "⚠️  Warning: Docker Model Runner command not found."
  echo "    Please ensure Docker Desktop is running with Model Runner enabled."
  echo "    Test will continue but may fail if Model Runner isn't available."
fi

# Check if the model is already pulled
echo "Checking for required model..."
if docker model ls | grep -q "ignaciolopezluna020/llama3.2:1B"; then
  echo "✅ Model ignaciolopezluna020/llama3.2:1B is already available"
else
  echo "⚠️  Model ignaciolopezluna020/llama3.2:1B not found locally."
  echo "   Test will attempt to pull it if needed."
fi

echo ""
echo "Starting test now..."
echo "======================================================================"
# Run the test with verbose output and generous timeout
go test -v -timeout 3m -run TestFullAppWithModelRunner ./integration

# Check the exit code
if [ $? -eq 0 ]; then
  echo ""
  echo "======================================================================"
  echo "✅ Test PASSED: Successfully tested full application stack with Docker Model Runner"
  echo "======================================================================"
else
  echo ""
  echo "======================================================================"
  echo "❌ Test FAILED: See error details above"
  echo "======================================================================"
fi

# Clean up any leftover containers
echo "Cleaning up any test containers..."
docker ps -a | grep 'testcontainers' | awk '{print $1}' | xargs -r docker rm -f >/dev/null 2>&1

# Clean up any orphaned processes
echo "Cleaning up any orphaned processes..."
pkill -f "go run ../../main.go" >/dev/null 2>&1
