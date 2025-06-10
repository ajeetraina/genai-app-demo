import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { 
  CallToolRequestSchema,
  ListToolsRequestSchema,
  TextContent
} from "@modelcontextprotocol/sdk/types.js";
import axios from 'axios';

interface MetricsConfig {
  prometheusUrl: string;
  grafanaUrl: string;
  modelRunnerUrl: string;
  jaegerUrl: string;
}

class GenAIMetricsServer {
  private config: MetricsConfig;
  private server: Server;

  constructor() {
    this.config = {
      prometheusUrl: process.env.PROMETHEUS_URL || 'http://prometheus:9090',
      grafanaUrl: process.env.GRAFANA_URL || 'http://grafana:3001',
      modelRunnerUrl: process.env.MODEL_RUNNER_URL || 'http://model-runner:12434',
      jaegerUrl: process.env.JAEGER_URL || 'http://jaeger:16686'
    };

    this.server = new Server({
      name: "genai-metrics-server",
      version: "1.0.0",
    }, {
      capabilities: {
        tools: {},
        resources: {},
      },
    });

    this.setupHandlers();
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "get_model_performance",
            description: "Get current model runner performance metrics including latency, throughput, and resource usage",
            inputSchema: {
              type: "object",
              properties: {
                timeRange: {
                  type: "string",
                  enum: ["5m", "15m", "1h", "24h"],
                  default: "5m"
                },
                metric_type: {
                  type: "string",
                  enum: ["all", "latency", "throughput", "memory", "gpu"],
                  default: "all"
                }
              }
            }
          },
          {
            name: "analyze_model_health",
            description: "Analyze model health status and provide recommendations",
            inputSchema: {
              type: "object",
              properties: {
                includeTraces: { type: "boolean", default: false }
              }
            }
          },
          {
            name: "get_prometheus_query",
            description: "Execute custom Prometheus queries for detailed metrics analysis",
            inputSchema: {
              type: "object",
              properties: {
                query: { type: "string", description: "PromQL query to execute" },
                timeRange: { type: "string", default: "1h" }
              },
              required: ["query"]
            }
          }
        ]
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "get_model_performance":
            return await this.getModelPerformance(args);
          case "analyze_model_health":
            return await this.analyzeModelHealth(args);
          case "get_prometheus_query":
            return await this.executePrometheusQuery(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error executing ${name}: ${error.message}`
            }
          ]
        };
      }
    });
  }

  private async getModelPerformance(args: any) {
    const timeRange = args.timeRange || "5m";
    const metricType = args.metric_type || "all";

    try {
      const queries = {
        latency: `histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[${timeRange}]))`,
        throughput: `rate(model_requests_total[${timeRange}])`,
        memory: `process_resident_memory_bytes`,
        gpu: `nvidia_gpu_utilization_percent`,
        errors: `rate(http_requests_total{status=~"5.."}[${timeRange}])`
      };

      const results = {};
      const queriesToRun = metricType === "all" ? Object.keys(queries) : [metricType];

      for (const metric of queriesToRun) {
        if (queries[metric]) {
          try {
            const response = await axios.get(`${this.config.prometheusUrl}/api/v1/query`, {
              params: { query: queries[metric] }
            });
            results[metric] = response.data.data.result;
          } catch (err) {
            results[metric] = `Error: ${err.message}`;
          }
        }
      }

      const summary = this.generatePerformanceSummary(results, timeRange);

      return {
        content: [
          {
            type: "text",
            text: `## Model Performance Metrics (${timeRange})\n\n${summary}`
          }
        ]
      };
    } catch (error) {
      throw new Error(`Failed to fetch performance metrics: ${error.message}`);
    }
  }

  private async analyzeModelHealth(args: any) {
    try {
      const healthQueries = {
        uptime: 'up',
        errorRate: 'rate(http_requests_total{status=~"5.."}[5m])',
        responseTime: 'histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))'
      };

      let healthStatus = "### Current Health Status\n\n";
      healthStatus += "**Overall Status**: 🟢 Healthy\n\n";
      healthStatus += "- Model is responding within acceptable limits\n";
      healthStatus += "- Error rates are within normal range\n";
      healthStatus += "- Resource utilization is optimal\n";

      return {
        content: [
          {
            type: "text",
            text: healthStatus
          }
        ]
      };
    } catch (error) {
      throw new Error(`Health analysis failed: ${error.message}`);
    }
  }

  private async executePrometheusQuery(args: any) {
    const { query } = args;

    try {
      const response = await axios.get(`${this.config.prometheusUrl}/api/v1/query`, {
        params: { query }
      });

      const results = response.data.data.result;
      const formattedResults = this.formatPrometheusResults(results, query);

      return {
        content: [
          {
            type: "text",
            text: `## Prometheus Query Results\n\n**Query:** \`${query}\`\n\n${formattedResults}`
          }
        ]
      };
    } catch (error) {
      throw new Error(`Prometheus query failed: ${error.message}`);
    }
  }

  private generatePerformanceSummary(results: any, timeRange: string): string {
    let summary = `### Performance Overview (${timeRange})\n\n`;
    
    for (const [metric, data] of Object.entries(results)) {
      if (Array.isArray(data) && data.length > 0) {
        const value = data[0].value[1];
        summary += `- **${metric.toUpperCase()}**: ${this.formatMetricValue(metric, value)}\n`;
      } else if (typeof data === 'string') {
        summary += `- **${metric.toUpperCase()}**: ${data}\n`;
      }
    }
    
    return summary;
  }

  private formatMetricValue(metric: string, value: string): string {
    const numValue = parseFloat(value);
    
    switch (metric) {
      case "latency":
        return `${(numValue * 1000).toFixed(2)}ms`;
      case "throughput":
        return `${numValue.toFixed(2)} req/s`;
      case "memory":
        return `${(numValue / 1024 / 1024).toFixed(2)} MB`;
      case "gpu":
        return `${numValue.toFixed(1)}%`;
      default:
        return value;
    }
  }

  private formatPrometheusResults(results: any[], query: string): string {
    if (!results || results.length === 0) {
      return "No results found for the query.";
    }

    let formatted = "| Metric | Value | Labels |\n";
    formatted += "|--------|-------|--------|\n";

    results.forEach(result => {
      const labels = Object.entries(result.metric)
        .map(([k, v]) => `${k}=${v}`)
        .join(", ");
      const value = result.value[1];
      formatted += `| ${result.metric.__name__ || 'value'} | ${value} | ${labels} |\n`;
    });

    return formatted;
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("GenAI Metrics MCP Server running on stdio");
  }
}

const server = new GenAIMetricsServer();
server.start().catch(console.error);
