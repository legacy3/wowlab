//! Error types.

use crate::codes;

#[derive(Debug, thiserror::Error)]
pub enum Error {
    #[error("WebSocket error: {0}")]
    WebSocket(#[from] tokio_tungstenite::tungstenite::Error),

    #[error("HTTP error: {0}")]
    Http(String),

    #[error("Protocol error: {0}")]
    Protocol(String),

    #[error("Server error {code}: {message}")]
    Server {
        code: u32,
        message: String,
        temporary: bool,
    },

    #[error("Connection closed")]
    ConnectionClosed,

    #[error("Not connected")]
    NotConnected,

    #[error("Timeout")]
    Timeout,

    #[error("No ping from server")]
    NoPing,

    #[error("Channel closed")]
    ChannelClosed,

    #[error("Subscription not found: {0}")]
    SubscriptionNotFound(String),

    #[error("Already subscribed: {0}")]
    AlreadySubscribed(String),
}

impl Error {
    pub fn is_temporary(&self) -> bool {
        match self {
            Error::Server {
                code, temporary, ..
            } => {
                // Server's temporary flag, or codes < 100 are temporary per protocol
                *temporary || *code < 100
            }
            Error::WebSocket(_) => true,
            Error::Timeout => true,
            Error::NoPing => true,
            Error::ConnectionClosed => true,
            Error::ChannelClosed => true,
            _ => false,
        }
    }

    pub fn requires_token_refresh(&self) -> bool {
        matches!(
            self,
            Error::Server {
                code: codes::error::TOKEN_EXPIRED,
                ..
            }
        )
    }

    pub(crate) fn from_proto(err: crate::proto::Error) -> Self {
        Error::Server {
            code: err.code,
            message: err.message,
            temporary: err.temporary,
        }
    }
}
