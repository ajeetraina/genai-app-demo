# syntax=docker/dockerfile:1

FROM ubuntu:22.04 AS builder

# Install build dependencies
RUN apt-get update && apt-get install -y \
    git \
    build-essential \
    cmake \
    python3 \
    python3-pip \
    curl \
    wget \
    libopenblas-dev \
    && rm -rf /var/lib/apt/lists/*

# Clone the llama.cpp repository
WORKDIR /app
RUN git clone --depth 1 https://github.com/ggml-org/llama.cpp.git
WORKDIR /app/llama.cpp

# Build llama.cpp
RUN mkdir build && cd build && \
    cmake .. -DGGML_OPENBLAS=ON && \
    cmake --build . --config Release -j4

# Create runtime image
FROM ubuntu:22.04 AS runtime

RUN apt-get update && apt-get install -y \
    libopenblas-base \
    python3 \
    python3-pip \
    curl \
    wget \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy binary and necessary files from builder
COPY --from=builder /app/llama.cpp/build/bin/main /app/llama
COPY --from=builder /app/llama.cpp/build/bin/server /app/server

# Copy chat templates
COPY --from=builder /app/llama.cpp/examples/chat-templates/ /app/chat-templates/

# Create model directory
RUN mkdir -p /app/models

# Add server script
COPY ./server.sh /app/server.sh
RUN chmod +x /app/server.sh

# Expose port for the server
EXPOSE 8080

# Default command to run the server
ENTRYPOINT ["/app/server.sh"]
