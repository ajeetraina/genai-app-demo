FROM alpine:latest

RUN apk add --no-cache socat

# Create a simple script that bridges stdio to TCP
RUN echo '#!/bin/sh' > /bridge.sh && \
    echo 'exec socat STDIO TCP:$TARGET_HOST:$TARGET_PORT' >> /bridge.sh && \
    chmod +x /bridge.sh

CMD ["/bridge.sh"]
