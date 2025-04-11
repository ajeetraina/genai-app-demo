# Using Docker Compose with Model Runner

This branch integrates Docker's Model Runner directly within the Compose setup, providing a seamless environment for running and testing Large Language Models (LLMs) locally.

## What's Changed

1. **Model Runner Service**: Added a dedicated `model-runner` service to the Compose file that uses Docker's new model provider.

2. **Backend Connection**: Updated the backend configuration to connect directly to the model-runner service through Docker's internal networking.

3. **Environment Configuration**: Modified `backend.env` to point to the Model Runner service through Docker's network.

## How to Use

1. **Prerequisites**: 
   - Docker Desktop (with Model feature enabled)
   - Docker Compose

2. **Pull the Model**:
   ```bash
   docker model pull ai/llama3.2:1B-Q8_0
   ```

3. **Start the Application**:
   ```bash
   docker compose up -d
   ```

4. **Verify Model Runner Integration**:
   - Check container logs to confirm successful connection
   ```bash
   docker compose logs backend
   ```

## Environment Variables

You can customize the model used by changing the `LLM_MODEL_NAME` environment variable when starting Compose:

```bash
LLM_MODEL_NAME=ai/gemma3:4B-F16 docker compose up -d
```

## Architecture

With this integration, the application architecture is simplified:

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │ >>> │   Backend   │ >>> │ Model Runner│
│  (React/TS) │     │    (Go)     │     │ (Llama 3.2) │
└─────────────┘     └─────────────┘     └─────────────┘
      :3000              :8080               :12434
```

The Model Runner is now contained within the same network and managed through Compose, eliminating the need for external configuration or separate model server setup.

## Troubleshooting

If you encounter issues with the Model Runner:

1. Check that the model is correctly pulled:
   ```bash
   docker model ls
   ```

2. Verify network connectivity between containers:
   ```bash
   docker compose exec backend ping model-runner
   ```

3. Check the logs for the model-runner container:
   ```bash
   docker compose logs model-runner
   ```
