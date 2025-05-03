#!/bin/bash

# Default values
MODEL_PATH=${MODEL_PATH:-"/app/models/llama3.2-1b-q8_0.gguf"}
MODEL_URL=${MODEL_URL:-""}
CONTEXT_SIZE=${CONTEXT_SIZE:-2048}
THREADS=${THREADS:-4}
HOST=${HOST:-"0.0.0.0"}
PORT=${PORT:-8080}
CHAT_TEMPLATE=${CHAT_TEMPLATE:-"llama-3.2"}

# Log configuration
echo "Starting llama.cpp server with configuration:"
echo "MODEL_PATH: $MODEL_PATH"
echo "CONTEXT_SIZE: $CONTEXT_SIZE"
echo "THREADS: $THREADS"
echo "HOST: $HOST"
echo "PORT: $PORT"
echo "CHAT_TEMPLATE: $CHAT_TEMPLATE"

# Download model if a URL is provided and model doesn't exist
if [ -n "$MODEL_URL" ] && [ ! -f "$MODEL_PATH" ]; then
    echo "Downloading model from $MODEL_URL to $MODEL_PATH"
    mkdir -p $(dirname "$MODEL_PATH")
    curl -L "$MODEL_URL" -o "$MODEL_PATH"
    if [ $? -ne 0 ]; then
        echo "Failed to download model"
        exit 1
    fi
fi

# Check if model exists
if [ ! -f "$MODEL_PATH" ]; then
    echo "Model file not found at $MODEL_PATH"
    echo "Please provide a valid model file or MODEL_URL"
    exit 1
fi

# Run the server
exec /app/server \
    --model "$MODEL_PATH" \
    --ctx-size "$CONTEXT_SIZE" \
    --threads "$THREADS" \
    --host "$HOST" \
    --port "$PORT" \
    --chat-template "$CHAT_TEMPLATE" \
    --n-gpu-layers 0 \
    --embedding \
    --verbosity 1 \
    --format openai
