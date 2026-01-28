FROM ubuntu:24.04

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# TARGETARCH is set by buildx (amd64 or arm64)
ARG TARGETARCH

# Copy pre-built binary for this architecture
COPY linux/${TARGETARCH}/wowlab-sentinel /wowlab-sentinel

ENTRYPOINT ["/wowlab-sentinel"]
