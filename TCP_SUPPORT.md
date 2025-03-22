# TCP Support for Model Runner

This branch adds TCP support for connecting to the Model Runner, allowing the application to connect to the model runner via host.docker.internal:12434 instead of using model-runner.docker.internal.

## Changes

1. Updated `backend.env` to use the TCP connection to the model runner at host.docker.internal:12434
2. Modified `compose.yaml` to add the necessary `extra_hosts` configuration

## Usage

To use this version, make sure you have enabled host-side TCP support in Docker Model Runner on port 12434.

Run the application using the standard command:

```bash
docker compose up -d --build
```

## Benefits of TCP Support

Using TCP support instead of Docker socket communication provides several benefits:

1. **Improved Security**: Reduces the need for direct Docker socket access
2. **Enhanced Flexibility**: Allows the application to connect to the Model Runner from hosts that don't have direct Docker access
3. **Network Simplicity**: Uses standard TCP/IP networking, which is more universally supported
4. **Cross-Host Compatibility**: Enables the application to connect to Model Runners running on different hosts

## Configuration

The key configuration changes in this branch are:

1. In `backend.env`:
   ```
   BASE_URL=http://host.docker.internal:12434/engines/llama.cpp/v1/
   ```

2. In `compose.yaml`:
   ```yaml
   extra_hosts:
     - "host.docker.internal:host-gateway"
   ```

This `extra_hosts` configuration ensures that the Docker container can properly resolve the `host.docker.internal` hostname to the host machine's IP address.
