# GenAI Model Runner MCP Integration

## Overview

This directory contains the Model Context Protocol (MCP) integration for the GenAI Model Runner metrics project. MCP enables AI-powered monitoring and analysis through Claude Desktop.

## Features

- **Real-time Performance Metrics**: Monitor model latency, throughput, and resource usage
- **AI-Powered Health Analysis**: Get intelligent insights about model health
- **Custom Prometheus Queries**: Execute and analyze PromQL queries through Claude
- **Automated Recommendations**: Receive optimization suggestions for performance and resources

## Quick Start

1. **Build the MCP server**:
   ```bash
   cd mcp-metrics-server
   npm install
   npm run build
   ```

2. **Start the integrated stack**:
   ```bash
   ./start-mcp-stack.sh
   ```

3. **Configure Claude Desktop**:
   Add to your Claude Desktop config:
   ```json
   {
     "mcpServers": {
       "genai-metrics": {
         "command": "docker",
         "args": [
           "run", "-i", "--rm", "--network=host",
           "alpine/socat", "STDIO", "TCP:localhost:8811"
         ]
       }
     }
   }
   ```

4. **Test the connection**:
   ```bash
   ./test-mcp-server.sh
   ```

## Available MCP Tools

### get_model_performance
Monitor real-time model performance metrics.

**Example**: "Show me the current model performance for the last 15 minutes"

### analyze_model_health
Get AI-powered health analysis with recommendations.

**Example**: "Analyze my model health and suggest optimizations"

### get_prometheus_query
Execute custom Prometheus queries.

**Example**: "Run this query: rate(http_requests_total[5m]) and explain the results"

## Architecture

```
Claude Desktop ←→ Socat Bridge ←→ MCP Server ←→ Prometheus/Grafana
```

## Support

For issues or questions about MCP integration:
1. Check the troubleshooting section in the main README
2. Review Docker logs: `docker logs genai-mcp-metrics`
3. Test connectivity: `./test-mcp-server.sh`
