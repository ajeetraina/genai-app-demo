# GenAI App Demo - Fix Instructions

This document provides instructions to fix the observability and networking issues in the GenAI App Demo.

## Issues Fixed

1. Missing Grafana provisioning directories and configuration files
2. Prometheus scraping configuration using incorrect container networking
3. Docker networking issues for Model Runner connection

## How to Apply the Fix

1. Pull the updated code:
   ```bash
   git fetch origin fix-observability-issues
   git checkout fix-observability-issues
   ```

2. Make sure you have the required model:
   ```bash
   docker model pull ai/llama3.2:1B-Q8_0
   ```

3. Stop any running containers and remove volumes:
   ```bash
   docker compose down -v
   ```

4. Start the application with the fixed configuration:
   ```bash
   docker compose up -d --build
   ```

5. Verify all services are running:
   ```bash
   docker compose ps
   ```

## Verifying the Fix

1. Access the frontend at [http://localhost:3000](http://localhost:3000)
2. Test a simple chat interaction to verify connectivity to the LLM
3. Access Grafana at [http://localhost:3001](http://localhost:3001) (login with admin/admin)
4. In Grafana, verify that the Prometheus data source is connected
5. Check Prometheus metrics at [http://localhost:9091](http://localhost:9091)

## Troubleshooting

If you still encounter issues:

1. Check container logs:
   ```bash
   docker compose logs
   ```

2. Verify network connectivity between containers:
   ```bash
   docker compose exec backend ping prometheus
   docker compose exec backend ping model-runner.docker.internal
   ```

3. Make sure your Docker host resolving is working properly:
   ```bash
   docker compose exec backend curl -I http://model-runner.docker.internal/engines/llama.cpp/v1/health
   ```

4. Verify that Grafana can connect to Prometheus:
   - Go to Grafana > Configuration > Data Sources
   - Check the Prometheus data source status

5. Look for specific errors in the container logs:
   ```bash
   docker compose logs grafana
   docker compose logs prometheus
   docker compose logs backend
   ```
