use serde::{Deserialize, Serialize};
use std::time::Duration;
use uuid::Uuid;

#[derive(Clone)]
pub struct ApiClient {
    http: reqwest::Client,
    api_url: String,
}

const REQUEST_TIMEOUT: Duration = Duration::from_secs(30);
const CONNECT_TIMEOUT: Duration = Duration::from_secs(10);

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RegisterResponse {
    pub id: Uuid,
    pub claim_code: String,
}

#[derive(Debug, thiserror::Error)]
pub enum ApiError {
    #[error("HTTP error: {0}")]
    Http(#[from] reqwest::Error),
    #[error("API error: {0}")]
    Api(String),
}

impl ApiClient {
    pub fn new(api_url: String) -> Self {
        let http = reqwest::Client::builder()
            .timeout(REQUEST_TIMEOUT)
            .connect_timeout(CONNECT_TIMEOUT)
            .build()
            .expect("Failed to create HTTP client");

        Self { http, api_url }
    }

    pub async fn register_node(
        &self,
        hostname: &str,
        total_cores: i32,
        enabled_cores: i32,
        platform: &str,
        version: &str,
    ) -> Result<RegisterResponse, ApiError> {
        #[derive(Serialize)]
        #[serde(rename_all = "camelCase")]
        struct Request<'a> {
            hostname: &'a str,
            total_cores: i32,
            enabled_cores: i32,
            platform: &'a str,
            version: &'a str,
        }

        let url = format!("{}/functions/v1/node-register", self.api_url);
        let response = self
            .http
            .post(&url)
            .json(&Request {
                hostname,
                total_cores,
                enabled_cores,
                platform,
                version,
            })
            .send()
            .await?;

        if !response.status().is_success() {
            let error = response.text().await.unwrap_or_default();
            return Err(ApiError::Api(error));
        }

        Ok(response.json().await?)
    }

    pub async fn set_online(&self, node_id: Uuid) -> Result<(), ApiError> {
        #[derive(Serialize)]
        #[serde(rename_all = "camelCase")]
        struct Request {
            node_id: Uuid,
            status: &'static str,
        }

        let url = format!("{}/functions/v1/node-heartbeat", self.api_url);
        let response = self
            .http
            .post(&url)
            .json(&Request {
                node_id,
                status: "online",
            })
            .send()
            .await?;

        if !response.status().is_success() {
            let error = response.text().await.unwrap_or_default();
            return Err(ApiError::Api(error));
        }

        Ok(())
    }
}
