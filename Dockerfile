# syntax=docker/dockerfile:1

ARG GO_VERSION=1.23.4
FROM --platform=$BUILDPLATFORM golang:${GO_VERSION} AS backend-build
WORKDIR /src

# Download dependencies as a separate step to take advantage of Docker's caching.
RUN --mount=type=cache,target=/go/pkg/mod/ \
    --mount=type=bind,source=go.sum,target=go.sum \
    --mount=type=bind,source=go.mod,target=go.mod \
    go mod download -x

ARG TARGETARCH

# Copy source code and RAG package
COPY . .

# Create upload directory for documents
RUN mkdir -p /data/uploads

RUN --mount=type=cache,target=/go/pkg/mod/ \
    --mount=type=bind,target=. \
    CGO_ENABLED=0 GOARCH=$TARGETARCH go build -o /bin/server .

###############################################################################
# Create a new stage for running the backend
FROM alpine:latest AS backend

RUN --mount=type=cache,target=/var/cache/apk \
    apk --update add \
        ca-certificates \
        tzdata \
        && \
        update-ca-certificates

ARG UID=10001
RUN adduser \
    --disabled-password \
    --gecos "" \
    --home "/nonexistent" \
    --shell "/sbin/nologin" \
    --no-create-home \
    --uid "${UID}" \
    appuser
USER appuser

COPY --from=backend-build /bin/server /bin/
# Copy the uploads directory
COPY --from=backend-build /data/uploads /data/uploads

# Environment variables for RAG
ENV UPLOADS_DIR=/data/uploads
ENV VECTOR_DB_URL=http://vectordb:8000

EXPOSE 8080

ENTRYPOINT [ "/bin/server" ]
