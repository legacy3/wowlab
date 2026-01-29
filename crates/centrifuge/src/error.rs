//! Error types.

use crate::codes;

/// Client errors.
#[derive(Debug, thiserror::Error)]
pub enum Error {
    /// WebSocket error.
    #[error("WebSocket error: {0}")]
    WebSocket(#[from] tokio_tungstenite::tungstenite::Error),

    /// HTTP error.
    #[error("HTTP error: {0}")]
    Http(String),

    /// Protocol encoding/decoding error.
    #[error("Protocol error: {0}")]
    Protocol(String),

    /// Server returned an error.
    #[error("Server error {code}: {message}")]
    Server {
        code: u32,
        message: String,
        temporary: bool,
    },

    /// Connection closed.
    #[error("Connection closed")]
    ConnectionClosed,

    /// Not connected.
    #[error("Not connected")]
    NotConnected,

    /// Operation timed out.
    #[error("Timeout")]
    Timeout,

    /// No ping received from server within timeout.
    #[error("No ping from server")]
    NoPing,

    /// Channel send error.
    #[error("Channel closed")]
    ChannelClosed,

    /// Subscription not found.
    #[error("Subscription not found: {0}")]
    SubscriptionNotFound(String),

    /// Already subscribed.
    #[error("Already subscribed: {0}")]
    AlreadySubscribed(String),
}

impl Error {
    /// Returns true if this is a temporary error that may succeed on retry.
    pub fn is_temporary(&self) -> bool {
        match self {
            Error::Server { code, temporary, .. } => {
                // Temporary flag from server, or codes < 100 are temporary
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

    /// Returns true if the token needs to be refreshed.
    pub fn requires_token_refresh(&self) -> bool {
        matches!(
            self,
            Error::Server {
                code: codes::error::TOKEN_EXPIRED,
                ..
            }
        )
    }

    /// Create a server error from proto Error.
    pub(crate) fn from_proto(err: crate::proto::Error) -> Self {
        Error::Server {
            code: err.code,
            message: err.message,
            temporary: err.temporary,
        }
    }
}
