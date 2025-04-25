FROM golang:1.23.0-alpine

WORKDIR /app
COPY simple-exporter/main.go .

# Make it executable directly
EXPOSE 9100

CMD ["go", "run", "main.go"]