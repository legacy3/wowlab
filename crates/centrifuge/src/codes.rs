//! Protocol codes for disconnects and errors.
//!
//! Matches centrifuge-js codes exactly.

/// Disconnect codes sent by server.
pub mod disconnect {
    /// Normal disconnect initiated by client.
    pub const NORMAL: u32 = 0;
    /// Server shutting down.
    pub const SHUTDOWN: u32 = 1;
    /// Invalid token.
    pub const INVALID_TOKEN: u32 = 2;
    /// Bad request format.
    pub const BAD_REQUEST: u32 = 3;
    /// Internal server error.
    pub const SERVER_ERROR: u32 = 4;
    /// Token expired.
    pub const EXPIRED: u32 = 5;
    /// Subscription token expired.
    pub const SUBSCRIPTION_EXPIRED: u32 = 6;
    /// Too many requests.
    pub const TOO_MANY_REQUESTS: u32 = 7;
    /// Unsubscribe due to insufficient state.
    pub const INSUFFICIENT_STATE: u32 = 8;
    /// Force disconnect.
    pub const FORCE_DISCONNECT: u32 = 9;
    /// Connection limit reached.
    pub const CONNECTION_LIMIT: u32 = 10;
    /// Channel limit reached.
    pub const CHANNEL_LIMIT: u32 = 11;
}

/// Error codes in command replies.
pub mod error {
    /// Internal server error.
    pub const INTERNAL: u32 = 100;
    /// Unauthorized.
    pub const UNAUTHORIZED: u32 = 101;
    /// Unknown channel.
    pub const UNKNOWN_CHANNEL: u32 = 102;
    /// Permission denied.
    pub const PERMISSION_DENIED: u32 = 103;
    /// Method not found.
    pub const METHOD_NOT_FOUND: u32 = 104;
    /// Already subscribed.
    pub const ALREADY_SUBSCRIBED: u32 = 105;
    /// Limit exceeded.
    pub const LIMIT_EXCEEDED: u32 = 106;
    /// Bad request.
    pub const BAD_REQUEST: u32 = 107;
    /// Not available.
    pub const NOT_AVAILABLE: u32 = 108;
    /// Token expired.
    pub const TOKEN_EXPIRED: u32 = 109;
    /// Expired.
    pub const EXPIRED: u32 = 110;
    /// Too many requests.
    pub const TOO_MANY_REQUESTS: u32 = 111;
    /// Unrecoverable position.
    pub const UNRECOVERABLE_POSITION: u32 = 112;
}

/// Unsubscribe codes.
pub mod unsubscribe {
    /// Unsubscribed by server.
    pub const SERVER: u32 = 0;
    /// Insufficient state.
    pub const INSUFFICIENT_STATE: u32 = 1;
}

/// WebSocket close codes used by Centrifugo.
pub mod ws_close {
    /// Normal closure.
    pub const NORMAL: u16 = 3000;
    /// Bad request - malformed protocol message.
    pub const BAD_REQUEST: u16 = 3501;
}
