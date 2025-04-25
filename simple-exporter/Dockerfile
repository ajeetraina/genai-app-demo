FROM golang:1.23.4 AS builder
WORKDIR /app
COPY simple-exporter/main.go .
RUN go build -o /bin/llamacpp-exporter main.go

FROM alpine:latest
RUN apk --no-cache add ca-certificates tzdata
COPY --from=builder /bin/llamacpp-exporter /bin/llamacpp-exporter
EXPOSE 9100
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -q -O- http://localhost:9100/metrics || exit 1
CMD ["/bin/llamacpp-exporter"]