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

1. **llama.cpp Metrics Exporter**: A standalone Go service that collects metrics from the llama.cpp API and exposes them in Prometheus format
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

- `LLAMACPP_BASE_URL`: URL for the llama.cpp API (default: `http://model-runner.docker.internal/engines/llama.cpp/v1`)
- `LLAMACPP_MODEL`: Model name for labeling metrics (default: from `LLM_MODEL_NAME` or `ai/llama3.2:1B-Q8_0`)
- `LLAMACPP_EXPORTER_ADDR`: Address to expose metrics on (default: `:9100`)
- `LLAMACPP_SCRAPE_INTERVAL`: Interval between metrics scrapes (default: `5s`)
- `LLAMACPP_CLIENT_TIMEOUT`: HTTP client timeout (default: `3s`)

### Docker Compose

The `compose.yaml` file includes the llama.cpp exporter service, which is configured to start automatically with the rest of the stack.

### Prometheus

Prometheus is configured to scrape metrics from the llama.cpp exporter on the `/metrics` endpoint.

### Grafana

A preconfigured Grafana dashboard is provided to visualize llama.cpp metrics. It can be accessed at http://localhost:3001 (default credentials: admin/admin).

## Troubleshooting

If metrics are not appearing:

1. Check if the exporter is running: `docker compose ps | grep llamacpp-exporter`
2. Check the exporter logs: `docker compose logs llamacpp-exporter`
3. Verify connectivity to llama.cpp: `curl http://model-runner.docker.internal/engines/llama.cpp/v1/stats`
4. Verify the exporter is exposing metrics: `curl http://localhost:9100/metrics`
5. Check Prometheus targets page: http://localhost:9091/targets

## Extending the Solution

To add more metrics or customize the existing ones:

1. Modify the `pkg/llamacpp/metrics.go` file
2. Update the exporter to collect the new metrics
3. Update the Grafana dashboard to visualize the new metrics

## Limitations

- The metrics collection depends on the llama.cpp API being accessible
- Some metrics may not be available depending on the version of llama.cpp
- GPU metrics are only available when running with GPU support