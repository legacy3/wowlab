//! JWT token generation for Centrifugo connections.

use jsonwebtoken::{encode, EncodingKey, Header};

const TOKEN_TTL_SECS: i64 = 24 * 60 * 60;

#[derive(serde::Serialize)]
struct Claims {
    sub: String,
    exp: i64,
}

/// Generate a connection token for Centrifugo.
pub fn generate(subject: &str, secret: &str) -> Result<String, jsonwebtoken::errors::Error> {
    let exp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs() as i64
        + TOKEN_TTL_SECS;

    let claims = Claims {
        sub: subject.to_string(),
        exp,
    };

    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(secret.as_bytes()),
    )
}
