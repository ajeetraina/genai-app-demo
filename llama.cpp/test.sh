#!/bin/bash

# Simple script to test the llama.cpp integration

echo "🧪 Testing llama.cpp integration for genai-app-demo"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "❌ Docker is not running. Please start Docker and try again."
  exit 1
fi

# Check if the llama-compose.yaml file exists
if [ ! -f "llama-compose.yaml" ]; then
  echo "❌ llama-compose.yaml not found. Please make sure you're in the project root directory."
  exit 1
fi

echo "🚀 Starting services with llama.cpp..."
docker compose -f llama-compose.yaml up -d

# Wait for services to start
echo "⏳ Waiting for services to start up (this may take a few minutes for the first run)..."
sleep 15

# Check if llama-cpp service is healthy
echo "🔍 Checking llama-cpp service..."
if [ "$(docker compose -f llama-compose.yaml ps -q llama-cpp)" ]; then
  if [ "$(docker inspect --format='{{.State.Health.Status}}' $(docker compose -f llama-compose.yaml ps -q llama-cpp))" = "healthy" ]; then
    echo "✅ llama-cpp service is running and healthy."
  else
    echo "⚠️ llama-cpp service is running but not yet healthy. It may still be downloading the model."
    echo "   You can check the status with: docker compose -f llama-compose.yaml ps"
  fi
else
  echo "❌ llama-cpp service failed to start."
  echo "   Check the logs with: docker compose -f llama-compose.yaml logs llama-cpp"
  exit 1
fi

# Check if backend service is healthy
echo "🔍 Checking backend service..."
if [ "$(docker compose -f llama-compose.yaml ps -q backend)" ]; then
  if [ "$(docker inspect --format='{{.State.Health.Status}}' $(docker compose -f llama-compose.yaml ps -q backend))" = "healthy" ]; then
    echo "✅ backend service is running and healthy."
  else
    echo "⚠️ backend service is running but not yet healthy."
    echo "   Check the logs with: docker compose -f llama-compose.yaml logs backend"
  fi
else
  echo "❌ backend service failed to start."
  exit 1
fi

# Test the API endpoint
echo "🔍 Testing API endpoint..."
BACKEND_URL="http://localhost:8080/health"
RESPONSE=$(curl -s $BACKEND_URL)

if [ $? -eq 0 ] && [ "$(echo $RESPONSE | grep -c "ok")" -gt 0 ]; then
  echo "✅ API test successful!"
  echo "🎉 llama.cpp integration is working properly."
  echo ""
  echo "📊 You can now access:"
  echo "   - Frontend: http://localhost:3000"
  echo "   - Grafana: http://localhost:3001 (admin/admin)"
  echo "   - Jaeger UI: http://localhost:16686"
  echo "   - Prometheus: http://localhost:9091"
else
  echo "❌ API test failed. Response: $RESPONSE"
  echo "   Check the logs with: docker compose -f llama-compose.yaml logs"
  exit 1
fi

exit 0
