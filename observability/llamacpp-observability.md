# llama.cpp Observability Solution

This document explains the observability solution implemented for llama.cpp when used with Docker Model Runner.

## Overview

The llama.cpp observability solution provides comprehensive monitoring of the llama.cpp inference engine, which is used by Docker Model Runner to execute and serve LLM models. This solution allows you to:

- Monitor key performance metrics of llama.cpp
- Track resource utilization
- Identify performance bottlenecks
- Optimize model inference

## Architecture

The observability solution consists of the following components:

1. **llama.cpp Metrics Exporter**: A standalone service that collects metrics from the llama.cpp API and exposes them in Prometheus format
2. **Prometheus**: Collects and stores the metrics
3. **Grafana Dashboard**: Visualizes the metrics in a comprehensive dashboard

```
???????????????     ???????????????     ???????????????
?  llama.cpp  ? --> ?   Metrics   ? --> ?  Prometheus ?
?  (Docker    ?     ?   Exporter  ?     ?             ?
? Model Runner?     ?             ?     ?             ?
???????????????     ???????????????     ???????????????
       |                                       |
       |                                       v
       |                               ???????????????
       ?-----------------------------> ?   Grafana   ?
                                      ?  Dashboard   ?
                                      ???????????????
```

## Metrics Collected

The following metrics are collected from llama.cpp:

### Performance Metrics
- `llamacpp_tokens_per_second`: Token generation speed
- `llamacpp_batch_latency_seconds`: Batch processing latency
- `llamacpp_first_token_latency_seconds`: Time to first token

### Resource Utilization
- `llamacpp_memory_usage_bytes`: Memory usage
- `llamacpp_total_memory_bytes`: Total available memory
- `llamacpp_cpu_utilization_percent`: CPU utilization
- `llamacpp_gpu_utilization_percent`: GPU utilization (if available)
- `llamacpp_temperature_celsius`: GPU temperature (if available)

### Model Metrics
- `llamacpp_model_size_bytes`: Model size in bytes
- `llamacpp_model_parameters`: Number of model parameters
- `llamacpp_context_size_tokens`: Current context size
- `llamacpp_max_context_size_tokens`: Maximum context size

### KV Cache Metrics
- `llamacpp_kv_cache_usage_bytes`: KV cache memory usage
- `llamacpp_kv_cache_limit_bytes`: KV cache memory limit

### System Metrics
- `llamacpp_thread_count`: Number of threads used
- `llamacpp_status`: Current status (idle, loading, running)
- `llamacpp_batch_size`: Current batch size
- `llamacpp_optimal_batch_size`: Optimal batch size

## Setup and Configuration

The llama.cpp exporter and observability solution are automatically configured in the Docker Compose setup. Here are the key configuration points:

### Environment Variables

The following environment variables can be used to configure the exporter:

- `LLAMACPP_MODEL`: Model name for labeling metrics (default from `LLM_MODEL_NAME` or `ai/llama3.2:1B-Q8_0`)
- `PORT`: Optional port number for the exporter (default: `9100`)

### Docker Compose

The `compose.yaml` file includes the llama.cpp exporter service, which is configured to start automatically with the rest of the stack.

### Prometheus

Prometheus is configured to scrape metrics from the llama.cpp exporter on the `/metrics` endpoint.

### Grafana

A preconfigured Grafana dashboard is provided to visualize llama.cpp metrics. It can be accessed at http://localhost:3001 (default credentials: admin/admin).

## Testing

The observability solution can be tested with:

```bash
# Build the exporter
docker build -f llamacpp-exporter-simple.Dockerfile -t llamacpp-exporter-simple .

# Start the services
docker compose up -d

# Check metrics directly
curl http://localhost:9100/metrics

# View in Prometheus
open http://localhost:9091

# View in Grafana
open http://localhost:3001
```

## Troubleshooting

If metrics are not appearing:

1. Check if the exporter is running: `docker compose ps | grep llamacpp-exporter`
2. Check the exporter logs: `docker compose logs llamacpp-exporter`
3. Verify the exporter is exposing metrics: `curl http://localhost:9100/metrics`
4. Check Prometheus targets page: http://localhost:9091/targets

## Limitations

- The current implementation uses a simplified exporter that generates mock metrics
- The metrics format matches the design for real llama.cpp metrics
- This simplified version allows testing the full observability infrastructure