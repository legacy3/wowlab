FROM centrifugo/centrifugo:v6

COPY config.json /centrifugo/config.json
COPY --chmod=755 entrypoint.sh /entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["/entrypoint.sh"]
