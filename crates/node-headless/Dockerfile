# Minimal runtime image with glibc and SSL certs
FROM gcr.io/distroless/cc-debian12:latest

# Copy pre-built binary from CI
COPY node-headless /node-headless

# Run with --no-update since container images are immutable
ENTRYPOINT ["/node-headless", "--no-update"]
