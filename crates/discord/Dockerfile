# Minimal runtime image with glibc and SSL certs
FROM gcr.io/distroless/cc-debian12:latest

# TARGETARCH is set by buildx (amd64 or arm64)
ARG TARGETARCH

# Copy pre-built binary for this architecture
COPY linux/${TARGETARCH}/wowlab-discord /wowlab-discord

ENTRYPOINT ["/wowlab-discord"]
