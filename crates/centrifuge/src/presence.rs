//! Centrifugo presence API (HTTP-based).

use std::collections::HashSet;
use std::sync::OnceLock;
use std::time::Duration;

use serde_json::json;
use uuid::Uuid;

use crate::Error;

const HTTP_TIMEOUT: Duration = Duration::from_secs(10);

static HTTP_CLIENT: OnceLock<reqwest::Client> = OnceLock::new();

fn get_http_client() -> &'static reqwest::Client {
    HTTP_CLIENT.get_or_init(|| {
        reqwest::Client::builder()
            .timeout(HTTP_TIMEOUT)
            .build()
            .unwrap_or_else(|_| reqwest::Client::new())
    })
}

#[derive(Clone)]
pub struct Presence {
    url: String,
    api_key: String,
}

impl Presence {
    pub fn new(url: impl Into<String>, api_key: impl Into<String>) -> Self {
        Self {
            url: url.into().trim_end_matches('/').to_string(),
            api_key: api_key.into(),
        }
    }

    pub async fn get_online(&self, channel: &str) -> Result<HashSet<Uuid>, Error> {
        let resp = get_http_client()
            .post(format!("{}/api/presence", self.url))
            .header("X-API-Key", &self.api_key)
            .json(&json!({ "channel": channel }))
            .send()
            .await
            .map_err(|e| Error::Http(e.to_string()))?;

        if !resp.status().is_success() {
            return Err(Error::Http(format!("HTTP {}", resp.status())));
        }

        let body: serde_json::Value = resp.json().await.map_err(|e| Error::Http(e.to_string()))?;

        if let Some(error) = body.get("error") {
            let code = error.get("code").and_then(|c| c.as_u64()).unwrap_or(0) as u32;
            let message = error
                .get("message")
                .and_then(|m| m.as_str())
                .unwrap_or("unknown")
                .to_string();
            return Err(Error::Server {
                code,
                message,
                temporary: false,
            });
        }

        let ids = body
            .get("result")
            .and_then(|r| r.get("presence"))
            .and_then(|p| p.as_object())
            .map(|obj| {
                obj.values()
                    .filter_map(|v| v.get("user").and_then(|u| u.as_str()))
                    .filter_map(|s| s.parse::<Uuid>().ok())
                    .collect()
            })
            .unwrap_or_default();

        Ok(ids)
    }
}
