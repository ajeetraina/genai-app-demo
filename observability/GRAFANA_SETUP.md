# Grafana Setup Guide for GenAI App Monitoring

This guide explains how to set up Grafana dashboards to monitor your GenAI application.

## Prerequisites

- Your GenAI application is running with the observability components
- Prometheus is correctly scraping metrics from your application
- Grafana is running and accessible at http://localhost:3001

## Initial Grafana Setup

1. Access Grafana at http://localhost:3001
2. Log in with the default credentials:
   - Username: `admin`
   - Password: `admin`
3. You'll be prompted to change the password (optional but recommended)

## Configure Prometheus Data Source

1. In Grafana, go to Configuration (gear icon) > Data Sources
2. Click "Add data source"
3. Select "Prometheus"
4. Set the following configuration:
   - Name: `Prometheus`
   - URL: `http://prometheus:9090` (important: use the Docker service name, not localhost)
   - Access: `Server (default)`
   - Other settings can remain at their defaults
5. Click "Save & Test" at the bottom of the page
6. You should see a green "Data source is working" message

## Creating a GenAI Monitoring Dashboard

### Create a New Dashboard

1. Click on "+" in the left sidebar
2. Select "Create Dashboard"
3. Click "Add visualization"

### Add Request Rate Panel

1. Select the Prometheus data source
2. Enter this query: `sum(rate(genai_app_http_requests_total[5m])) by (endpoint)`
3. In the Panel options tab:
   - Title: "Request Rate by Endpoint"
   - Description: "Number of requests per second by endpoint"
4. Click "Apply"

### Add Response Status Panel

1. Click "Add panel" at the top
2. Select "Add visualization"
3. Select the Prometheus data source
4. Enter this query: `sum(rate(genai_app_http_requests_total[5m])) by (status)`
5. Set Panel options:
   - Title: "Response Status Codes"
   - Description: "Rate of HTTP status codes"
6. Click "Apply"

### Add Token Usage Panel

1. Click "Add panel" again
2. Enter this query: `sum(rate(genai_app_chat_tokens_total[5m])) by (direction, model)`
3. Set Panel options:
   - Title: "Token Usage Rate"
   - Description: "Input vs Output token usage per second"
4. Click "Apply"

### Add Model Latency Panel

1. Click "Add panel"
2. Enter this query: `histogram_quantile(0.95, sum(rate(genai_app_model_latency_seconds_bucket[5m])) by (le, model))`
3. Set Panel options:
   - Title: "Model Response Time (p95)"
   - Description: "95th percentile of model inference time"
   - In the right panel, under "Standard options" set Unit to "seconds (s)"
4. Click "Apply"

### Add Active Requests Gauge

1. Click "Add panel"
2. Enter this query: `genai_app_active_requests`
3. Change the visualization type to "Gauge" (top right of query editor)
4. Set Panel options:
   - Title: "Active Requests"
   - Description: "Number of requests currently being processed"
5. Under "Gauge" options, set appropriate thresholds (e.g., green 0-5, orange 5-10, red >10)
6. Click "Apply"

### Save the Dashboard

1. Click the save icon (disk) at the top of the dashboard
2. Enter a name like "GenAI Application Metrics"
3. Click "Save"

## Viewing and Interpreting the Dashboard

### Time Range Selection

- Use the time picker in the top right corner to select different time ranges
- For initial testing, "Last 15 minutes" or "Last 1 hour" is recommended
- Set the refresh rate to "5s" for real-time monitoring

### Generating Metrics

To see data in your dashboard:

1. Open your GenAI application at http://localhost:3000
2. Send several chat messages to generate metrics
3. Return to Grafana to see the metrics update

### Key Metrics to Monitor

- **Request Rate**: Shows application load and usage patterns
- **Response Status**: Helps identify errors or failed requests
- **Token Usage**: Useful for monitoring usage and potential costs
- **Model Latency**: Critical for user experience and performance optimization
- **Active Requests**: Indicates current load on your system

## Troubleshooting

### No Data Appearing

If you don't see data in your panels:

1. Verify Prometheus is scraping correctly:
   - Go to http://localhost:9091/targets and check that your targets are "UP"
   - Check http://localhost:9091/graph and query for `genai_app_http_requests_total`

2. Check the Grafana data source connection:
   - Go to Data Sources and test the Prometheus connection
   - Ensure the URL is `http://prometheus:9090` (not localhost)

3. Adjust the time range:
   - Make sure you're looking at a time period when the application was active
   - Try extending the range to "Last 6 hours"

4. Generate more traffic:
   - Use the application to send more requests
   - Check if metrics appear after a few minutes

### Query Errors

If you see error messages in the query editor:

1. Verify the metric names are correct (check in Prometheus first)
2. Try simpler queries first (e.g., just the metric name without any functions)
3. Make sure the syntax is correct (parentheses matching, etc.)

## Advanced Configuration

### Setting Up Alerts

1. Hover over any panel and click the three dots menu
2. Select "Edit"
3. Click the "Alert" tab
4. Click "Create alert rule from this panel"
5. Configure conditions and notification channels

### Adding Dashboard Variables

To make your dashboard more flexible:

1. Click the gear icon at the top of the dashboard
2. Select "Variables"
3. Click "Add variable"
4. Create variables for things like endpoints, status codes, etc.

### Organizing with Rows

1. Click "Add panel"
2. Select "Add new row"
3. Group related panels under specific rows
4. Rows can be collapsed to focus on specific metrics
