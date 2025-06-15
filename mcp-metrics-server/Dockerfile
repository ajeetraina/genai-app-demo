FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY src/ ./src/
COPY tsconfig.json ./

# Build TypeScript
RUN npm run build

# Install socat for TCP server functionality
RUN apk add --no-cache socat netcat-openbsd

# Create startup script
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'node dist/index.js | socat STDIO TCP-LISTEN:$MCP_PORT,reuseaddr,fork' >> /app/start.sh && \
    chmod +x /app/start.sh

EXPOSE 8811

CMD ["/app/start.sh"]
