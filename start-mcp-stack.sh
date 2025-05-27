#!/bin/bash
# start-mcp-stack.sh - Start your GenAI stack with MCP integration

echo "🚀 Starting GenAI Model Runner with MCP integration..."

# Start your existing stack plus MCP
docker-compose -f docker-compose.yml -f docker-compose.mcp-override.yml up -d

echo "⏳ Waiting for services to be ready..."
sleep 10

# Health checks
echo "🔍 Checking service health..."

services=("prometheus:9090" "grafana:3001" "localhost:8811")
for service in "${services[@]}"; do
    if curl -s "http://$service/health" > /dev/null 2>&1 || nc -z ${service/:/ } > /dev/null 2>&1; then
        echo "✅ $service is healthy"
    else
        echo "❌ $service is not responding"
    fi
done

echo "📊 Access your services:"
echo "  - Grafana: http://localhost:3001"
echo "  - Prometheus: http://localhost:9090"
echo "  - MCP Server: tcp://localhost:8811"
echo "  - Claude Desktop: Use the MCP configuration to connect"

echo "🎉 Setup complete! Your GenAI stack with MCP integration is running."
