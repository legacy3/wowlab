FROM centrifugo/centrifugo:v6

COPY config.json /centrifugo/config.json

EXPOSE 8000

CMD ["centrifugo", "-c", "config.json"]
