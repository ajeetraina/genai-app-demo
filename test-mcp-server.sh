#!/bin/bash
# test-mcp-server.sh - Test MCP server connectivity

echo "🧪 Testing MCP server connectivity..."

# Test TCP connection
if nc -z localhost 8811; then
    echo "✅ MCP server is accepting connections on port 8811"
else
    echo "❌ MCP server is not responding on port 8811"
    exit 1
fi

echo "📡 Testing MCP protocol..."

# Send a basic MCP request
cat << 'JSON' | nc localhost 8811
{"jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {}}
JSON

echo "🎯 MCP test completed"
