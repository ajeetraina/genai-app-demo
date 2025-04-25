# syntax=docker/dockerfile:1

# Build stage
ARG GO_VERSION=1.23.4
FROM --platform=$BUILDPLATFORM golang:${GO_VERSION} AS builder

WORKDIR /src

# Copy go module files first for better caching
COPY go.mod go.sum ./
RUN --mount=type=cache,target=/go/pkg/mod/ \
    go mod download -x

# Copy source code
COPY . .

# Build the exporter
ARG TARGETARCH
RUN --mount=type=cache,target=/go/pkg/mod/ \
    CGO_ENABLED=0 GOARCH=$TARGETARCH go build -o /bin/llamacpp-exporter ./cmd/llamacpp-exporter

# Final stage
FROM alpine:latest

# Install necessary tools
RUN apk --no-cache add ca-certificates tzdata curl

# Create non-root user
ARG UID=10001
RUN adduser \
    --disabled-password \
    --gecos "" \
    --home "/nonexistent" \
    --shell "/sbin/nologin" \
    --no-create-home \
    --uid "${UID}" \
    appuser

# Copy binary from builder
COPY --from=builder /bin/llamacpp-exporter /bin/

# Switch to non-root user
USER appuser

# Expose the metrics port
EXPOSE 9100

# Set healthcheck
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:9100/metrics || exit 1

# Run the exporter
ENTRYPOINT ["/bin/llamacpp-exporter"]