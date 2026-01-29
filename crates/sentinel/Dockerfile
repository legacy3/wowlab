FROM gcr.io/distroless/cc-debian13:nonroot

ARG TARGETARCH
COPY linux/${TARGETARCH}/wowlab-sentinel /wowlab-sentinel

ENTRYPOINT ["/wowlab-sentinel"]
