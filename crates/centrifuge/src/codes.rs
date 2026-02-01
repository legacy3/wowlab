//! Protocol codes for disconnects and errors.
//!
//! Matches centrifuge-js codes exactly.

pub mod disconnect {
    pub const NORMAL: u32 = 0;
    pub const SHUTDOWN: u32 = 1;
    pub const INVALID_TOKEN: u32 = 2;
    pub const BAD_REQUEST: u32 = 3;
    pub const SERVER_ERROR: u32 = 4;
    pub const EXPIRED: u32 = 5;
    pub const SUBSCRIPTION_EXPIRED: u32 = 6;
    pub const TOO_MANY_REQUESTS: u32 = 7;
    pub const INSUFFICIENT_STATE: u32 = 8;
    pub const FORCE_DISCONNECT: u32 = 9;
    pub const CONNECTION_LIMIT: u32 = 10;
    pub const CHANNEL_LIMIT: u32 = 11;
}

pub mod error {
    pub const INTERNAL: u32 = 100;
    pub const UNAUTHORIZED: u32 = 101;
    pub const UNKNOWN_CHANNEL: u32 = 102;
    pub const PERMISSION_DENIED: u32 = 103;
    pub const METHOD_NOT_FOUND: u32 = 104;
    pub const ALREADY_SUBSCRIBED: u32 = 105;
    pub const LIMIT_EXCEEDED: u32 = 106;
    pub const BAD_REQUEST: u32 = 107;
    pub const NOT_AVAILABLE: u32 = 108;
    pub const TOKEN_EXPIRED: u32 = 109;
    pub const EXPIRED: u32 = 110;
    pub const TOO_MANY_REQUESTS: u32 = 111;
    pub const UNRECOVERABLE_POSITION: u32 = 112;
}

pub mod unsubscribe {
    pub const SERVER: u32 = 0;
    pub const INSUFFICIENT_STATE: u32 = 1;
}

pub mod ws_close {
    pub const NORMAL: u16 = 3000;
    pub const BAD_REQUEST: u16 = 3501;
}
