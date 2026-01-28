//! Error types for the Centrifugo client.

use thiserror::Error;

#[derive(Debug, Error)]
pub enum Error {
    #[error("WebSocket error: {0}")]
    WebSocket(Box<tokio_tungstenite::tungstenite::Error>),

    #[error("Connection closed")]
    ConnectionClosed,

    #[error("Protocol error: {0}")]
    Protocol(String),

    #[error("Server error {code}: {message}")]
    Server { code: u32, message: String },

    #[error("Timeout")]
    Timeout,

    #[error("HTTP error: {0}")]
    Http(#[from] reqwest::Error),

    #[error("HTTP status {status}: {message}")]
    HttpStatus { status: u16, message: String },

    #[error("JSON error: {0}")]
    Json(#[from] serde_json::Error),

    #[error("Not connected")]
    NotConnected,
}

impl From<tokio_tungstenite::tungstenite::Error> for Error {
    fn from(err: tokio_tungstenite::tungstenite::Error) -> Self {
        Error::WebSocket(Box::new(err))
    }
}
