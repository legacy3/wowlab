//! WebSocket transport layer.

use std::sync::Once;

use futures_util::stream::{SplitSink, SplitStream};
use futures_util::{SinkExt, StreamExt};
use prost::Message;
use tokio::net::TcpStream;
use tokio_tungstenite::tungstenite::Message as WsMessage;
use tokio_tungstenite::{MaybeTlsStream, WebSocketStream};

use crate::error::Error;
use crate::proto;

static CRYPTO_INIT: Once = Once::new();

fn ensure_crypto_provider() {
    CRYPTO_INIT.call_once(|| {
        let _ = rustls::crypto::ring::default_provider().install_default();
    });
}

type WsStream = WebSocketStream<MaybeTlsStream<TcpStream>>;

/// WebSocket transport for Centrifugo.
pub struct Transport {
    write: SplitSink<WsStream, WsMessage>,
    read: SplitStream<WsStream>,
}

impl Transport {
    /// Connect to a Centrifugo server.
    pub async fn connect(url: &str) -> Result<Self, Error> {
        ensure_crypto_provider();

        let ws_url = http_to_ws(url);
        let full_url = format!("{}?format=protobuf", ws_url);
        tracing::debug!("Connecting to {}", full_url);

        let (ws, _) = tokio_tungstenite::connect_async(&full_url).await?;
        let (write, read) = ws.split();

        Ok(Self { write, read })
    }

    /// Send a command and wait for reply.
    pub async fn send_command(&mut self, cmd: proto::Command) -> Result<proto::Reply, Error> {
        let data = cmd.encode_length_delimited_to_vec();
        self.write.send(WsMessage::Binary(data.into())).await?;

        loop {
            let msg = self
                .read
                .next()
                .await
                .ok_or(Error::ConnectionClosed)??;

            match msg {
                WsMessage::Binary(data) => {
                    let reply = proto::Reply::decode_length_delimited(&*data)
                        .map_err(|e| Error::Protocol(e.to_string()))?;
                    return Ok(reply);
                }
                WsMessage::Close(_) => {
                    return Err(Error::ConnectionClosed);
                }
                _ => continue,
            }
        }
    }

    /// Send raw data without waiting for reply (for pong).
    pub async fn send_raw(&mut self, data: Vec<u8>) -> Result<(), Error> {
        self.write.send(WsMessage::Binary(data.into())).await?;
        Ok(())
    }

    /// Read the next message.
    pub async fn read_message(&mut self) -> Result<proto::Reply, Error> {
        loop {
            let msg = self
                .read
                .next()
                .await
                .ok_or(Error::ConnectionClosed)??;

            match msg {
                WsMessage::Binary(data) => {
                    let reply = proto::Reply::decode_length_delimited(&*data)
                        .map_err(|e| Error::Protocol(e.to_string()))?;
                    return Ok(reply);
                }
                WsMessage::Close(frame) => {
                    if let Some(frame) = frame {
                        tracing::debug!(
                            "WebSocket closed: code={}, reason={}",
                            frame.code,
                            frame.reason
                        );
                    }
                    return Err(Error::ConnectionClosed);
                }
                WsMessage::Ping(data) => {
                    self.write.send(WsMessage::Pong(data)).await?;
                }
                _ => continue,
            }
        }
    }

    /// Close the connection.
    pub async fn close(&mut self) {
        let _ = self.write.close().await;
    }
}

fn http_to_ws(url: &str) -> String {
    url.strip_prefix("https://")
        .map(|rest| format!("wss://{rest}"))
        .or_else(|| url.strip_prefix("http://").map(|rest| format!("ws://{rest}")))
        .unwrap_or_else(|| url.to_string())
}
